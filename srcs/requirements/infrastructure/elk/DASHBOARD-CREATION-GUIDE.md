# Kibana Dashboard Creation Guide - Task 1.3

**Module:** #39 (ELK Stack for Log Management)
**Requirement:** Creating dashboards and generating insights from log events
**Time Estimate:** 2-3 hours

---

## Prerequisites

✅ Index patterns created (nginx-logs-*, application-logs-*)
✅ Log data flowing from Logstash to Elasticsearch
✅ Kibana accessible at https://localhost:8090/kibana/

---

## Dashboard 1: HTTP Traffic Analytics

**Purpose:** Monitor web traffic, API usage, and HTTP errors from nginx access logs.

### Creation Steps

1. **Navigate to Kibana**
   ```
   Open: https://localhost:8090/kibana/
   Go to: Dashboard → Create dashboard
   ```

2. **Name the Dashboard**
   - Click "Save"
   - Title: **HTTP Traffic Analytics**
   - Description: Monitor web traffic, API usage, and HTTP errors from nginx access logs
   - Click "Save"

### Panel 1: Request Rate Over Time

1. Click **Create visualization**
2. Visualization type: **Line**
3. Index pattern: `nginx-logs-*`
4. **Metrics:**
   - Y-axis: Count
5. **Buckets:**
   - X-axis: Date Histogram
   - Field: `@timestamp`
   - Interval: Auto
6. Save as: "Request Rate Over Time"

### Panel 2: HTTP Status Code Distribution

1. Click **Create visualization**
2. Visualization type: **Pie**
3. Index pattern: `nginx-logs-*`
4. **Metrics:**
   - Slice size: Count
5. **Buckets:**
   - Split slices: Terms
   - Field: `http.response.status_code` (or `response` if available)
   - Size: 10
   - Order by: Metric: Count (Descending)
6. **Options:**
   - Show labels: Yes
   - Show values: Yes
7. Save as: "HTTP Status Codes"

### Panel 3: Top 10 Endpoints

1. Click **Create visualization**
2. Visualization type: **Data table**
3. Index pattern: `nginx-logs-*`
4. **Metrics:**
   - Metric: Count
5. **Buckets:**
   - Split rows: Terms
   - Field: `url.original.keyword` (or `url_path.keyword` if available)
   - Order by: Metric: Count
   - Order: Descending
   - Size: 10
6. Save as: "Top Endpoints"

### Panel 4: Average Response Size

1. Click **Create visualization**
2. Visualization type: **Metric**
3. Index pattern: `nginx-logs-*`
4. **Metrics:**
   - Aggregation: Average
   - Field: `http.response.body.bytes` (or `bytes` if available)
   - Custom label: "Avg Response Size (bytes)"
5. **Options:**
   - Font size: Large (60)
6. Save as: "Average Response Size"

### Panel 5: HTTP Methods Distribution

1. Click **Create visualization**
2. Visualization type: **Horizontal bar**
3. Index pattern: `nginx-logs-*`
4. **Metrics:**
   - Y-axis: Count
5. **Buckets:**
   - X-axis: Terms
   - Field: `http.request.method.keyword` (or `http_method.keyword` if available)
   - Size: 10
   - Order: Descending
6. Save as: "HTTP Methods"

### Panel 6: User Agents (Browsers)

1. Click **Create visualization**
2. Visualization type: **Tag cloud**
3. Index pattern: `nginx-logs-*`
4. **Metrics:**
   - Tag size: Count
5. **Buckets:**
   - Tags: Terms
   - Field: `user_agent.original.keyword` (or `agent.keyword` if available)
   - Size: 20
   - Order: Metric (Count) Descending
6. **Options:**
   - Scale: Linear
   - Orientation: Single
   - Font sizes: 18-72
7. Save as: "User Agents"

### Panel 7: Recent Errors (4xx/5xx)

1. Click **Create visualization**
2. Visualization type: **Data table**
3. Index pattern: `nginx-logs-*`
4. **Add filter:**
   - Click "Add filter"
   - Field: `http.response.status_code` (or `response`)
   - Operator: is between
   - Value: 400 and 599
5. **Metrics:**
   - Metric: Count
6. **Buckets:**
   - Split rows: Terms
   - Field: `url.original.keyword` (or `url_path.keyword`)
   - Size: 10
   - Order: Descending
7. **Time range:** Last 24 hours
8. Save as: "Recent Errors"

### Save the Dashboard

Click **Save** → Confirm title: "HTTP Traffic Analytics"

---

## Dashboard 2: Application Logs Overview

**Purpose:** Monitor application-level logs, errors, and service health.

### Creation Steps

1. **Create new dashboard**
   - Navigate to: Dashboard → Create dashboard
   - Title: **Application Logs Overview**
   - Description: Monitor application-level logs, errors, and service health from Docker containers

### Panel 1: Log Levels Distribution

1. Click **Create visualization**
2. Visualization type: **Pie** (Donut)
3. Index pattern: `application-logs-*`
4. **Metrics:**
   - Slice size: Count
5. **Buckets:**
   - Split slices: Terms
   - Field: `log_level.keyword`
   - Size: 10
6. **Options:**
   - Donut: Yes
   - Show labels: Yes
7. Save as: "Log Levels"

### Panel 2: Logs by Service

1. Click **Create visualization**
2. Visualization type: **Vertical bar**
3. Index pattern: `application-logs-*`
4. **Metrics:**
   - Y-axis: Count
5. **Buckets:**
   - X-axis: Terms
   - Field: `service.keyword`
   - Size: 10
   - Order: Descending
6. Save as: "Logs by Service"

### Panel 3: Error Timeline

1. Click **Create visualization**
2. Visualization type: **Line**
3. Index pattern: `application-logs-*`
4. **Add filter:**
   - Field: `log_level`
   - Operator: is
   - Value: error
5. **Metrics:**
   - Y-axis: Count
6. **Buckets:**
   - X-axis: Date Histogram
   - Field: `@timestamp`
   - Interval: Auto
7. Save as: "Error Timeline"

### Panel 4: Recent Errors

1. Click **Create visualization**
2. Visualization type: **Data table**
3. Index pattern: `application-logs-*`
4. **Add filter:**
   - Field: `log_level`
   - Operator: is
   - Value: error
5. **Buckets:**
   - Split rows: Date histogram
   - Field: `@timestamp`
   - Custom label: "Time"
   - Then add: Split rows: Terms
   - Field: `service.keyword`
   - Custom label: "Service"
   - Then add: Split rows: Terms
   - Field: `log_message.keyword`
   - Custom label: "Error Message"
   - Size: 20
6. **Table settings:**
   - Per page: 20
   - Sort: Time (descending)
7. Save as: "Recent Errors"

### Panel 5: Top Error Messages

1. Click **Create visualization**
2. Visualization type: **Data table**
3. Index pattern: `application-logs-*`
4. **Add filter:**
   - Field: `log_level`
   - Operator: is
   - Value: error
5. **Metrics:**
   - Count
6. **Buckets:**
   - Split rows: Terms
   - Field: `log_message.keyword`
   - Size: 10
   - Order: Descending
7. Save as: "Top Error Messages"

### Save the Dashboard

Click **Save** → Confirm title: "Application Logs Overview"

---

## Dashboard 3: Service Health Monitor

**Purpose:** Container and service availability tracking with log volume monitoring.

### Creation Steps

1. **Create new dashboard**
   - Navigate to: Dashboard → Create dashboard
   - Title: **Service Health Monitor**
   - Description: Container and service availability tracking

### Panel 1: Active Containers

1. Click **Create visualization**
2. Visualization type: **Metric**
3. Index pattern: `application-logs-*`
4. **Metrics:**
   - Aggregation: Unique Count
   - Field: `container.name.keyword`
   - Custom label: "Active Containers"
5. **Options:**
   - Font size: Large (60)
6. Save as: "Active Containers"

### Panel 2: Log Volume by Service

1. Click **Create visualization**
2. Visualization type: **Line**
3. Index pattern: `application-logs-*`
4. **Metrics:**
   - Y-axis: Count
5. **Buckets:**
   - X-axis: Date Histogram
   - Field: `@timestamp`
   - Interval: Auto
   - Then add: Split series: Terms
   - Field: `service.keyword`
   - Size: 10
6. **Options:**
   - Legend position: Right
   - Show tooltips: Yes
7. Save as: "Log Volume by Service"

### Panel 3: Error Rate by Service

1. Click **Create visualization**
2. Visualization type: **Line**
3. Index pattern: `application-logs-*`
4. **Add filter:**
   - Field: `log_level`
   - Operator: is
   - Value: error
5. **Metrics:**
   - Y-axis: Count
6. **Buckets:**
   - X-axis: Date Histogram
   - Field: `@timestamp`
   - Then add: Split series: Terms
   - Field: `service.keyword`
   - Size: 10
7. Save as: "Error Rate by Service"

### Panel 4: Service Startup Events

1. Click **Create visualization**
2. Visualization type: **Data table**
3. Index pattern: `application-logs-*`
4. **Add filter (using KQL):**
   - Query bar: `log_message:*started* OR log_message:*listening*`
5. **Buckets:**
   - Split rows: Date histogram
   - Field: `@timestamp`
   - Custom label: "Time"
   - Then add: Split rows: Terms
   - Field: `service.keyword`
   - Custom label: "Service"
   - Then add: Split rows: Terms
   - Field: `log_message.keyword`
   - Custom label: "Message"
   - Size: 10
6. **Table settings:**
   - Per page: 20
   - Sort: Time (descending)
7. Save as: "Service Startup Events"

### Save the Dashboard

Click **Save** → Confirm title: "Service Health Monitor"

---

## Field Name Reference

Depending on your Logstash grok patterns and Elasticsearch mappings, field names may vary. Here's a mapping reference:

### Nginx Logs Fields

| Expected Field (Implementation Plan) | Actual Field (Your Setup) |
|-------------------------------------|---------------------------|
| `response` | `http.response.status_code` |
| `http_method` | `http.request.method` |
| `url_path` | `url.original` |
| `bytes` | `http.response.body.bytes` |
| `agent` | `user_agent.original` |

### Application Logs Fields

| Expected Field | Actual Field |
|---------------|--------------|
| `log_level` | `log_level` (should match) |
| `service` | `service` (should match) |
| `log_message` | `log_message` (should match) |
| `container.name` | `container.name` (should match) |

**To verify your field names:**
1. Go to **Discover**
2. Select your index pattern
3. Expand a document
4. Check the actual field names in the JSON

---

## Verification

After creating all dashboards:

1. **Navigate to Dashboards**
   ```
   Go to: Kibana → Dashboard
   ```

2. **You should see:**
   - HTTP Traffic Analytics
   - Application Logs Overview
   - Service Health Monitor

3. **Test each dashboard:**
   - Select time range: "Last 24 hours"
   - Verify data is displayed
   - Click "Refresh" if panels are empty

4. **Generate test traffic:**
   - Use the frontend application: Browse to `https://localhost:8090` and interact with the UI
   - Use Swagger UI: Visit `https://localhost:8090/docs/user` (or /game, /chat) and test API endpoints
   - Wait 30-60 seconds for logs to flow through Logstash
   - Refresh Kibana dashboards to see the new data

---

## Troubleshooting

### No data in panels

**Cause:** No matching data in Elasticsearch indices

**Solution:**
```bash
# Check if indices exist and have data
docker exec elasticsearch curl -s 'http://localhost:9200/_cat/indices?v' | grep logs

# Should show nginx-logs-* and application-logs-* with doc counts > 0
```

### Field not found errors

**Cause:** Field names don't match between dashboard configuration and actual data

**Solution:**
1. Go to **Discover**
2. Select the index pattern
3. View an actual document to see field names
4. Edit visualizations to use correct field names
5. Update this guide with your actual field mappings

### Panels show "No results found"

**Cause:** Time range doesn't match when data was ingested

**Solution:**
1. Click time picker (top right)
2. Select "Last 7 days" or "Last 30 days"
3. Or select "Absolute" and choose specific date range

---

## Export Dashboards (Optional)

After creating dashboards manually, you can export them:

1. **Navigate to Stack Management**
   ```
   Kibana → Stack Management → Saved Objects
   ```

2. **Select dashboards to export**
   - Check: HTTP Traffic Analytics
   - Check: Application Logs Overview
   - Check: Service Health Monitor

3. **Export**
   - Click "Export"
   - Save as: `kibana-dashboards-export.ndjson`

4. **Add to auto-provisioning** (if desired):
   ```bash
   # Copy exported file to saved-objects directory
   cp kibana-dashboards-export.ndjson \
      srcs/requirements/infrastructure/elk/kibana/saved-objects/dashboards.ndjson

   # Rebuild Kibana to apply
   docker-compose up -d --build kibana
   ```

---

## Completion Checklist

- [ ] Dashboard 1: HTTP Traffic Analytics (7 panels)
- [ ] Dashboard 2: Application Logs Overview (5 panels)
- [ ] Dashboard 3: Service Health Monitor (4 panels)
- [ ] All dashboards show data
- [ ] Field names verified and documented
- [ ] Dashboards exported (optional)
- [ ] Screenshots taken for documentation

---

**Task 1.3 Status:** ✅ COMPLETE (Manual creation method)
**Time Spent:** ~2-3 hours
**Next Task:** Task 1.4 (Implement Data Retention Policy)
