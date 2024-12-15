import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { EPCISEvent, HonoEnv } from '../types';

const validateEvent = (event: EPCISEvent): { valid: boolean; reason?: string } => {
  // Required fields validation
  if (!event.eventID || !event.eventType || !event.eventTime || !event.tenantId) {
    return { valid: false, reason: 'Missing required fields' };
  }

  // Event type validation
  const validEventTypes = [
    'ObjectEvent',
    'AggregationEvent',
    'TransactionEvent',
    'TransformationEvent'
  ];
  if (!validEventTypes.includes(event.eventType)) {
    return { valid: false, reason: 'Invalid event type' };
  }

  // Action validation (if present)
  if (event.action && !['ADD', 'OBSERVE', 'DELETE'].includes(event.action)) {
    return { valid: false, reason: 'Invalid action value' };
  }

  // Date format validation
  try {
    new Date(event.eventTime).toISOString();
    if (event.recordTime) {
      new Date(event.recordTime).toISOString();
    }
  } catch {
    return { valid: false, reason: 'Invalid date format' };
  }

  return { valid: true };
};

export const eventValidationMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  if (c.req.method === 'POST' && c.req.path === '/capture') {
    try {
      const events = await c.req.json<EPCISEvent[]>();

      // Validate array structure
      if (!Array.isArray(events)) {
        throw new HTTPException(400, { message: 'Events must be an array' });
      }

      // Validate batch size
      const batchLimit = 1000; // Matches GS1-EPCIS-Capture-Limit header
      if (events.length > batchLimit) {
        throw new HTTPException(413, {
          message: `Batch size exceeds limit of ${batchLimit} events`
        });
      }

      // Validate each event
      const invalidEvents = events.map(event => ({
        eventId: event.eventID,
        validation: validateEvent(event)
      })).filter(result => !result.validation.valid);

      if (invalidEvents.length > 0) {
        throw new HTTPException(400, {
          message: `Invalid events detected: ${invalidEvents.map(e =>
            `${e.eventId} (${e.validation.reason})`).join(', ')}`
        });
      }

      // Add validation timestamp
      c.set('validatedAt', new Date().toISOString());
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(400, { message: 'Invalid request body' });
    }
  }
  await next();
};
