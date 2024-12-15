-- Create subscriptions table
CREATE TABLE IF NOT EXISTS epcisSubscriptions (
  id String,
  queryName String,
  destination String,
  schedule String,
  signatureToken String,
  reportIfEmpty UInt8,
  initialRecordTime String,
  stream UInt8,
  createdAt String,
  lastExecutedAt String,
  status String,
  errorMessage String,
  timestamp DateTime DEFAULT now()
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
