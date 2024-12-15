import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { Context, MiddlewareHandler } from 'hono';
import { ClickhouseClient } from './clickhouse';
import { eventValidationMiddleware } from './middleware/validation';
import { rateLimitMiddleware } from './middleware/rate-limit';
import captureRoutes from './routes/capture';
import queryRoutes from './routes/query';
import type { HonoEnv } from './types';

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

// Mount routes
app.route('/capture', captureRoutes);
app.route('/queries', queryRoutes);

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

// Error handling with RFC7807 Problem Details format
app.onError((err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return c.json({
      type: `https://ref.gs1.org/standards/epcis/exceptions#${err.name}`,
      title: err.message,
      status: err.status,
      detail: err.message,
      instance: c.req.url
    }, err.status);
  }

  return c.json({
    type: 'https://ref.gs1.org/standards/epcis/exceptions#ImplementationException',
    title: 'Internal Server Error',
    status: 500,
    detail: err.message,
    instance: c.req.url
  }, 500);
});

export default app;
