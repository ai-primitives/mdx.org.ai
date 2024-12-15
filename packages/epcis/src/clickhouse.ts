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
        INSERT INTO epcis_events (
          event_id,
          event_type,
          event_time,
          record_time,
          event_timezone,
          business_step,
          disposition,
          read_point,
          business_location,
          epc_list,
          action,
          tenant_id
        ) VALUES (
          {event_id: String},
          {event_type: String},
          {event_time: DateTime64(3)},
          {record_time: DateTime64(3)},
          {event_timezone: String},
          {business_step: String},
          {disposition: String},
          {read_point: String},
          {business_location: String},
          {epc_list: Array(String)},
          {action: String},
          {tenant_id: String}
        )
      `,
      format: 'JSONEachRow' as DataFormat,
      parameters: {
        event_id: event.eventID,
        event_type: event.eventType,
        event_time: event.eventTime,
        record_time: event.recordTime,
        event_timezone: event.eventTimezone,
        business_step: event.businessStep,
        disposition: event.disposition,
        read_point: event.readPoint,
        business_location: event.businessLocation,
        epc_list: event.epcList || [],
        action: event.action,
        tenant_id: event.tenantId
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
    if (eventId) whereClause += ` AND event_id = {eventId: String}`;
    if (startTime) whereClause += ` AND event_time >= {startTime: DateTime64(3)}`;
    if (endTime) whereClause += ` AND event_time <= {endTime: DateTime64(3)}`;
    if (eventType) whereClause += ` AND event_type = {eventType: String}`;
    if (businessStep) whereClause += ` AND business_step = {businessStep: String}`;
    if (disposition) whereClause += ` AND disposition = {disposition: String}`;

    const query: ClickhouseQuery = {
      query: `
        SELECT *
        FROM epcis_events
        WHERE ${whereClause}
        ORDER BY event_time DESC
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
    if (startDate) whereClause += ` AND event_date >= {startDate: Date}`;
    if (endDate) whereClause += ` AND event_date <= {endDate: Date}`;
    if (eventType) whereClause += ` AND event_type = {eventType: String}`;

    const query: ClickhouseQuery = {
      query: `
        SELECT
          event_date,
          event_type,
          business_step,
          disposition,
          event_count,
          unique_events,
          unique_locations,
          unique_epcs
        FROM epcis_events_analytics
        WHERE ${whereClause}
        ORDER BY event_date DESC
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
