#!/bin/bash
set -e

# Start Kibana in the background
/usr/local/bin/kibana-docker &
KIBANA_PID=$!

echo "Waiting for Kibana to be ready..."

# Wait for Kibana to be ready (max 2 minutes)
for i in {1..60}; do
    if curl -sf http://localhost:5601/kibana/api/status > /dev/null 2>&1; then
        echo "Kibana is ready!"
        break
    fi
    echo "Waiting for Kibana... ($i/60)"
    sleep 2
done

# Import saved objects (index patterns)
echo "Importing index patterns..."
if [ -f /usr/share/kibana/saved-objects/index-patterns.ndjson ]; then
    curl -X POST "http://localhost:5601/kibana/api/saved_objects/_import?overwrite=true" \
        -H 'kbn-xsrf: true' \
        --form file=@/usr/share/kibana/saved-objects/index-patterns.ndjson \
        > /dev/null 2>&1 || echo "Index patterns may already exist (this is OK)"
    echo "Index patterns import completed"
else
    echo "No index patterns file found, skipping import"
fi

# Import saved objects (dashboards and visualizations)
echo "Importing dashboards and visualizations..."
if [ -f /usr/share/kibana/saved-objects/dashboards.ndjson ]; then
    curl -X POST "http://localhost:5601/kibana/api/saved_objects/_import?overwrite=true" \
        -H 'kbn-xsrf: true' \
        --form file=@/usr/share/kibana/saved-objects/dashboards.ndjson \
        > /dev/null 2>&1 || echo "Dashboards may already exist (this is OK)"
    echo "Dashboards import completed"
else
    echo "No dashboards file found, skipping import"
fi

# Keep Kibana running in foreground
wait $KIBANA_PID
