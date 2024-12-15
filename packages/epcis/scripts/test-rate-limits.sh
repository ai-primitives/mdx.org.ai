#!/bin/bash

# Test capture API rate limit (1000 req/min)
echo "Testing capture API rate limit..."
for i in {1..1100}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8787/capture \
    -H "Content-Type: application/json" \
    -d '{"type":"ObjectEvent"}' &
  if [ $((i % 100)) -eq 0 ]; then
    echo "Sent $i requests"
  fi
done
wait
echo "Capture API test complete"

sleep 65  # Wait for rate limit to reset

# Test query API rate limit (2000 req/min)
echo "Testing query API rate limit..."
for i in {1..2100}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/queries &
  if [ $((i % 100)) -eq 0 ]; then
    echo "Sent $i requests"
  fi
done
wait
echo "Query API test complete"

sleep 65  # Wait for rate limit to reset

# Test subscription API rate limit (500 req/min)
echo "Testing subscription API rate limit..."
for i in {1..600}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8787/subscriptions \
    -H "Content-Type: application/json" \
    -d '{"queryName":"test"}' &
  if [ $((i % 100)) -eq 0 ]; then
    echo "Sent $i requests"
  fi
done
wait
echo "Subscription API test complete"
