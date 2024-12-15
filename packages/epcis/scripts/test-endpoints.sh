#!/bin/bash

# Function to make a request and extract rate limit headers
make_request() {
    local endpoint=$1
    local method=$2
    local data=$3

    if [ "$method" = "GET" ]; then
        curl -i -X GET "http://localhost:8787$endpoint"
    else
        curl -i -X "$method" \
            -H "Content-Type: application/json" \
            "http://localhost:8787$endpoint" \
            -d "$data"
    fi
    echo -e "\n"
    sleep 1
}

# Test data
CAPTURE_DATA='{"type":"ObjectEvent","eventTime":"2024-01-01T00:00:00Z","eventTimeZoneOffset":"+00:00","action":"OBSERVE"}'
SUBSCRIPTION_DATA='{"queryName":"test","destination":"http://example.com","query":{}}'

echo "Testing /capture endpoint (1000/60s limit)..."
for i in {1..5}; do
    echo "Request $i to /capture"
    make_request "/capture" "POST" "$CAPTURE_DATA"
done

echo "Testing /query endpoint (2000/60s limit)..."
for i in {1..5}; do
    echo "Request $i to /query"
    make_request "/query" "GET"
done

echo "Testing /subscription endpoint (500/60s limit)..."
for i in {1..5}; do
    echo "Request $i to /subscription"
    make_request "/subscription" "POST" "$SUBSCRIPTION_DATA"
done
