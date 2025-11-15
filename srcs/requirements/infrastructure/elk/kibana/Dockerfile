# ==============================================================================
# Kibana Dockerfile
# ==============================================================================
# Purpose: Visualize log data and create dashboards
# Module: #39 (ELK Stack for Log Management)
# ==============================================================================
#
# Auto-provisions on startup:
#   - Index patterns: nginx-logs-*, application-logs-*
#   - Dashboards: HTTP Traffic Analytics, Application Logs, Service Health
# ==============================================================================

FROM docker.elastic.co/kibana/kibana:8.11.1

# Switch to root to install dependencies and copy files
USER root

# Install curl (for healthcheck and saved objects import)
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create directory for saved objects
RUN mkdir -p /usr/share/kibana/saved-objects

# Copy saved objects (index patterns and dashboards)
COPY saved-objects/index-patterns.ndjson /usr/share/kibana/saved-objects/
COPY saved-objects/dashboards.ndjson /usr/share/kibana/saved-objects/

# Copy entrypoint script
COPY tools/entrypoint.sh /usr/local/bin/kibana-entrypoint.sh
RUN chmod +x /usr/local/bin/kibana-entrypoint.sh

# Fix permissions
RUN chown -R kibana:kibana /usr/share/kibana/saved-objects

# Switch back to kibana user
USER kibana

# Expose port 5601 (Kibana web UI)
EXPOSE 5601

# Use custom entrypoint that imports saved objects
ENTRYPOINT ["/usr/local/bin/kibana-entrypoint.sh"]
