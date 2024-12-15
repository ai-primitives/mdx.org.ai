import { createClient, type DataFormat } from '@clickhouse/client';
import type { EPCISEvent, QueryParams, AnalyticsParams, AnalyticsResult, ClickhouseQuery, QueryDefinition } from './types';

export class ClickhouseClient {
  private client;

  constructor(url: string, username: string, password: string) {
    this.client = createClient({
      host: url,
      username,
      password,
      database: 'default'
    });
  }

  async insertEvent(event: EPCISEvent): Promise<void> {
    const query: ClickhouseQuery = {
      query: `
        INSERT INTO epcisEvents (
          eventId,
          eventType,
          eventTime,
          recordTime,
          eventTimezone,
          businessStep,
          disposition,
          readPoint,
          businessLocation,
          epcList,
          action,
          tenantId
        ) VALUES (
          {eventId: String},
          {eventType: String},
          {eventTime: DateTime64(3)},
          {recordTime: DateTime64(3)},
          {eventTimezone: String},
          {businessStep: String},
          {disposition: String},
          {readPoint: String},
          {businessLocation: String},
          {epcList: Array(String)},
          {action: String},
          {tenantId: String}
        )
      `,
      format: 'JSONEachRow' as DataFormat,
      parameters: {
        eventId: event.eventID,
        eventType: event.eventType,
        eventTime: event.eventTime,
        recordTime: event.recordTime,
        eventTimezone: event.eventTimezone,
        businessStep: event.businessStep,
        disposition: event.disposition,
        readPoint: event.readPoint,
        businessLocation: event.businessLocation,
        epcList: event.epcList || [],
        action: event.action,
        tenantId: event.tenantId
      }
    };

    await this.client.query(query);
  }

  async rollbackEvents(captureID: string): Promise<void> {
    const query: ClickhouseQuery = {
      query: `
        DELETE FROM epcisEvents
        WHERE captureID = {captureID: String}
      `,
      format: 'JSONEachRow' as DataFormat,
      parameters: {
        captureID
      }
    };

    await this.client.query(query);
  }

  async queryEvents(params: QueryParams): Promise<EPCISEvent[]> {
    let whereClause = '1=1';
    const parameters: Record<string, unknown> = {};

    if (params.GE_eventTime) {
      whereClause += ` AND eventTime >= {GE_eventTime: DateTime64(3)}`;
      parameters.GE_eventTime = params.GE_eventTime;
    }
    if (params.LT_eventTime) {
      whereClause += ` AND eventTime < {LT_eventTime: DateTime64(3)}`;
      parameters.LT_eventTime = params.LT_eventTime;
    }
    if (params.GE_recordTime) {
      whereClause += ` AND recordTime >= {GE_recordTime: DateTime64(3)}`;
      parameters.GE_recordTime = params.GE_recordTime;
    }
    if (params.LT_recordTime) {
      whereClause += ` AND recordTime < {LT_recordTime: DateTime64(3)}`;
      parameters.LT_recordTime = params.LT_recordTime;
    }
    if (params.eventTypes?.length) {
      whereClause += ` AND eventType IN {eventTypes: Array(String)}`;
      parameters.eventTypes = params.eventTypes;
    }
    if (params.EQ_action?.length) {
      whereClause += ` AND action IN {actions: Array(String)}`;
      parameters.actions = params.EQ_action;
    }
    if (params.EQ_bizStep?.length) {
      whereClause += ` AND businessStep IN {bizSteps: Array(String)}`;
      parameters.bizSteps = params.EQ_bizStep;
    }
    if (params.EQ_disposition?.length) {
      whereClause += ` AND disposition IN {dispositions: Array(String)}`;
      parameters.dispositions = params.EQ_disposition;
    }
    if (params.EQ_readPoint?.length) {
      whereClause += ` AND readPoint IN {readPoints: Array(String)}`;
      parameters.readPoints = params.EQ_readPoint;
    }
    if (params.EQ_bizLocation?.length) {
      whereClause += ` AND businessLocation IN {bizLocations: Array(String)}`;
      parameters.bizLocations = params.EQ_bizLocation;
    }
    if (params.MATCH_epc?.length) {
      whereClause += ` AND hasAny(epcList, {epcs: Array(String)})`;
      parameters.epcs = params.MATCH_epc;
    }
    if (params.MATCH_epcClass?.length) {
      whereClause += ` AND hasAny(quantityList.epcClass, {epcClasses: Array(String)})`;
      parameters.epcClasses = params.MATCH_epcClass;
    }

    const orderBy = params.orderBy || 'eventTime';
    const orderDirection = params.orderDirection || 'DESC';
    const limit = Math.min(params.eventCountLimit || 100, params.maxEventCount || 1000);
    const offset = params.nextPageToken ? parseInt(params.nextPageToken) : 0;

    const query: ClickhouseQuery = {
      query: `
        SELECT *
        FROM epcisEvents
        WHERE ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT {limit: UInt32}
        OFFSET {offset: UInt32}
      `,
      format: 'JSONEachRow' as DataFormat,
      parameters: {
        ...parameters,
        limit,
        offset
      }
    };

    const resultSet = await this.client.query(query);
    return await resultSet.json();
  }

  async getAnalytics(params: AnalyticsParams): Promise<AnalyticsResult[]> {
    const { startDate, endDate, eventType } = params;

    let whereClause = '1=1';
    if (startDate) whereClause += ` AND eventDate >= {startDate: Date}`;
    if (endDate) whereClause += ` AND eventDate <= {endDate: Date}`;
    if (eventType) whereClause += ` AND eventType = {eventType: String}`;

    const query: ClickhouseQuery = {
      query: `
        SELECT
          eventDate,
          eventType,
          businessStep,
          disposition,
          eventCount,
          uniqueEvents,
          uniqueLocations,
          uniqueEpcs
        FROM epcisEventsAnalytics
        WHERE ${whereClause}
        ORDER BY eventDate DESC
      `,
      format: 'JSONEachRow' as DataFormat,
      parameters: {
        startDate,
        endDate,
        eventType
      }
    };

    const resultSet = await this.client.query(query);
    return await resultSet.json();
  }

  async listQueries(): Promise<QueryDefinition[]> {
    const query: ClickhouseQuery = {
      query: `
        SELECT name, definition
        FROM epcisQueries
        ORDER BY name ASC
      `,
      format: 'JSONEachRow' as DataFormat
    };

    const resultSet = await this.client.query(query);
    const results = await resultSet.json<Array<{ name: string; definition: string }>>();

    return results.map(row => ({
      name: row.name,
      query: JSON.parse(row.definition)
    }));
  }

  async createQuery(queryDef: QueryDefinition): Promise<string> {
    const query: ClickhouseQuery = {
      query: `
        INSERT INTO epcisQueries (name, definition)
        VALUES ({name: String}, {definition: String})
      `,
      format: 'JSONEachRow' as DataFormat,
      parameters: {
        name: queryDef.name,
        definition: JSON.stringify(queryDef.query)
      }
    };

    await this.client.query(query);
    return queryDef.name;
  }

  async getQuery(queryName: string): Promise<QueryDefinition | null> {
    const query: ClickhouseQuery = {
      query: `
        SELECT name, definition
        FROM epcisQueries
        WHERE name = {name: String}
        LIMIT 1
      `,
      format: 'JSONEachRow' as DataFormat,
      parameters: {
        name: queryName
      }
    };

    const resultSet = await this.client.query(query);
    const results = await resultSet.json<Array<{ name: string; definition: string }>>();

    if (results.length === 0) return null;

    return {
      name: results[0].name,
      query: JSON.parse(results[0].definition)
    };
  }
}
