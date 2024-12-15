import type { Context } from 'hono';
import type { HonoEnv, QueryDefinition, Subscription } from './types';

// Simplified WebSocket implementation for development
export async function handleWebSocketUpgrade(
  c: Context<HonoEnv>,
  queryDef: QueryDefinition,
  subscription: Subscription
): Promise<Response> {
  return c.json({
    type: 'epcisException:ImplementationException',
    title: 'WebSocket not available in development',
    status: 501,
    detail: 'WebSocket functionality is not available in local development mode'
  }, 501);
}
