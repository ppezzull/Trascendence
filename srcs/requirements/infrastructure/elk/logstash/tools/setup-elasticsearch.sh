#!/bin/bash
set -e

ELASTICSEARCH_HOST="${ELASTICSEARCH_HOST:-elasticsearch:9200}"

echo "========================================="
echo "Elasticsearch ILM Setup Script"
echo "========================================="

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
for i in {1..30}; do
    if curl -sf "http://${ELASTICSEARCH_HOST}/_cluster/health" > /dev/null 2>&1; then
        echo "✓ Elasticsearch is ready!"
        break
    fi
    echo "  Waiting for Elasticsearch... ($i/30)"
    sleep 2
done

# Verify Elasticsearch is actually ready
if ! curl -sf "http://${ELASTICSEARCH_HOST}/_cluster/health" > /dev/null 2>&1; then
    echo "✗ ERROR: Elasticsearch is not responding after 60 seconds"
    exit 1
fi

echo ""
echo "========================================="
echo "Creating ILM Policy"
echo "========================================="

# Create ILM policy from JSON file
if [ -f /usr/share/logstash/tools/ilm-policy.json ]; then
    echo "Creating 'logs_retention_policy' ILM policy..."

    curl -X PUT "http://${ELASTICSEARCH_HOST}/_ilm/policy/logs_retention_policy" \
        -H 'Content-Type: application/json' \
        -d @/usr/share/logstash/tools/ilm-policy.json \
        -s -o /dev/null -w "HTTP Status: %{http_code}\n"

    echo "✓ ILM policy created/updated"
else
    echo "✗ WARNING: ilm-policy.json not found, skipping ILM policy creation"
fi

echo ""
echo "========================================="
echo "Creating Index Templates"
echo "========================================="

# Create nginx-logs index template
echo "Creating 'nginx-logs-template'..."
curl -X PUT "http://${ELASTICSEARCH_HOST}/_index_template/nginx-logs-template" \
    -H 'Content-Type: application/json' \
    -d '{
  "index_patterns": ["nginx-logs-*"],
  "template": {
    "settings": {
      "index": {
        "lifecycle": {
          "name": "logs_retention_policy"
        },
        "number_of_shards": 1,
        "number_of_replicas": 1
      }
    }
  },
  "priority": 200,
  "_meta": {
    "description": "Index template for nginx access logs with 30-day retention"
  }
}' \
    -s -o /dev/null -w "HTTP Status: %{http_code}\n"

echo "✓ nginx-logs-template created/updated"

# Create application-logs index template
echo "Creating 'application-logs-template'..."
curl -X PUT "http://${ELASTICSEARCH_HOST}/_index_template/application-logs-template" \
    -H 'Content-Type: application/json' \
    -d '{
  "index_patterns": ["application-logs-*"],
  "template": {
    "settings": {
      "index": {
        "lifecycle": {
          "name": "logs_retention_policy"
        },
        "number_of_shards": 1,
        "number_of_replicas": 1
      }
    }
  },
  "priority": 200,
  "_meta": {
    "description": "Index template for application logs with 30-day retention"
  }
}' \
    -s -o /dev/null -w "HTTP Status: %{http_code}\n"

echo "✓ application-logs-template created/updated"

echo ""
echo "========================================="
echo "Elasticsearch Setup Complete"
echo "========================================="
echo ""

# Apply ILM policy to existing indices (if any)
echo "Applying ILM policy to existing indices..."
curl -X PUT "http://${ELASTICSEARCH_HOST}/nginx-logs-*/_settings" \
    -H 'Content-Type: application/json' \
    -d '{"index.lifecycle.name": "logs_retention_policy"}' \
    -s -o /dev/null 2>&1 || echo "  No existing nginx-logs indices (this is OK)"

curl -X PUT "http://${ELASTICSEARCH_HOST}/application-logs-*/_settings" \
    -H 'Content-Type: application/json' \
    -d '{"index.lifecycle.name": "logs_retention_policy"}' \
    -s -o /dev/null 2>&1 || echo "  No existing application-logs indices (this is OK)"

echo "✓ ILM policy applied to existing indices"
echo ""
echo "========================================="
echo "Setup completed successfully!"
echo "Starting Logstash..."
echo "========================================="
