#!/bin/bash

# Function to make a request and extract rate limit headers
make_request() {
    local endpoint=$1
    echo "Request to $endpoint"
    response=$(curl -i -X GET "$endpoint")
    echo "$response"
    echo -e "\n"

    # Extract rate limit headers for monitoring
    remaining=$(echo "$response" | grep -i "ratelimit-remaining" | awk '{print $2}')
    reset=$(echo "$response" | grep -i "ratelimit-reset" | awk '{print $2}')
    echo "Remaining: $remaining, Reset: $reset"

    sleep 0.01  # Reduced sleep time to test rate limiting more effectively
}

# Test the rate limiting endpoint with multiple requests
echo "Testing /test-rate-limit endpoint (1000/60s limit)..."
BASE_URL="http://localhost:8787/test-rate-limit"

# Make 1100 requests to test rate limiting (should hit the limit)
for i in {1..1100}; do
    echo "Request $i of 1100"
    make_request "$BASE_URL"

    # Check if we've hit the rate limit (remaining = 0)
    if [[ "$remaining" == "0" ]]; then
        echo "Rate limit hit! Waiting for reset..."
        sleep "$reset"
    fi
done

echo "Test completed."
