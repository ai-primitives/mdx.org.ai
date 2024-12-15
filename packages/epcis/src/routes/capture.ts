import { Context, Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import type { EPCISDocument, CaptureJob, HonoEnv, EPCISEvent } from '../types';
import { ClickhouseClient } from '../clickhouse';
import { validateEvent } from '../validation/schema';

const app = new Hono<HonoEnv>();

const captureJobs = new Map<string, CaptureJob>();

function createProblemResponse(type: string, title: string, status: number, detail?: string) {
  return {
    type: `https://ref.gs1.org/standards/epcis/exceptions#${type}`,
    title,
    status,
    detail,
    instance: undefined
  };
}

async function startCaptureJob(document: EPCISDocument, errorBehaviour: 'rollback' | 'proceed'): Promise<CaptureJob> {
  const captureID = uuidv4();
  const job: CaptureJob = {
    captureID,
    createdAt: new Date().toISOString(),
    running: true,
    success: true,
    captureErrorBehaviour: errorBehaviour,
    errors: []
  };

  captureJobs.set(captureID, job);
  return job;
}

async function processCaptureJob(c: Context<HonoEnv>, job: CaptureJob, document: EPCISDocument): Promise<void> {
  try {
    if (!document.epcisBody?.eventList) {
      throw new Error('Invalid EPCIS document: missing eventList');
    }

    const contextUrl = 'https://ref.gs1.org/standards/epcis/epcis-context.jsonld';
    if (typeof document['@context'] !== 'string' && !document['@context']?.includes(contextUrl)) {
      throw new Error(`Invalid EPCIS document: missing or invalid @context. Must include ${contextUrl}`);
    }

    const clickhouse = c.get('clickhouse');

    for (const event of document.epcisBody.eventList) {
      try {
        await validateEvent(event);
        const eventWithCapture = {
          ...event,
          captureID: job.captureID,
          recordTime: new Date().toISOString()
        };
        await clickhouse.insertEvent(eventWithCapture);
      } catch (error) {
        job.success = false;
        job.errors?.push(createProblemResponse(
          'ValidationException',
          'Event validation failed',
          400,
          error instanceof Error ? error.message : 'Unknown error'
        ));

        if (job.captureErrorBehaviour === 'rollback') {
          await clickhouse.rollbackEvents(job.captureID);
          throw error;
        }
      }
    }
  } catch (error) {
    job.success = false;
    job.errors?.push(createProblemResponse(
      'ValidationException',
      'Error validating EPCIS document',
      400,
      error instanceof Error ? error.message : 'Unknown error'
    ));

    if (job.captureErrorBehaviour === 'rollback') {
      throw error;
    }
  } finally {
    job.running = false;
    job.finishedAt = new Date().toISOString();
  }
}

app.post('/', async (c: Context<HonoEnv>) => {
  try {
    const document = await c.req.json() as EPCISDocument;
    const errorBehaviour = c.req.header('GS1-Capture-Error-Behaviour') || 'rollback';

    if (errorBehaviour !== 'rollback' && errorBehaviour !== 'proceed') {
      return c.json(
        createProblemResponse(
          'ValidationException',
          'Invalid GS1-Capture-Error-Behaviour header',
          400,
          'Value must be either "rollback" or "proceed"'
        ),
        400
      );
    }

    const job = await startCaptureJob(document, errorBehaviour as 'rollback' | 'proceed');

    processCaptureJob(c, job, document).catch(console.error);

    c.header('Location', `/capture/${job.captureID}`);
    return c.json({ captureID: job.captureID }, 202);
  } catch (error) {
    return c.json(
      createProblemResponse(
        'ValidationException',
        'Invalid request body',
        400,
        error instanceof Error ? error.message : 'Unknown error'
      ),
      400
    );
  }
});

app.get('/:captureID', async (c: Context<HonoEnv>) => {
  const { captureID } = c.req.param();
  const job = captureJobs.get(captureID);

  if (!job) {
    return c.json(
      createProblemResponse(
        'NoSuchResourceException',
        'Capture job not found',
        404,
        `No capture job found with ID: ${captureID}`
      ),
      404
    );
  }

  return c.json(job);
});

export default app;
