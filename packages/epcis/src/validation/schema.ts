import { z } from 'zod';
import type { EPCISEvent, QueryDefinition } from '../types';

// Define Zod schemas based on EPCIS query schema
const baseEventSchema = z.object({
  type: z.enum(['ObjectEvent', 'AggregationEvent', 'TransactionEvent', 'TransformationEvent', 'AssociationEvent']),
  eventTime: z.string().datetime(),
  eventTimeZoneOffset: z.string().regex(/^[+-]\d{2}:\d{2}$/),
  action: z.enum(['ADD', 'OBSERVE', 'DELETE']),
  bizStep: z.string().optional(),
  disposition: z.string().optional(),
  readPoint: z.object({ id: z.string() }).optional(),
  businessLocation: z.object({ id: z.string() }).optional()
});

const quantityElementSchema = z.object({
  epcClass: z.string(),
  quantity: z.number(),
  uom: z.string().optional()
});

const objectEventSchema = baseEventSchema.extend({
  type: z.literal('ObjectEvent'),
  epcList: z.array(z.string()).optional(),
  quantityList: z.array(quantityElementSchema).optional()
});

const aggregationEventSchema = baseEventSchema.extend({
  type: z.literal('AggregationEvent'),
  parentID: z.string().optional(),
  childEPCs: z.array(z.string()).optional(),
  childQuantityList: z.array(quantityElementSchema).optional()
});

const transactionEventSchema = baseEventSchema.extend({
  type: z.literal('TransactionEvent'),
  bizTransactionList: z.array(z.object({
    type: z.string(),
    bizTransaction: z.string()
  })),
  parentID: z.string().optional(),
  epcList: z.array(z.string()).optional(),
  quantityList: z.array(quantityElementSchema).optional()
});

const transformationEventSchema = baseEventSchema.extend({
  type: z.literal('TransformationEvent'),
  inputEPCList: z.array(z.string()).optional(),
  inputQuantityList: z.array(quantityElementSchema).optional(),
  outputEPCList: z.array(z.string()).optional(),
  outputQuantityList: z.array(quantityElementSchema).optional(),
  transformationID: z.string().optional()
});

const associationEventSchema = baseEventSchema.extend({
  type: z.literal('AssociationEvent'),
  parentID: z.string(),
  childEPCs: z.array(z.string()).optional(),
  childQuantityList: z.array(quantityElementSchema).optional()
});

export const eventSchema = z.discriminatedUnion('type', [
  objectEventSchema,
  aggregationEventSchema,
  transactionEventSchema,
  transformationEventSchema,
  associationEventSchema
]);

export async function validateEvent(event: EPCISEvent): Promise<void> {
  try {
    await eventSchema.parseAsync(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Event validation failed: ${details}`);
    }
    throw error;
  }
}

export const queryDefinitionSchema = z.object({
  name: z.string().min(1),
  query: z.object({
    eventTypes: z.array(z.string()).optional(),
    GE_eventTime: z.string().datetime().optional(),
    LT_eventTime: z.string().datetime().optional(),
    GE_recordTime: z.string().datetime().optional(),
    LT_recordTime: z.string().datetime().optional(),
    EQ_action: z.array(z.enum(['ADD', 'OBSERVE', 'DELETE'])).optional(),
    EQ_bizStep: z.array(z.string()).optional(),
    EQ_disposition: z.array(z.string()).optional(),
    EQ_readPoint: z.array(z.string()).optional(),
    EQ_bizLocation: z.array(z.string()).optional(),
    MATCH_epc: z.array(z.string()).optional(),
    MATCH_epcClass: z.array(z.string()).optional(),
    orderBy: z.enum(['eventTime', 'recordTime']).optional(),
    orderDirection: z.enum(['ASC', 'DESC']).optional(),
    eventCountLimit: z.number().positive().optional(),
    maxEventCount: z.number().positive().optional()
  })
});

export async function validateQueryDefinition(query: unknown): Promise<z.SafeParseReturnType<unknown, QueryDefinition>> {
  return queryDefinitionSchema.safeParseAsync(query);
}
