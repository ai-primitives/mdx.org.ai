import { Hono } from 'hono';
import { z } from 'zod';
import { webcrypto } from 'node:crypto';
import { EPCISDocument, QueryDefinition, QueryParams, Subscription } from '../types';
import { validateQueryDefinition } from '../validation/schema';
import { handleWebSocketUpgrade } from '../websocket';
import type { HonoEnv } from '../types';

const EPCIS_CONTEXT = 'https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld';

const app = new Hono<HonoEnv>();

// GET /queries - List available queries
app.get('/queries', async (c) => {
  const queries = await c.get('clickhouse').listQueries();
  return c.json({
    '@context': EPCIS_CONTEXT,
    type: 'QueryList',
    queries
  });
});

// POST /queries - Create a named query
app.post('/queries', async (c) => {
  const body = await c.req.json();

  // Validate query definition
  const queryDef = await validateQueryDefinition(body);
  if (!queryDef.success) {
    return c.json({
      type: 'epcisException:ValidationException',
      title: 'Invalid query definition',
      status: 400,
      detail: queryDef.error.message
    }, 400);
  }

  const queryName = await c.get('clickhouse').createQuery(queryDef.data);
  c.header('Location', `/queries/${queryName}`);

  return c.json({
    '@context': EPCIS_CONTEXT,
    type: 'QueryCreated',
    queryName
  }, 201);
});

// GET /queries/{queryName} - Get query definition
app.get('/queries/:queryName', async (c) => {
  const { queryName } = c.req.param();
  const query = await c.get('clickhouse').getQuery(queryName);

  if (!query) {
    return c.json({
      type: 'epcisException:NoSuchNameException',
      title: 'Query not found',
      status: 404
    }, 404);
  }

  return c.json({
    '@context': EPCIS_CONTEXT,
    type: 'QueryDefinition',
    name: queryName,
    query: query.query
  });
});

// GET /queries/{queryName}/events - Execute query and return events
app.get('/queries/:queryName/events', async (c) => {
  const { queryName } = c.req.param();
  const params = c.req.query();

  // Check for WebSocket upgrade request
  if (c.req.header('Upgrade')?.toLowerCase() === 'websocket') {
    const queryDef = await c.get('clickhouse').getQuery(queryName);
    if (!queryDef) {
      return c.json({
        type: 'epcisException:NoSuchNameException',
        title: 'Query not found',
        status: 404
      }, 404);
    }

    // Create subscription for WebSocket connection
    const subscription: Subscription = {
      id: webcrypto.randomUUID(),
      queryName: queryDef.name,
      destination: c.req.url,
      stream: true,
      reportIfEmpty: false,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    return handleWebSocketUpgrade(c, queryDef, subscription);
  }

  // Get query definition
  const query = await c.get('clickhouse').getQuery(queryName);
  if (!query) {
    return c.json({
      type: 'epcisException:NoSuchNameException',
      title: 'Query not found',
      status: 404
    }, 404);
  }

  try {
    // Convert query parameters to QueryParams format
    const queryParams: QueryParams = {
      ...query.query,
      perPage: params.perPage ? parseInt(params.perPage) : undefined,
      nextPageToken: params.nextPageToken
    };

    const events = await c.get('clickhouse').queryEvents(queryParams);

    return c.json({
      '@context': EPCIS_CONTEXT,
      type: 'EPCISQueryDocument',
      schemaVersion: '2.0',
      creationDate: new Date().toISOString(),
      epcisBody: {
        queryName,
        queryResults: events
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return c.json({
        type: 'epcisException:QueryTooComplexException',
        title: 'Query execution failed',
        status: 413,
        detail: error.message
      }, 413);
    }
    return c.json({
      type: 'epcisException:ImplementationException',
      title: 'Internal server error',
      status: 500
    }, 500);
  }
});

export default app;
