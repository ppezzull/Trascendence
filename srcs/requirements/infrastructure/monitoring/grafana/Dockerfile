# ==============================================================================
# Grafana Dockerfile
# ==============================================================================
# Purpose: Visualization and dashboards for metrics
# Module: #42 (Monitoring System)
# ==============================================================================

FROM grafana/grafana:latest

# Copy provisioning configuration
# This auto-configures Prometheus datasource and dashboards
COPY provisioning /etc/grafana/provisioning

# Expose port 3000 (Grafana web UI)
EXPOSE 3000

# Health check is defined in docker-compose.yml

# Environment variables are set in docker-compose.yml
# (admin user/password, server settings, etc.)
