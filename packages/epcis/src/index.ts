import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { Context, MiddlewareHandler } from 'hono';
import { ClickhouseClient } from './clickhouse';
import { eventValidationMiddleware } from './middleware/validation';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { MockRateLimiter } from './services/mock-rate-limiter';
import captureRoutes from './routes/capture';
import queryRoutes from './routes/query';
import subscriptionRoutes from './routes/subscription';
import type { HonoEnv } from './types';

const app = new Hono<HonoEnv>();

// Initialize mock rate limiter for development
const isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
  const mockRateLimiter = new MockRateLimiter(1000, 60);
  app.use('*', async (c, next) => {
    c.env.epcis_api = mockRateLimiter;
    await next();
  });
}

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

// Add CORS middleware
app.use('*', cors());

// Test endpoint for rate limiting
app.get('/test-rate-limit', rateLimitMiddleware, async (c) => {
  return c.json({ message: 'Rate limit test endpoint', timestamp: Date.now() });
});

// Add middleware for EPCIS routes
app.use('/capture', rateLimitMiddleware);
app.use('/capture', clickhouseMiddleware);
app.use('/capture', eventValidationMiddleware);
app.use('/queries', clickhouseMiddleware);
app.use('/subscriptions', clickhouseMiddleware);

// Mount routes
app.route('/capture', captureRoutes);
app.route('/queries', queryRoutes);
app.route('/queries', subscriptionRoutes);

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
      '/subscriptions',
      '/test-rate-limit'
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
