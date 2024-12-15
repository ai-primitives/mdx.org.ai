import { DataFormat } from '@clickhouse/client';
import { ClickhouseClient } from './clickhouse';
import type { Env as HonoBaseEnv } from 'hono/types';

export interface Env extends Record<string, unknown> {
  EPCIS_KV: KVNamespace;
  EPCIS_ANALYTICS: AnalyticsEngineDataset;
  CLICKHOUSE_URL: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
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
  query: {
    eventTypes?: string[];
    GE_eventTime?: string;
    LT_eventTime?: string;
    GE_recordTime?: string;
    LT_recordTime?: string;
    EQ_action?: string[];
    EQ_bizStep?: string[];
    EQ_disposition?: string[];
    EQ_readPoint?: string[];
    EQ_bizLocation?: string[];
    MATCH_epc?: string[];
    MATCH_epcClass?: string[];
    orderBy?: 'eventTime' | 'recordTime';
    orderDirection?: 'ASC' | 'DESC';
    eventCountLimit?: number;
    maxEventCount?: number;
  };
}

export interface CaptureJob {
  captureID: string;
  createdAt: string;
  finishedAt?: string;
  running: boolean;
  success: boolean;
  captureErrorBehaviour: 'rollback' | 'proceed';
  errors?: Array<{
    type: string;
    title: string;
    status: number;
    detail?: string;
  }>;
}

export interface EPCISEvent extends Record<string, unknown> {
  eventID: string;
  type: 'ObjectEvent' | 'AggregationEvent' | 'TransactionEvent' | 'TransformationEvent' | 'AssociationEvent';
  action: 'ADD' | 'OBSERVE' | 'DELETE';
  bizStep?: string;
  disposition?: string;
  eventTime: string;
  eventTimeZoneOffset: string;
  readPoint?: { id: string };
  businessLocation?: { id: string };
  epcList?: string[];
  quantityList?: Array<{
    epcClass: string;
    quantity: number;
    uom?: string;
  }>;
  captureID?: string;  // Added for rollback support
  recordTime?: string; // Added for event tracking
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
  EQ_readPoint?: string[];
  EQ_bizLocation?: string[];
  MATCH_epc?: string[];
  MATCH_epcClass?: string[];
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
