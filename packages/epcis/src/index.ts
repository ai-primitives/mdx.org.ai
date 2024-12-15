import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { Context, MiddlewareHandler } from 'hono';
import { ClickhouseClient } from './clickhouse';
import { eventValidationMiddleware } from './middleware/validation';
import { rateLimitMiddleware } from './middleware/rate-limit';
import type { EPCISEvent, HonoEnv } from './types';

const app = new Hono<HonoEnv>();

// Initialize Clickhouse client middleware
const clickhouseMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const { CLICKHOUSE_URL, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD } = c.env;

  if (!CLICKHOUSE_URL || !CLICKHOUSE_USER || !CLICKHOUSE_PASSWORD) {
    throw new Error('Missing required Clickhouse environment variables');
  }

  if (!c.get('clickhouse')) {
    const client = new ClickhouseClient(
      CLICKHOUSE_URL,
      CLICKHOUSE_USER,
      CLICKHOUSE_PASSWORD
    );
    c.set('clickhouse', client);
  }
  await next();
};

// Add middleware
app.use('*', clickhouseMiddleware);
app.use('*', cors());
app.use('/capture', rateLimitMiddleware);
app.use('/capture', eventValidationMiddleware);

// Discovery endpoints
app.options('/', async (c: Context) => {
  c.header('GS1-EPCIS-Version', '2.0.0');
  c.header('GS1-CBV-Version', '2.0.0');
  c.header('GS1-EPCIS-Min', '2.0.0');
  c.header('GS1-EPCIS-Max', '2.0.0');
  c.header('GS1-Vendor-Version', '1.0.0');
  return c.text('', 204);
});

app.get('/', async (c: Context) => {
  return c.json({
    resources: [
      '/events',
      '/capture',
      '/queries',
      '/subscriptions'
    ]
  });
});

// Capture endpoints
app.options('/capture', async (c: Context) => {
  c.header('GS1-EPCIS-Capture-Limit', '1000');
  c.header('GS1-EPCIS-Capture-File-Size-Limit', '10485760'); // 10MB
  c.header('GS1-Capture-Error-Behaviour', 'rollback');
  return c.text('', 204);
});

app.post('/capture', async (c: Context<HonoEnv>) => {
  try {
    const events = await c.req.json<EPCISEvent[]>();
    const clickhouse = c.get('clickhouse');

    // Store events in both KV and Clickhouse
    await Promise.all([
      c.env.EPCIS_KV.put(`event-${Date.now()}`, JSON.stringify(events)),
      ...events.map(event => clickhouse.insertEvent(event))
    ]);

    return c.json({ success: true }, 201);
  } catch (error) {
    throw new HTTPException(400, { message: 'Invalid event data' });
  }
});

// Query endpoints
app.post('/queries', async (c: Context<HonoEnv>) => {
  try {
    const query = await c.req.json();
    const clickhouse = c.get('clickhouse');
    const results = await clickhouse.queryEvents(query);
    return c.json({ results });
  } catch (error) {
    throw new HTTPException(400, { message: 'Invalid query' });
  }
});

// Events endpoints
app.get('/events', async (c: Context<HonoEnv>) => {
  const clickhouse = c.get('clickhouse');
  const perPage = parseInt(c.req.query('perPage') || '30');
  const nextPageToken = c.req.query('nextPageToken') || '0';

  const events = await clickhouse.queryEvents({
    limit: perPage,
    offset: parseInt(nextPageToken)
  });

  return c.json({
    events,
    nextPageToken: events.length === perPage ? (parseInt(nextPageToken) + perPage).toString() : null
  });
});

app.get('/events/:eventId', async (c: Context<HonoEnv>) => {
  const eventId = c.req.param('eventId');
  const clickhouse = c.get('clickhouse');
  const event = await clickhouse.queryEvents({ eventId });
  return c.json(event ? event[0] : {});
});

// Error handling
app.onError((err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return c.json({
      error: err.message
    }, err.status);
  }

  return c.json({
    error: 'Internal Server Error'
  }, 500);
});

export default app;
