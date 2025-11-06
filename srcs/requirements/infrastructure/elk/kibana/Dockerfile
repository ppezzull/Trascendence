# ==============================================================================
# Kibana Dockerfile
# ==============================================================================
# Purpose: Visualize log data and create dashboards
# Module: #39 (ELK Stack for Log Management)
# ==============================================================================
#
# NOTE: Using official Kibana image with configuration via environment
# variables in docker-compose.yml (simpler and follows best practices)
# ==============================================================================

FROM docker.elastic.co/kibana/kibana:8.11.1

# Copy custom configuration if needed (currently using env vars in docker-compose)
# COPY conf/kibana.yml /usr/share/kibana/config/kibana.yml

# Kibana runs as the 'kibana' user
# No need to change user - official image handles this

# Expose port 5601 (Kibana web UI)
EXPOSE 5601

# Health check is defined in docker-compose.yml

# Use official entrypoint
# ENTRYPOINT ["/usr/local/bin/kibana-docker"]
