import type { Context } from 'hono';
import type { HonoEnv, QueryDefinition, Subscription, QueryParams } from './types';
import { WebSocket, WebSocketPair } from '@cloudflare/workers-types';

export async function handleWebSocketUpgrade(
  c: Context<HonoEnv>,
  queryDef: QueryDefinition,
  subscription: Subscription
): Promise<Response> {
  // Validate upgrade request
  const upgradeHeader = c.req.header('Upgrade');
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return c.json({
      type: 'epcisException:ValidationException',
      title: 'Invalid upgrade request',
      status: 400,
      detail: 'WebSocket upgrade required'
    }, 400);
  }

  // Create WebSocket pair using Cloudflare Workers
  const pair = new WebSocketPair();
  const server = pair[1];
  const client = pair[0];

  // Handle WebSocket connection
  server.accept();
  server.addEventListener('message', async event => {
    try {
      // Handle incoming messages (e.g., client requesting data)
      const message = JSON.parse(event.data as string);
      if (message.type === 'getEvents') {
        const queryParams: QueryParams = {
          ...queryDef.query,
          ...message.params
        };

        const events = await c.get('clickhouse').queryEvents(queryParams);

        server.send(JSON.stringify({
          type: 'events',
          data: {
            '@context': 'https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld',
            type: 'EPCISQueryDocument',
            schemaVersion: '2.0',
            creationDate: new Date().toISOString(),
            epcisBody: {
              queryName: subscription.queryName,
              queryResults: events
            }
          }
        }));
      }
    } catch (error) {
      if (error instanceof Error) {
        server.send(JSON.stringify({
          type: 'error',
          error: {
            type: 'epcisException:ImplementationException',
            title: 'WebSocket error',
            status: 500,
            detail: error.message
          }
        }));
      }
    }
  });

  return new Response(null, {
    status: 101,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade'
    },
    webSocket: client
  } as ResponseInit & { webSocket: WebSocket });
}
