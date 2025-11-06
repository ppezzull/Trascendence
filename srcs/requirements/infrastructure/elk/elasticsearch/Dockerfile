# ==============================================================================
# Elasticsearch Dockerfile
# ==============================================================================
# Purpose: Store and index log data
# Module: #39 (ELK Stack for Log Management)
# ==============================================================================
#
# NOTE: Using official Elasticsearch image with configuration via environment
# variables in docker-compose.yml (simpler and follows best practices)
# ==============================================================================

FROM docker.elastic.co/elasticsearch/elasticsearch:8.11.1

# Copy custom configuration if needed (currently using env vars in docker-compose)
# COPY conf/elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

# Elasticsearch runs as the 'elasticsearch' user
# No need to change user - official image handles this

# Expose ports
# 9200: HTTP API
# 9300: Transport (cluster communication - not needed for single node)
EXPOSE 9200 9300

# Health check is defined in docker-compose.yml

# Use official entrypoint
# ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
