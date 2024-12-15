-- Initialize EPCIS database schema

-- Events table
CREATE TABLE IF NOT EXISTS epcisEvents (
    eventId String,
    eventType Enum8('ObjectEvent' = 1, 'AggregationEvent' = 2, 'TransactionEvent' = 3, 'TransformationEvent' = 4, 'AssociationEvent' = 5),
    eventTime DateTime64(3),
    recordTime DateTime64(3),
    eventTimezone String,
    businessStep String,
    disposition String,
    readPoint String,
    businessLocation String,
    epcList Array(String),
    action Enum8('ADD' = 1, 'OBSERVE' = 2, 'DELETE' = 3),
    tenantId String,
    captureId String,
    PRIMARY KEY (eventId)
) ENGINE = ReplacingMergeTree(recordTime);

-- Queries table
CREATE TABLE IF NOT EXISTS epcisQueries (
    name String,
    definition String,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    PRIMARY KEY (name)
) ENGINE = ReplacingMergeTree(updatedAt);

-- Analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS epcisEventsAnalytics
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(eventTime)
ORDER BY (eventDate, eventType, businessStep, disposition)
AS SELECT
    toDate(eventTime) as eventDate,
    eventType,
    businessStep,
    disposition,
    count() as eventCount,
    uniqExact(eventId) as uniqueEvents,
    uniqExact(businessLocation) as uniqueLocations,
    uniqExactArray(epcList) as uniqueEpcs
FROM epcisEvents
GROUP BY
    eventDate,
    eventType,
    businessStep,
    disposition;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_time ON epcisEvents eventTime TYPE minmax;
CREATE INDEX IF NOT EXISTS idx_record_time ON epcisEvents recordTime TYPE minmax;
CREATE INDEX IF NOT EXISTS idx_business_step ON epcisEvents businessStep TYPE minmax;
CREATE INDEX IF NOT EXISTS idx_disposition ON epcisEvents disposition TYPE minmax;
CREATE INDEX IF NOT EXISTS idx_query_name ON epcisQueries name TYPE minmax;
