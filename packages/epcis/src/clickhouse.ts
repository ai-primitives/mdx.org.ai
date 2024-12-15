import { createClient, type DataFormat } from '@clickhouse/client';
import type { EPCISEvent, QueryParams, AnalyticsParams, AnalyticsResult, ClickhouseQuery } from './types';

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

  async queryEvents(params: QueryParams): Promise<EPCISEvent[]> {
    const {
      startTime,
      endTime,
      eventType,
      businessStep,
      disposition,
      limit = 100,
      offset = 0,
      eventId
    } = params;

    let whereClause = '1=1';
    if (eventId) whereClause += ` AND eventId = {eventId: String}`;
    if (startTime) whereClause += ` AND eventTime >= {startTime: DateTime64(3)}`;
    if (endTime) whereClause += ` AND eventTime <= {endTime: DateTime64(3)}`;
    if (eventType) whereClause += ` AND eventType = {eventType: String}`;
    if (businessStep) whereClause += ` AND businessStep = {businessStep: String}`;
    if (disposition) whereClause += ` AND disposition = {disposition: String}`;

    const query: ClickhouseQuery = {
      query: `
        SELECT *
        FROM epcisEvents
        WHERE ${whereClause}
        ORDER BY eventTime DESC
        LIMIT {limit: UInt32}
        OFFSET {offset: UInt32}
      `,
      format: 'JSONEachRow' as DataFormat,
      parameters: {
        eventId,
        startTime,
        endTime,
        eventType,
        businessStep,
        disposition,
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
}
