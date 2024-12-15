import { DataFormat } from '@clickhouse/client';

export interface Env extends Record<string, unknown> {
  EPCIS_KV: KVNamespace;
  EPCIS_ANALYTICS: AnalyticsEngineDataset;
  CLICKHOUSE_URL: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
}

export interface EPCISEvent extends Record<string, unknown> {
  eventID: string;
  eventType: 'ObjectEvent' | 'AggregationEvent' | 'TransactionEvent' | 'TransformationEvent';
  eventTime: string;
  recordTime: string;
  eventTimezone?: string;
  businessStep?: string;
  disposition?: string;
  readPoint?: string;
  businessLocation?: string;
  epcList?: string[];
  action?: 'ADD' | 'OBSERVE' | 'DELETE';
  tenantId: string;
}

export interface QueryParams {
  eventId?: string;
  startTime?: Date;
  endTime?: Date;
  eventType?: string;
  businessStep?: string;
  disposition?: string;
  limit?: number;
  offset?: number;
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
