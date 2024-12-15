import { DataFormat } from '@clickhouse/client';
import { ClickhouseClient } from './clickhouse';
import type { Env as HonoBaseEnv } from 'hono/types';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

export interface Env extends Record<string, unknown> {
  EPCIS_KV: KVNamespace;
  EPCIS_ANALYTICS: AnalyticsEngineDataset;
  CLICKHOUSE_URL: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  epcis_capture: RateLimiter;
  epcis_query: RateLimiter;
  epcis_subscription: RateLimiter;
}

export interface Variables {
  clickhouse: ClickhouseClient;
  validatedAt?: string;
}

export type HonoEnv = {
  Bindings: Env;
  Variables: Variables;
} & HonoBaseEnv;

export interface EPCISDocument {
  '@context': string[] | string;
  type: 'EPCISDocument';
  schemaVersion: string;
  creationDate: string;
  epcisBody: {
    eventList: EPCISEvent[];
  };
}

export interface EPCISQueryDocument {
  '@context': string[] | string;
  type: 'EPCISQueryDocument';
  schemaVersion: string;
  creationDate: string;
  epcisBody: {
    queryName?: string;
    subscriptionID?: string;
    queryResults: EPCISEvent[];
  };
}

export interface QueryDefinition {
  name: string;
  query: QueryParams;
}

export interface CaptureJob {
  captureID: string;
  createdAt: string;
  finishedAt?: string;
  running: boolean;
  success: boolean;
  captureErrorBehaviour: 'rollback' | 'proceed';
  errors?: ProblemResponseBody[];
}

export interface ProblemResponseBody {
  type: string;
  title: string;
  status: number;
  detail?: string;
}

export interface EPCISEvent extends Record<string, unknown> {
  eventID: string;
  type: 'ObjectEvent' | 'AggregationEvent' | 'TransactionEvent' | 'TransformationEvent' | 'AssociationEvent';
  action: 'ADD' | 'OBSERVE' | 'DELETE';
  bizStep?: string;
  disposition?: string;
  persistentDisposition?: {
    set?: string[];
    unset?: string[];
  };
  eventTime: string;
  eventTimeZoneOffset: string;
  readPoint?: { id: string };
  bizLocation?: { id: string };
  errorDeclaration?: {
    declarationTime: string;
    reason?: string;
    correctiveEventIDs?: string[];
  };
  sensorElementList?: SensorElement[];
  epcList?: string[];
  quantityList?: QuantityElement[];
  sourceList?: SourceDestElement[];
  destinationList?: SourceDestElement[];
  bizTransactionList?: BizTransaction[];
  childEPCs?: string[];
  parentID?: string;
  inputEPCList?: string[];
  outputEPCList?: string[];
  transformationID?: string;
  certificationInfo?: string[];
  captureID?: string;
  recordTime?: string;
}

export interface SensorElement {
  sensorMetadata?: {
    time?: string;
    startTime?: string;
    endTime?: string;
    deviceID?: string;
    deviceMetadata?: string;
    rawData?: string;
    dataProcessingMethod?: string;
    bizRules?: string;
  };
  sensorReport: Array<{
    type?: string;
    deviceID?: string;
    rawData?: string;
    dataProcessingMethod?: string;
    time?: string;
    microorganism?: string;
    chemicalSubstance?: string;
    value?: number;
    stringValue?: string;
    booleanValue?: boolean;
    hexBinaryValue?: string;
    uriValue?: string;
    minValue?: number;
    maxValue?: number;
    meanValue?: number;
    percRank?: number;
    percValue?: number;
    uom?: string;
    sDev?: number;
    deviceMetadata?: string;
    coordinateReferenceSystem?: string;
  }>;
}

export interface QuantityElement {
  epcClass: string;
  quantity: number;
  uom?: string;
}

export interface SourceDestElement {
  source?: string;
  destination?: string;
  type: 'owning_party' | 'possessing_party' | 'location';
}

export interface BizTransaction {
  type?: string;
  bizTransaction: string;
}

export interface QueryParams {
  eventTypes?: string[];
  GE_eventTime?: string;
  LT_eventTime?: string;
  GE_recordTime?: string;
  LT_recordTime?: string;
  EQ_action?: string[];
  EQ_bizStep?: string[];
  EQ_disposition?: string[];
  EQ_persistentDisposition_set?: string[];
  EQ_persistentDisposition_unset?: string[];
  EQ_readPoint?: string[];
  EQ_bizLocation?: string[];
  EQ_transformationID?: string[];
  MATCH_epc?: string[];
  MATCH_parentID?: string[];
  MATCH_inputEPC?: string[];
  MATCH_outputEPC?: string[];
  MATCH_anyEPC?: string[];
  MATCH_epcClass?: string[];
  MATCH_inputEPCClass?: string[];
  MATCH_outputEPCClass?: string[];
  MATCH_anyEPCClass?: string[];
  EQ_quantity?: number[];
  GT_quantity?: number;
  GE_quantity?: number;
  LT_quantity?: number;
  LE_quantity?: number;
  EQ_eventID?: string[];
  EXISTS_errorDeclaration?: boolean;
  GE_errorDeclaration_Time?: string;
  LT_errorDeclaration_Time?: string;
  EQ_errorReason?: string[];
  EQ_correctiveEventID?: string[];
  EXISTS_sensorElementList?: boolean;
  EQ_deviceID?: string[];
  EQ_dataProcessingMethod?: string[];
  EQ_microorganism?: string[];
  EQ_chemicalSubstance?: string[];
  EQ_bizRules?: string[];
  orderBy?: 'eventTime' | 'recordTime';
  orderDirection?: 'ASC' | 'DESC';
  eventCountLimit?: number;
  maxEventCount?: number;
  perPage?: number;
  nextPageToken?: string;
}

export interface ClickhouseQuery {
  query: string;
  format: DataFormat;
  parameters?: Record<string, unknown>;
}

export interface AnalyticsParams {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
}

export interface AnalyticsResult {
  eventDate: string;
  eventType: string;
  businessStep: string;
  disposition: string;
  eventCount: number;
  uniqueEvents: number;
  uniqueLocations: number;
  uniqueEpcs: number;
}

export interface Subscription {
  id: string;
  queryName: string;
  destination: string;
  schedule?: string;
  signatureToken?: string;
  reportIfEmpty: boolean;
  initialRecordTime?: string;
  stream: boolean;
  createdAt: string;
  lastExecutedAt?: string;
  status: 'active' | 'paused' | 'error';
  errorMessage?: string;
}

export interface SubscriptionParams {
  destination: string;
  schedule?: string;
  signatureToken?: string;
  reportIfEmpty?: boolean;
  initialRecordTime?: string;
  stream?: boolean;
}
