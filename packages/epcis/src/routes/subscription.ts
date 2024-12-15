import { Context, Hono } from 'hono';
import { z } from 'zod';
import type { HonoEnv, QueryDefinition, Subscription, EPCISEvent } from '../types';
import { validateQueryDefinition } from '../validation/schema';
import { handleWebSocketUpgrade } from '../websocket';

const app = new Hono<HonoEnv>();

const subscriptionSchema = z.object({
  destination: z.string().url(),
  schedule: z.string().regex(/^((\d+,)*\d+|(\d+|\*)\/\d+|\*|\d+)\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)$/),
  signatureToken: z.string().optional(),
  reportIfEmpty: z.boolean().default(false),
  initialRecordTime: z.string().datetime().optional(),
  stream: z.boolean().default(false)
});

function createProblemResponse(type: string, title: string, status: number, detail?: string) {
  return {
    type: `https://ref.gs1.org/standards/epcis/exceptions#${type}`,
    title,
    status,
    detail,
    instance: undefined
  };
}

// Add OPTIONS endpoint for subscription metadata
app.options('/:queryName/subscriptions', async (c: Context<HonoEnv>) => {
  c.header('GS1-EPCIS-Version', '2.0.0');
  c.header('GS1-CBV-Version', '2.0.0');
  c.header('GS1-EPCIS-Min', '2.0.0');
  c.header('GS1-EPCIS-Max', '2.0.0');
  c.header('GS1-Vendor-Version', '1.0.0');
  c.header('Allow', 'GET, POST, OPTIONS');
  return c.text('', 204);
});

// Create subscription
app.post('/:queryName/subscriptions', async (c: Context<HonoEnv>) => {
  try {
    const { queryName } = c.req.param();
    const body = await c.req.json();

    // Validate subscription parameters
    const subscriptionParams = await subscriptionSchema.parseAsync(body);

    // Get query definition
    const clickhouse = c.get('clickhouse');
    const queryDef = await clickhouse.getQuery(queryName);

    if (!queryDef) {
      return c.json(
        createProblemResponse(
          'NoSuchNameException',
          'Query not found',
          404,
          `No query found with name: ${queryName}`
        ),
        404
      );
    }

    // Create subscription
    const subscription = await clickhouse.createSubscription(queryName, subscriptionParams);

    // If streaming is requested, upgrade to WebSocket
    if (subscriptionParams.stream) {
      return handleWebSocketUpgrade(c, queryDef, subscription);
    }

    c.header('Location', `/queries/${queryName}/subscriptions/${subscription.id}`);
    return c.json(subscription, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        createProblemResponse(
          'ValidationException',
          'Invalid subscription parameters',
          400,
          error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
        ),
        400
      );
    }

    throw error;
  }
});

// Get subscription details
app.get('/:queryName/subscriptions/:subscriptionId', async (c: Context<HonoEnv>) => {
  const { queryName, subscriptionId } = c.req.param();
  const clickhouse = c.get('clickhouse');

  const subscription = await clickhouse.getSubscription(queryName, subscriptionId);

  if (!subscription) {
    return c.json(
      createProblemResponse(
        'NoSuchResourceException',
        'Subscription not found',
        404,
        `No subscription found with ID: ${subscriptionId}`
      ),
      404
    );
  }

  return c.json(subscription);
});

// Delete subscription
app.delete('/:queryName/subscriptions/:subscriptionId', async (c: Context<HonoEnv>) => {
  const { queryName, subscriptionId } = c.req.param();
  const clickhouse = c.get('clickhouse');

  const success = await clickhouse.deleteSubscription(queryName, subscriptionId);

  if (!success) {
    return c.json(
      createProblemResponse(
        'NoSuchResourceException',
        'Subscription not found',
        404,
        `No subscription found with ID: ${subscriptionId}`
      ),
      404
    );
  }

  return c.text('', 204);
});

// Add webhook delivery for scheduled subscriptions
async function deliverWebhook(subscription: Subscription, events: EPCISEvent[]): Promise<void> {
  const response = await fetch(subscription.destination, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(subscription.signatureToken && {
        'X-EPCIS-Signature': subscription.signatureToken
      })
    },
    body: JSON.stringify({
      '@context': 'https://ref.gs1.org/standards/epcis/epcis-context.jsonld',
      type: 'EPCISQueryDocument',
      schemaVersion: '2.0',
      creationDate: new Date().toISOString(),
      epcisBody: {
        queryName: subscription.queryName,
        subscriptionID: subscription.id,
        queryResults: events
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed: ${response.statusText}`);
  }
}

export default app;
