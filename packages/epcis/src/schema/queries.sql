-- EPCIS Query Storage Schema

CREATE TABLE IF NOT EXISTS epcisQueries (
    name String,
    definition String,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    PRIMARY KEY (name)
) ENGINE = ReplacingMergeTree(updatedAt);

-- Index for query lookups
CREATE INDEX IF NOT EXISTS idx_query_name ON epcisQueries (name) TYPE minmax;
