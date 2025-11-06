# ==============================================================================
# Logstash Dockerfile
# ==============================================================================
# Purpose: Collect Docker container logs and send to Elasticsearch
# Module: #39 (ELK Stack for Log Management)
# ==============================================================================

FROM docker.elastic.co/logstash/logstash:8.11.1

# Install required plugins
RUN logstash-plugin install logstash-input-docker_logs

# Copy configuration file
COPY conf/logstash.conf /usr/share/logstash/pipeline/logstash.conf

# Set permissions
USER root
RUN chown logstash:logstash /usr/share/logstash/pipeline/logstash.conf
USER logstash

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9600/_node/stats || exit 1

# Logstash listens on port 9600 for monitoring
EXPOSE 9600

# Start Logstash
ENTRYPOINT ["/usr/local/bin/docker-entrypoint"]
CMD ["-f", "/usr/share/logstash/pipeline/logstash.conf"]
