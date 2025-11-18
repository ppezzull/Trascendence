# Alert Rules Documentation

## Overview

This document describes the essential alert rules configured in Prometheus for monitoring system health and service availability.

**Location:** `srcs/requirements/infrastructure/monitoring/prometheus/alerts/critical.yml`

**Auto-Provisioning:** ✅ **YES** - Alert rules are automatically loaded when running `make` or `docker-compose up`. No manual configuration required.

## How Auto-Provisioning Works

1. Alert rules are stored in: `srcs/requirements/infrastructure/monitoring/prometheus/alerts/*.yml`
2. Prometheus configuration includes: `rule_files: ['/etc/prometheus/alerts/*.yml']`
3. Docker Compose mounts the alerts directory: `./requirements/infrastructure/monitoring/prometheus/alerts:/etc/prometheus/alerts:ro`
4. On startup, Prometheus automatically loads all `.yml` files from the alerts directory

## Alert Rules

### 1. ServiceDown

**Severity:** 🔴 Critical

**Trigger:** Any service is completely unreachable for more than 1 minute

**Query:**
```promql
up == 0
```

**What it monitors:** Prometheus `up` metric for all scrape targets

**Alert Message:** "{{ $labels.job }} is down"

**When to investigate:** Service container may be crashed, networking issues, or service is not responding to health checks

---

### 2. HighCPU

**Severity:** ⚠️ Warning

**Trigger:** CPU usage exceeds 90% for more than 5 minutes

**Query:**
```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
```

**What it monitors:** System CPU usage from node-exporter

**Alert Message:** "CPU usage above 90%" with current percentage

**When to investigate:** High traffic, resource-intensive operations, infinite loops, or insufficient resources

---

### 3. HighMemory

**Severity:** ⚠️ Warning

**Trigger:** Memory usage exceeds 90% for more than 5 minutes

**Query:**
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
```

**What it monitors:** System memory usage from node-exporter

**Alert Message:** "Memory usage above 90%" with current percentage

**When to investigate:** Memory leaks, insufficient memory allocation, or unexpected high memory usage

---

### 4. LowDiskSpace

**Severity:** 🔴 Critical

**Trigger:** Available disk space falls below 10% for more than 5 minutes

**Query:**
```promql
(node_filesystem_avail_bytes{mountpoint=~"/|/var/lib/docker"} / node_filesystem_size_bytes{mountpoint=~"/|/var/lib/docker"}) * 100 < 10
```

**What it monitors:** Disk space on root filesystem (Linux: `/`, macOS: `/var/lib/docker`)

**Alert Message:** "Disk space below 10%" with remaining percentage

**When to investigate:** Logs consuming disk space, database growth, or need to clean up old data

**Note:** Cross-platform compatible query works on both Linux and macOS Docker Desktop

---

### 5. NginxDown

**Severity:** 🔴 Critical

**Trigger:** Nginx metrics exporter is unreachable for more than 1 minute

**Query:**
```promql
up{job="nginx-exporter"} == 0
```

**What it monitors:** Nginx Prometheus Exporter availability

**Alert Message:** "Nginx monitoring is down - Cannot collect nginx metrics"

**When to investigate:** Nginx container crashed, nginx-exporter service failed, or networking issues

---

## Viewing Alerts

### Prometheus UI

**URL:** https://localhost:8090/prometheus/alerts

**States:**
- **Inactive** (Green) - Alert condition is not met, system is healthy
- **Pending** (Yellow) - Alert condition is met but hasn't reached the `for` duration yet
- **Firing** (Red) - Alert condition has been met for the specified duration

## Alert Evaluation

**Evaluation Interval:** 15 seconds (configured in `prometheus.yml`)

**Alert Group Interval:** 30 seconds (configured in `critical.yml`)

Prometheus evaluates each alert rule every 15 seconds, and the `critical_alerts` group runs every 30 seconds.

## Testing Alerts

To test if alerts are working correctly:

### Test HighCPU Alert
```bash
# Generate CPU load
docker exec -it user-service sh -c "yes > /dev/null &"
# Wait 5 minutes, check Prometheus UI
# Kill the process: docker exec -it user-service pkill yes
```

### Test ServiceDown Alert
```bash
# Stop a service
docker-compose stop user-service
# Wait 1 minute, check Prometheus UI
# Restart: docker-compose start user-service
```

### Test NginxDown Alert
```bash
# Stop nginx exporter
docker-compose stop nginx-exporter
# Wait 1 minute, check Prometheus UI
# Restart: docker-compose start nginx-exporter
```

## Alertmanager Integration

**Current Status:** ⚠️ Not configured

The `alerting` section in `prometheus.yml` is configured but has no targets:
```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: []
```

**Why:** Alerts are visible in Prometheus UI without requiring Alertmanager integration for notifications.

## Troubleshooting

### Alerts Not Showing Up

1. **Check if alerts file is mounted:**
   ```bash
   docker exec prometheus ls -la /etc/prometheus/alerts/
   ```

2. **Check Prometheus logs:**
   ```bash
   docker logs prometheus | grep -i "rule\|alert"
   ```

3. **Verify prometheus.yml includes rule_files:**
   ```bash
   docker exec prometheus cat /etc/prometheus/prometheus.yml | grep -A 2 "rule_files"
   ```

4. **Reload Prometheus configuration:**
   ```bash
   docker-compose restart prometheus
   ```

---

## Module #42 Compliance

✅ **Requirement Met:** "Set up alerting rules in Prometheus to monitor system health"

This implementation provides:
- Essential alerts for service availability (ServiceDown, NginxDown)
- Resource monitoring alerts (HighCPU, HighMemory, LowDiskSpace)
- Auto-provisioning with `make` (no manual setup required)
- Cross-platform compatibility (Linux and macOS)
