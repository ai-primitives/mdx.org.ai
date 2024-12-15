-- EPCIS Events Schema for Clickhouse
-- This schema supports the core EPCIS event types and additional analytics capabilities

CREATE TABLE IF NOT EXISTS epcis_events (
    -- Common fields for all event types
    event_id String,
    event_type Enum8(
        'ObjectEvent' = 1,
        'AggregationEvent' = 2,
        'TransactionEvent' = 3,
        'TransformationEvent' = 4
    ),
    event_time DateTime64(3),
    record_time DateTime64(3),
    event_timezone String,

    -- Business context
    business_step String,
    disposition String,
    read_point String,
    business_location String,

    -- EPCs and quantities
    epc_list Array(String),
    quantity_list Array(
        Tuple(
            product_class String,
            quantity Float64,
            uom String
        )
    ),

    -- Business transaction information
    business_transaction_list Array(
        Tuple(
            type String,
            id String
        )
    ),

    -- Source/Destination
    source_list Array(
        Tuple(
            type String,
            id String
        )
    ),
    destination_list Array(
        Tuple(
            type String,
            id String
        )
    ),

    -- Sensor information
    sensor_element_list Array(
        Tuple(
            type String,
            value Float64,
            uom String,
            time DateTime64(3)
        )
    ),

    -- Extension fields for analytics
    error_declaration Nullable(String),
    action Enum8(
        'ADD' = 1,
        'OBSERVE' = 2,
        'DELETE' = 3
    ),

    -- Metadata
    created_at DateTime64(3) DEFAULT now64(3),
    tenant_id String,

    -- Optimization fields
    event_date Date MATERIALIZED toDate(event_time),
    event_month UInt32 MATERIALIZED toYYYYMM(event_time)
)
ENGINE = MergeTree()
PARTITION BY event_month
ORDER BY (event_date, event_time, event_id)
SETTINGS index_granularity = 8192;

-- Materialized view for real-time analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS epcis_events_analytics
ENGINE = AggregatingMergeTree()
PARTITION BY event_month
ORDER BY (event_date, event_type, business_step, disposition)
AS SELECT
    event_date,
    event_month,
    event_type,
    business_step,
    disposition,
    count() as event_count,
    uniqExact(event_id) as unique_events,
    uniqExact(business_location) as unique_locations,
    uniqExact(arrayJoin(epc_list)) as unique_epcs
FROM epcis_events
GROUP BY
    event_date,
    event_month,
    event_type,
    business_step,
    disposition;

-- Create dictionary for business step codes
CREATE DICTIONARY IF NOT EXISTS business_step_dict (
    code String,
    name String,
    description String
)
PRIMARY KEY code
SOURCE(HTTP(URL 'https://ref.gs1.org/voc/CBV-business-step'))
LIFETIME(3600)
LAYOUT(HASHED());

-- Create dictionary for disposition codes
CREATE DICTIONARY IF NOT EXISTS disposition_dict (
    code String,
    name String,
    description String
)
PRIMARY KEY code
SOURCE(HTTP(URL 'https://ref.gs1.org/voc/CBV-disposition'))
LIFETIME(3600)
LAYOUT(HASHED());
