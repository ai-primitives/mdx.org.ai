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

-- Subscriptions table
CREATE TABLE IF NOT EXISTS epcisSubscriptions (
    id String,
    queryName String,
    destination String,
    schedule String,
    signatureToken String,
    reportIfEmpty UInt8,
    initialRecordTime String,
    stream UInt8,
    createdAt DateTime64(3),
    lastExecutedAt DateTime64(3),
    status Enum8('active' = 1, 'paused' = 2, 'error' = 3),
    errorMessage String,
    timestamp DateTime64(3) DEFAULT now64(3),
    PRIMARY KEY (queryName, id)
) ENGINE = ReplacingMergeTree(timestamp)
ORDER BY (queryName, id);

-- Create dictionary for subscription status
CREATE DICTIONARY IF NOT EXISTS subscriptionStatusDict (
    status String,
    description String
) PRIMARY KEY status
SOURCE(CLICKHOUSE(
    SELECT 'active' as status, 'Subscription is active and running' as description
    UNION ALL
    SELECT 'paused' as status, 'Subscription is temporarily paused' as description
    UNION ALL
    SELECT 'error' as status, 'Subscription encountered an error' as description
))
LIFETIME(MIN 0 MAX 3600)
LAYOUT(FLAT());

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_subscription_query ON epcisSubscriptions queryName TYPE minmax;
CREATE INDEX IF NOT EXISTS idx_subscription_status ON epcisSubscriptions status TYPE minmax;
