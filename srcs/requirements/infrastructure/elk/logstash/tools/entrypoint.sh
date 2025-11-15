#!/bin/bash
set -e

# Run Elasticsearch setup (ILM policy and templates)
/usr/share/logstash/tools/setup-elasticsearch.sh

# Start Logstash with original entrypoint
exec /usr/local/bin/docker-entrypoint "$@"
