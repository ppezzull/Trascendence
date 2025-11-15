# Kibana Dashboards Documentation

This document provides a comprehensive overview of the three Kibana dashboards that auto-provision when the project is deployed. These dashboards provide real-time monitoring of HTTP traffic, application logs, and service health.

**Access:** `https://localhost:8090/kibana/app/dashboards`

---

## Dashboard 1: HTTP Traffic Analytics

**Purpose:** Monitor web traffic, API usage, and HTTP errors from nginx access logs

**Data Source:** `nginx-logs-*` index pattern
**Time Range:** Last 24 hours (configurable)

### Panel 1: Request Rate Over Time (Line Chart)
**Visualization Type:** Line chart
**Purpose:** Track HTTP request volume over time to identify traffic patterns and spikes

**Metrics:**
- **X-axis:** Time (@timestamp)
- **Y-axis:** Count of HTTP requests
- **Aggregation:** Count over time using date histogram

**Use Cases:**
- Identify peak traffic periods
- Detect unusual traffic spikes (potential attacks or viral content)
- Monitor baseline request rates for capacity planning

---

### Panel 2: HTTP Status Codes (Pie Chart)
**Visualization Type:** Pie chart
**Purpose:** Visualize distribution of HTTP response codes

**Metrics:**
- **Segments:** HTTP status codes (200, 404, 500, etc.)
- **Values:** Count of requests per status code
- **Field:** `http.response.status_code`

**Use Cases:**
- Monitor ratio of successful (2xx) vs. error (4xx, 5xx) responses
- Quickly identify widespread issues (high 5xx rates)
- Track client errors (4xx) indicating API misuse or broken links

---

### Panel 3: Top Endpoints (Data Table)
**Visualization Type:** Data table
**Purpose:** Identify most frequently accessed API endpoints and pages

**Columns:**
- **URL:** Full request path
- **Count:** Number of requests to each endpoint

**Metrics:**
- **Field:** `url.original.keyword`
- **Sorting:** Descending by count (top 10 endpoints)

**Use Cases:**
- Identify most popular API endpoints
- Detect hot spots requiring optimization or caching
- Monitor specific endpoints for performance issues

---

### Panel 4: Average Response Size (Metric)
**Visualization Type:** Single metric
**Purpose:** Display average HTTP response body size in bytes

**Metrics:**
- **Aggregation:** Average of `http.response.body.bytes`
- **Unit:** Bytes
- **Display:** Large number with label

**Use Cases:**
- Monitor payload sizes for bandwidth optimization
- Detect anomalous response sizes (data leaks or incomplete responses)
- Track impact of compression or CDN changes

---

### Panel 5: HTTP Methods (Horizontal Bar Chart)
**Visualization Type:** Horizontal bar chart
**Purpose:** Show distribution of HTTP methods (GET, POST, PUT, DELETE, etc.)

**Metrics:**
- **Y-axis:** HTTP methods
- **X-axis:** Request count per method
- **Field:** `http.request.method.keyword`

**Use Cases:**
- Understand API usage patterns (read vs. write operations)
- Detect unusual method usage (unexpected DELETE or PUT requests)
- Monitor RESTful API compliance

---

### Panel 6: User Agents (Tag Cloud)
**Visualization Type:** Tag cloud
**Purpose:** Visualize distribution of client user agents

**Metrics:**
- **Tags:** User agent strings (browsers, bots, API clients)
- **Size:** Proportional to request count
- **Field:** `user_agent.original.keyword`
- **Limit:** Top 20 user agents

**Use Cases:**
- Identify bot traffic vs. real users
- Detect automated scrapers or API clients
- Monitor browser/client distribution for compatibility planning

---

### Panel 7: Recent Errors (4xx/5xx) (Data Table)
**Visualization Type:** Data table with filter
**Purpose:** Display recent HTTP error responses for troubleshooting

**Columns:**
- **URL:** Endpoint that returned error
- **Status Code:** HTTP error code (404, 500, etc.)
- **Count:** Number of errors

**Filters:**
- **Query:** `http.response.status_code >= 400`
- **Sorting:** By count (descending)
- **Limit:** Top 10 error combinations

**Use Cases:**
- Quickly identify failing endpoints
- Troubleshoot specific error patterns
- Monitor error rates during deployments

---

## Dashboard 2: Application Logs Overview

**Purpose:** Monitor application-level logs, errors, and service health

**Data Source:** `application-logs-*` index pattern
**Time Range:** Last 24 hours (configurable)

### Panel 1: Log Levels Distribution (Pie Chart)
**Visualization Type:** Donut pie chart
**Purpose:** Show distribution of log severity levels

**Metrics:**
- **Segments:** Log levels (info, warn, error, debug)
- **Values:** Count per log level
- **Field:** `log_level.keyword`

**Use Cases:**
- Monitor application health (high error rate = issues)
- Identify verbose logging that impacts performance
- Track log level distribution for log retention policies

---

### Panel 2: Logs by Service (Vertical Bar Chart)
**Visualization Type:** Vertical bar chart
**Purpose:** Compare log volume across different microservices

**Metrics:**
- **X-axis:** Service name (user-service, game-service, chat-service)
- **Y-axis:** Log count
- **Field:** `service.keyword`

**Use Cases:**
- Identify services with unusual logging activity
- Detect silent services (possible crashes or hangs)
- Balance log collection load across services

---

### Panel 3: Error Timeline (Line Chart)
**Visualization Type:** Line chart with filter
**Purpose:** Track error log trends over time

**Metrics:**
- **X-axis:** Time (@timestamp)
- **Y-axis:** Error count
- **Filter:** `log_level:error`
- **Aggregation:** Count over time

**Use Cases:**
- Identify error spikes correlated with deployments
- Monitor error trends (increasing = degrading service)
- Alert thresholds for error rates

---

### Panel 4: Recent Errors (Data Table)
**Visualization Type:** Multi-level data table
**Purpose:** Display recent error logs with context

**Columns:**
- **Timestamp:** When error occurred
- **Service:** Which microservice logged the error
- **Message:** Error message text
- **Count:** Frequency of this error

**Filters:**
- **Query:** `log_level:error`
- **Rows:** Last 20 errors
- **Grouping:** By timestamp → service → message

**Use Cases:**
- Troubleshoot recent application errors
- Identify recurring error patterns
- Correlate errors across services

---

### Panel 5: Top Error Messages (Data Table)
**Visualization Type:** Data table
**Purpose:** Identify most common error messages

**Columns:**
- **Error Message:** Full error text
- **Count:** Number of occurrences

**Metrics:**
- **Field:** `log_message.keyword`
- **Filter:** `log_level:error`
- **Sorting:** By count (descending, top 10)

**Use Cases:**
- Prioritize bug fixes by error frequency
- Detect systemic issues affecting multiple users
- Track resolution of known errors

---

## Dashboard 3: Service Health Monitor

**Purpose:** Container and service availability tracking

**Data Source:** `application-logs-*` index pattern
**Time Range:** Last 24 hours (configurable)

### Panel 1: Active Containers (Metric)
**Visualization Type:** Single metric
**Purpose:** Display count of unique active containers

**Metrics:**
- **Aggregation:** Cardinality (unique count)
- **Field:** `container.name.keyword`
- **Display:** Large number with label

**Use Cases:**
- Verify all expected services are running
- Detect container restarts (count changes)
- Monitor autoscaling behavior (container count fluctuation)

---

### Panel 2: Log Volume by Service (Line Chart)
**Visualization Type:** Multi-line chart
**Purpose:** Track log activity for each service over time

**Metrics:**
- **X-axis:** Time (@timestamp)
- **Y-axis:** Log count
- **Lines:** Split by service (one line per service)
- **Field:** `service.keyword`

**Use Cases:**
- Identify services with abnormal logging patterns
- Detect service degradation (sudden log volume changes)
- Monitor service activity correlation (cascading failures)

---

### Panel 3: Error Rate by Service (Line Chart)
**Visualization Type:** Multi-line chart with filter
**Purpose:** Compare error rates across services over time

**Metrics:**
- **X-axis:** Time (@timestamp)
- **Y-axis:** Error count
- **Lines:** Split by service
- **Filter:** `log_level:error`
- **Field:** `service.keyword`

**Use Cases:**
- Identify which service is causing errors
- Monitor error propagation between services
- Track error rate improvements after fixes

---

### Panel 4: Service Startup Events (Data Table)
**Visualization Type:** Data table with filter
**Purpose:** Track service initialization and startup events

**Columns:**
- **Timestamp:** When service started
- **Service:** Service name
- **Message:** Startup message (e.g., "Server listening on port 3000")
- **Count:** Number of startup events

**Filters:**
- **Query:** `log_message:*started* OR log_message:*listening*`
- **Rows:** Last 20 startup events

**Use Cases:**
- Verify successful service initialization
- Detect frequent restarts (indicating crashes)
- Monitor deployment rollout progress
- Track container orchestration behavior

---

## Data Flow Architecture

### Nginx Access Logs → Dashboard 1
```
Nginx Container
  ↓ (access.log)
Logstash Pipeline (nginx.conf)
  ↓ (parse, enrich)
Elasticsearch (nginx-logs-* indices)
  ↓ (query)
Kibana Visualizations
  ↓ (render)
Dashboard 1: HTTP Traffic Analytics
```

### Application Logs → Dashboards 2 & 3
```
Node.js Services (user-service, game-service, chat-service)
  ↓ (stdout/stderr via Docker logging)
Logstash Pipeline (application.conf)
  ↓ (parse, enrich)
Elasticsearch (application-logs-* indices)
  ↓ (query)
Kibana Visualizations
  ↓ (render)
Dashboard 2: Application Logs Overview
Dashboard 3: Service Health Monitor
```

---

## Field Mapping Reference

### Nginx Logs Index (`nginx-logs-*`)
| Field | Type | Description |
|-------|------|-------------|
| `@timestamp` | date | Request timestamp |
| `http.response.status_code` | long | HTTP status code (200, 404, 500) |
| `http.request.method.keyword` | keyword | HTTP method (GET, POST, etc.) |
| `http.response.body.bytes` | long | Response size in bytes |
| `url.original.keyword` | keyword | Full request URL path |
| `user_agent.original.keyword` | keyword | Client user agent string |

### Application Logs Index (`application-logs-*`)
| Field | Type | Description |
|-------|------|-------------|
| `@timestamp` | date | Log timestamp |
| `log_level.keyword` | keyword | Severity (info, warn, error) |
| `service.keyword` | keyword | Service name (user-service, etc.) |
| `log_message.keyword` | keyword | Full log message text |
| `container.name.keyword` | keyword | Docker container name |

---

## Auto-Provisioning

All 3 dashboards are automatically provisioned on Kibana startup via the entrypoint script:

**File:** `srcs/requirements/infrastructure/elk/kibana/saved-objects/dashboards.ndjson`

**Contents:**
- 2 index patterns
- 16 visualizations (7 + 5 + 4)
- 3 dashboards
- Metadata

**Provisioning Process:**
1. Kibana container starts
2. Entrypoint script waits for Kibana API
3. Imports index patterns from `index-patterns.ndjson`
4. Imports dashboards and visualizations from `dashboards.ndjson`
5. Dashboards immediately available in UI

**Verification:**
```bash
# Check dashboard count
docker exec kibana curl -s -X GET \
  'http://localhost:5601/kibana/api/saved_objects/_find?type=dashboard&fields=title' \
  -H 'kbn-xsrf: true'
```

---

## Monitoring Best Practices

### Dashboard 1: HTTP Traffic Analytics
- **Monitor daily:** Review error rates and top endpoints
- **Set alerts:** > 5% error rate (5xx responses)
- **Capacity planning:** Track request rate trends for scaling decisions
- **Security:** Watch for unusual user agents or request patterns

### Dashboard 2: Application Logs Overview
- **Monitor hourly:** Check error timeline for spikes
- **Set alerts:** Sudden increase in error count (> 2x baseline)
- **Debugging:** Use "Top Error Messages" to prioritize fixes
- **Performance:** Monitor log volume (excessive logging = performance hit)

### Dashboard 3: Service Health Monitor
- **Monitor real-time:** Verify active container count matches expected
- **Set alerts:** Container count drop (service crash)
- **Deployment tracking:** Watch startup events during rollouts
- **Error correlation:** Use "Error Rate by Service" to identify problem services

---

## Time Range Selection

All dashboards support Kibana's time picker (top-right corner):

**Common Time Ranges:**
- **Last 15 minutes:** Real-time troubleshooting
- **Last 1 hour:** Recent incident investigation
- **Last 24 hours:** Daily monitoring (default)
- **Last 7 days:** Weekly trend analysis
- **Last 30 days:** Monthly capacity planning

**Custom Ranges:**
- Select specific deployment windows for post-deployment analysis
- Compare time periods (e.g., this week vs. last week)

---

## Filtering and Drill-Down

### Interactive Features
- **Click on pie segments:** Filter dashboard by selected value
- **Click on table rows:** Focus on specific endpoint or service
- **Click on legend items:** Show/hide specific series in charts
- **Use filter bar:** Add custom KQL filters (e.g., `service:user-service`)

### Example Workflows

**Investigate High Error Rate:**
1. Open Dashboard 1
2. Click on "5xx" segment in Status Codes pie
3. Check Top Endpoints table (now filtered to errors only)
4. Identify failing endpoint
5. Switch to Dashboard 2 to see application error messages

**Troubleshoot Specific Service:**
1. Open Dashboard 3
2. Add filter: `service:game-service`
3. View error rate timeline for this service only
4. Check startup events for restart patterns
5. Open Dashboard 2 for detailed error messages

---

## Refresh and Auto-Refresh

**Manual Refresh:**
- Click refresh button (top-right) to update dashboard data

**Auto-Refresh:**
- Click time picker → Refresh every
- Options: 5s, 10s, 30s, 1m, 5m, 15m, 30m, 1h
- Useful for real-time monitoring during incidents

**Note:** Auto-refresh impacts Elasticsearch load. Use conservatively in production.

---

## Export and Sharing

### Save Dashboard State
- Click "Share" → "Permalinks" to generate shareable URL
- URL includes current filters, time range, and refresh settings

### Export Visualizations
```bash
# Export all dashboards
docker exec kibana curl -s -X POST \
  'http://localhost:5601/kibana/api/saved_objects/_export' \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{"type": "dashboard", "includeReferencesDeep": true}' \
  > dashboards-backup.ndjson
```

### Create Custom Dashboards
1. Navigate to **Dashboard** → **Create dashboard**
2. Add existing visualizations or create new ones
3. Arrange panels in desired layout
4. Save dashboard with descriptive name


---

## Troubleshooting

### Dashboard Shows "No Results Found"
**Cause:** No data in index or time range too narrow
**Solution:**
1. Expand time range to "Last 7 days"
2. Verify data exists: `Management → Stack Management → Index Management`
3. Check Logstash is running: `docker-compose ps logstash`

### Visualizations Show Errors
**Cause:** Field mapping mismatch or missing fields
**Solution:**
1. Check field exists in index pattern: `Management → Index Patterns → nginx-logs-*`
2. Refresh field list if new fields added
3. Verify Logstash grok patterns are parsing correctly

### Auto-Provisioning Failed
**Cause:** dashboards.ndjson file corrupted or Kibana API not ready
**Solution:**
1. Check Kibana logs: `docker-compose logs kibana | grep -i import`
2. Verify file syntax: `cat dashboards.ndjson | jq .` (should parse without errors)
3. Manually import: Use Kibana UI → Stack Management → Saved Objects → Import

### High Cardinality Warning
**Cause:** Too many unique values in aggregation (e.g., unique URLs)
**Solution:**
1. Increase aggregation size limit in visualization settings
2. Use filters to narrow down data
3. Consider using `.keyword` field instead of analyzed text field

---

## Performance Optimization

### Reduce Query Load
- Avoid auto-refresh on multiple dashboards simultaneously
- Use longer refresh intervals (≥ 1 minute)
- Narrow time ranges when possible

### Optimize Visualizations
- Limit table rows to necessary amount (default 10-20)
- Reduce aggregation bucket sizes
- Use filters to reduce dataset before aggregation

### Index Management
- Implement index lifecycle policies (ILM) for log retention
- Roll over indices daily or weekly to manage size
- Archive old indices to cold storage or delete after retention period


