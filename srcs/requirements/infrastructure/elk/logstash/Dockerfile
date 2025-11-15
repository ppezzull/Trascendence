# ==============================================================================
# Logstash Dockerfile
# ==============================================================================
# Purpose: Collect Docker container logs and send to Elasticsearch
# Module: #39 (ELK Stack for Log Management)
#
# Auto-provisions on startup:
#   - ILM policy: logs_retention_policy (30-day retention)
#   - Index templates: nginx-logs-*, application-logs-*
# ==============================================================================

FROM docker.elastic.co/logstash/logstash:8.11.1

# Copy configuration file
COPY conf/logstash.conf /usr/share/logstash/pipeline/logstash.conf

# Copy Elasticsearch setup tools (ILM policy + templates)
COPY tools/ /usr/share/logstash/tools/

# Set permissions
USER root
RUN chown -R logstash:logstash /usr/share/logstash/pipeline/logstash.conf && \
    chown -R logstash:logstash /usr/share/logstash/tools/ && \
    chmod +x /usr/share/logstash/tools/*.sh
USER logstash

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9600/_node/stats || exit 1

# Logstash listens on port 9600 for monitoring
EXPOSE 9600

# Start with custom entrypoint (runs Elasticsearch setup, then Logstash)
ENTRYPOINT ["/usr/share/logstash/tools/entrypoint.sh"]
CMD ["-f", "/usr/share/logstash/pipeline/logstash.conf"]
