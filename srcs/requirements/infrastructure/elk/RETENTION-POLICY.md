# Log Data Retention Policy

## Overview

This document describes the automated log data retention policy using Elasticsearch Index Lifecycle Management (ILM). Logs are automatically deleted after 30 days to manage storage efficiently.

## Policy Name

`logs_retention_policy`

## Policy Configuration

### Hot Phase (0-30 days)
- **Duration**: From index creation to 30 days
- **Priority**: 100 (ensures recent logs get resources first)
- **Actions**: Active writing and searching
- Logs remain fully accessible for queries and analysis

### Delete Phase (30+ days)
- **Duration**: After 30 days from index creation
- **Actions**: Automatically delete index and all data
- Frees storage space without manual intervention

## How It Works

1. **Logstash** creates daily indices:
   - `nginx-logs-YYYY.MM.DD` (Nginx access logs)
   - `application-logs-YYYY.MM.DD` (Application container logs)

2. **ILM Policy** monitors index age:
   - Days 0-30: Index stays in hot phase (fully accessible)
   - Day 30+: Index is automatically deleted

3. **No manual cleanup required** - ILM handles everything automatically

## Affected Indices

### Nginx Access Logs
- **Pattern**: `nginx-logs-*`
- **Template**: `nginx-logs-template`
- **Data**: HTTP access logs from Nginx reverse proxy
- **Fields**: clientip, http_method, url_path, response, bytes, referrer, agent

### Application Logs
- **Pattern**: `application-logs-*`
- **Template**: `application-logs-template`
- **Data**: Docker container logs from microservices
- **Services**: user-service, game-service, chat-service, frontend

## Verification Commands

### Check ILM Policy
```bash
# View the policy
docker exec elasticsearch curl -s -X GET "localhost:9200/_ilm/policy/logs_retention_policy?pretty"

# Check which indices are managed
docker exec elasticsearch curl -s -X GET "localhost:9200/nginx-logs-*/_ilm/explain?pretty"
```

### View Index Status
```bash
# List all log indices with age
docker exec elasticsearch curl -s -X GET "localhost:9200/_cat/indices/*logs*?v&s=index"

# Check specific index lifecycle state
docker exec elasticsearch curl -s -X GET "localhost:9200/nginx-logs-2025.11.15/_ilm/explain?pretty"
```

### View Index Templates
```bash
# Check nginx-logs template
docker exec elasticsearch curl -s -X GET "localhost:9200/_index_template/nginx-logs-template?pretty"

# Check application-logs template
docker exec elasticsearch curl -s -X GET "localhost:9200/_index_template/application-logs-template?pretty"
```

## Storage Estimation

With 30-day retention:
- **Storage needed**: 30 daily indices per log type
- **Example**: If logs = 1GB/day → Total = 30GB per log type
- **Total for both**: ~60GB for nginx + application logs combined

## Manual Operations

### Change Retention Period

To change from 30 to 60 days:
```bash
docker exec elasticsearch curl -s -X PUT "localhost:9200/_ilm/policy/logs_retention_policy?pretty" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "set_priority": {
            "priority": 100
          }
        }
      },
      "delete": {
        "min_age": "60d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'
```

### Manually Delete Old Indices

If you need to delete indices before 30 days:
```bash
# Delete specific index
docker exec elasticsearch curl -s -X DELETE "localhost:9200/nginx-logs-2025.11.01?pretty"

# Delete indices older than specific date
docker exec elasticsearch curl -s -X DELETE "localhost:9200/nginx-logs-2025.11.*?pretty"
```

### Temporarily Stop ILM

If you need to pause automatic deletion:
```bash
# Stop ILM
docker exec elasticsearch curl -s -X POST "localhost:9200/_ilm/stop?pretty"

# Check ILM status
docker exec elasticsearch curl -s -X GET "localhost:9200/_ilm/status?pretty"

# Start ILM again
docker exec elasticsearch curl -s -X POST "localhost:9200/_ilm/start?pretty"
```

## Troubleshooting

### Check ILM Is Running
```bash
docker exec elasticsearch curl -s -X GET "localhost:9200/_ilm/status?pretty"
```
Should return: `"operation_mode" : "RUNNING"`

### Check Index Age
```bash
docker exec elasticsearch curl -s -X GET "localhost:9200/nginx-logs-*/_ilm/explain?pretty" | grep -E '(index|age)'
```

### Force Retry Failed Actions
If an index gets stuck:
```bash
docker exec elasticsearch curl -s -X POST "localhost:9200/INDEX_NAME/_ilm/retry?pretty"
```

## Important Notes

1. **Automatic Deletion**: Indices older than 30 days are permanently deleted - no backups are made
2. **Daily Indices**: Logstash creates one index per day automatically
3. **Template Auto-Apply**: New indices automatically get the ILM policy from templates
4. **No Rollover**: Daily index creation is handled by Logstash, not ILM rollover
5. **Single Node**: This configuration is optimized for single-node development setup

## Compliance

- ✅ Automatic 30-day retention meets data minimization requirements
- ✅ No manual intervention required
- ✅ All deletions are logged in Elasticsearch logs
- ✅ Storage usage is predictable and controlled

## Backup Recommendations

If you need to preserve logs beyond 30 days:

1. **Export to file** before deletion:
```bash
# Export index to JSON
docker exec elasticsearch curl -s -X GET "localhost:9200/nginx-logs-2025.11.15/_search?size=10000" > backup.json
```

2. **Snapshot to S3/NFS** (advanced - not implemented by default)

3. **Increase retention period** to 60 or 90 days using the command above

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-11-15 | Simplified to hot + delete only (removed warm phase) |
| 1.0 | 2025-11-15 | Initial implementation with hot/warm/delete phases |
