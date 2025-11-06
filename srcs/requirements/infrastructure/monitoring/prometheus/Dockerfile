# ==============================================================================
# Prometheus Dockerfile
# ==============================================================================
# Purpose: Monitoring toolkit for metrics collection
# Module: #42 (Monitoring System)
# ==============================================================================

FROM prom/prometheus:latest

# Copy configuration files
COPY conf/prometheus.yml /etc/prometheus/prometheus.yml
COPY conf/alerts/*.yml /etc/prometheus/alerts/

# Set permissions
USER root
RUN chown -R prometheus:prometheus /etc/prometheus
USER prometheus

# Expose port 9090 (Prometheus web UI and API)
EXPOSE 9090

# Health check is defined in docker-compose.yml

# Command-line flags are set in docker-compose.yml
# (retention time, storage path, etc.)
