-- EPCIS Events Schema for Clickhouse
-- This schema supports the core EPCIS event types and additional analytics capabilities

CREATE TABLE IF NOT EXISTS epcisEvents (
    -- Common fields for all event types
    eventId String,
    eventType Enum8(
        'ObjectEvent' = 1,
        'AggregationEvent' = 2,
        'TransactionEvent' = 3,
        'TransformationEvent' = 4
    ),
    eventTime DateTime64(3),
    recordTime DateTime64(3),
    eventTimezone String,

    -- Business context
    businessStep String,
    disposition String,
    readPoint String,
    businessLocation String,

    -- EPCs and quantities
    epcList Array(String),
    quantityList Array(
        Tuple(
            productClass String,
            quantity Float64,
            uom String
        )
    ),

    -- Business transaction information
    businessTransactionList Array(
        Tuple(
            type String,
            id String
        )
    ),

    -- Source/Destination
    sourceList Array(
        Tuple(
            type String,
            id String
        )
    ),
    destinationList Array(
        Tuple(
            type String,
            id String
        )
    ),

    -- Sensor information
    sensorElementList Array(
        Tuple(
            type String,
            value Float64,
            uom String,
            time DateTime64(3)
        )
    ),

    -- Extension fields for analytics
    errorDeclaration Nullable(String),
    action Enum8(
        'ADD' = 1,
        'OBSERVE' = 2,
        'DELETE' = 3
    ),

    -- Metadata
    createdAt DateTime64(3) DEFAULT now64(3),
    tenantId String,

    -- Optimization fields
    eventDate Date MATERIALIZED toDate(eventTime),
    eventMonth UInt32 MATERIALIZED toYYYYMM(eventTime)
)
ENGINE = MergeTree()
PARTITION BY eventMonth
ORDER BY (eventDate, eventTime, eventId)
SETTINGS index_granularity = 8192;

-- Materialized view for real-time analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS epcisEventsAnalytics
ENGINE = AggregatingMergeTree()
PARTITION BY eventMonth
ORDER BY (eventDate, eventType, businessStep, disposition)
AS SELECT
    eventDate,
    eventMonth,
    eventType,
    businessStep,
    disposition,
    count() as eventCount,
    uniqExact(eventId) as uniqueEvents,
    uniqExact(businessLocation) as uniqueLocations,
    uniqExact(arrayJoin(epcList)) as uniqueEpcs
FROM epcisEvents
GROUP BY
    eventDate,
    eventMonth,
    eventType,
    businessStep,
    disposition;

-- Create dictionary for business step codes
CREATE DICTIONARY IF NOT EXISTS businessStepDict (
    code String,
    name String,
    description String
)
PRIMARY KEY code
SOURCE(HTTP(URL 'https://ref.gs1.org/voc/CBV-business-step'))
LIFETIME(3600)
LAYOUT(HASHED());

-- Create dictionary for disposition codes
CREATE DICTIONARY IF NOT EXISTS dispositionDict (
    code String,
    name String,
    description String
)
PRIMARY KEY code
SOURCE(HTTP(URL 'https://ref.gs1.org/voc/CBV-disposition'))
LIFETIME(3600)
LAYOUT(HASHED());
