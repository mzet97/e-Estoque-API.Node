# 📊 Grafana Dashboard Configurations for e-Estoque

# Importante: Para usar essas configurações no Grafana:
# 1. Acesse Grafana -> Dashboards -> Import
# 2. Cole o JSON do dashboard desejado
# 3. Configure as variáveis de datasource (Prometheus, etc.)
# 4. Ajuste as variáveis de ambiente conforme necessário

---

## 1. MAIN APPLICATION DASHBOARD
```json
{
  "dashboard": {
    "id": null,
    "title": "e-Estoque - Application Overview",
    "tags": ["e-estoque", "application", "monitoring"],
    "timezone": "UTC",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time (P95)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_errors_total[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error %"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Active Sessions",
        "type": "stat",
        "targets": [
          {
            "expr": "session_active_total",
            "legendFormat": "Active Sessions"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      },
      {
        "id": 5,
        "title": "Request Rate Over Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
      },
      {
        "id": 6,
        "title": "Response Time Distribution",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.90, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P90"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P99"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16}
      },
      {
        "id": 7,
        "title": "Error Rate by Endpoint",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_errors_total[5m]) by (route, method) / rate(http_requests_total[5m]) by (route, method) * 100",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16}
      },
      {
        "id": 8,
        "title": "Cache Hit Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) * 100",
            "legendFormat": "Hit Rate %"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 24}
      },
      {
        "id": 9,
        "title": "Business Metrics",
        "type": "stat",
        "targets": [
          {
            "expr": "sales_total",
            "legendFormat": "Total Sales"
          },
          {
            "expr": "customer_registrations_total",
            "legendFormat": "Customer Registrations"
          },
          {
            "expr": "products_created_total",
            "legendFormat": "Products Created"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 24}
      }
    ],
    "templating": {
      "list": [
        {
          "name": "service",
          "type": "constant",
          "current": {"text": "e-estoque-api", "value": "e-estoque-api"},
          "query": "e-estoque-api",
          "hide": 0
        }
      ]
    }
  }
}
```

---

## 2. SYSTEM RESOURCES DASHBOARD
```json
{
  "dashboard": {
    "id": null,
    "title": "e-Estoque - System Resources",
    "tags": ["e-estoque", "system", "resources"],
    "timezone": "UTC",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "cpu_usage_percent",
            "legendFormat": "CPU %"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "memory_usage_bytes{type=\"heap\"} / memory_usage_bytes{type=\"heap\"}",
            "legendFormat": "Memory %"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Load Average",
        "type": "stat",
        "targets": [
          {
            "expr": "node_load1",
            "legendFormat": "1min Load"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Event Loop Delay",
        "type": "stat",
        "targets": [
          {
            "expr": "event_loop_delay_seconds",
            "legendFormat": "Delay (ms)"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      },
      {
        "id": 5,
        "title": "CPU Usage Over Time",
        "type": "graph",
        "targets": [
          {
            "expr": "cpu_usage_percent",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "node_load1",
            "legendFormat": "Load Average (1min)"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 6,
        "title": "Memory Usage Over Time",
        "type": "graph",
        "targets": [
          {
            "expr": "memory_usage_bytes{type=\"heap\"}",
            "legendFormat": "Heap Used"
          },
          {
            "expr": "memory_usage_bytes{type=\"rss\"}",
            "legendFormat": "RSS"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      },
      {
        "id": 7,
        "title": "Event Loop Delay Distribution",
        "type": "graph",
        "targets": [
          {
            "expr": "event_loop_delay_seconds",
            "legendFormat": "Delay"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 16}
      }
    ]
  }
}
```

---

## 3. BUSINESS METRICS DASHBOARD
```json
{
  "dashboard": {
    "id": null,
    "title": "e-Estoque - Business Metrics",
    "tags": ["e-estoque", "business", "metrics"],
    "timezone": "UTC",
    "refresh": "5m",
    "time": {
      "from": "now-24h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Total Sales",
        "type": "stat",
        "targets": [
          {
            "expr": "sales_total",
            "legendFormat": "Total Sales"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Revenue",
        "type": "stat",
        "targets": [
          {
            "expr": "revenue_total",
            "legendFormat": "Revenue (R$)"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Conversion Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "conversion_rate * 100",
            "legendFormat": "Conversion Rate %"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Customer Registrations",
        "type": "stat",
        "targets": [
          {
            "expr": "customer_registrations_total",
            "legendFormat": "New Customers"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      },
      {
        "id": 5,
        "title": "Sales Over Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(sales_total[1h])",
            "legendFormat": "Sales Rate"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 6,
        "title": "Revenue Over Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(revenue_total[1h])",
            "legendFormat": "Revenue Rate"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      },
      {
        "id": 7,
        "title": "Customer Registrations Over Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(customer_registrations_total[1h])",
            "legendFormat": "Registration Rate"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16}
      },
      {
        "id": 8,
        "title": "Inventory Status",
        "type": "stat",
        "targets": [
          {
            "expr": "inventory_value",
            "legendFormat": "Inventory Value (R$)"
          },
          {
            "expr": "low_stock_products",
            "legendFormat": "Low Stock Products"
          },
          {
            "expr": "out_of_stock_products",
            "legendFormat": "Out of Stock"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16}
      }
    ]
  }
}
```

---

## 4. DATABASE & CACHE DASHBOARD
```json
{
  "dashboard": {
    "id": null,
    "title": "e-Estoque - Database & Cache",
    "tags": ["e-estoque", "database", "cache"],
    "timezone": "UTC",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Database Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "database_connections_active",
            "legendFormat": "Active Connections"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Query Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "database_query_rate",
            "legendFormat": "Queries/sec"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Cache Hit Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "cache_hit_rate",
            "legendFormat": "Hit Rate %"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Cache Operations",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(cache_operations_total[5m])",
            "legendFormat": "Ops/sec"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      },
      {
        "id": 5,
        "title": "Database Query Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(database_query_duration_seconds_bucket[5m]))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(database_query_duration_seconds_bucket[5m]))",
            "legendFormat": "P99"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 6,
        "title": "Database Errors",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(database_errors_total[5m])",
            "legendFormat": "Errors/sec"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      },
      {
        "id": 7,
        "title": "Cache Hit/Miss Ratio",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m])",
            "legendFormat": "Hits"
          },
          {
            "expr": "rate(cache_misses_total[5m])",
            "legendFormat": "Misses"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16}
      },
      {
        "id": 8,
        "title": "Cache Operation Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(cache_operation_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16}
      }
    ]
  }
}
```

---

## 5. HEALTH & ALERTS DASHBOARD
```json
{
  "dashboard": {
    "id": null,
    "title": "e-Estoque - Health & Alerts",
    "tags": ["e-estoque", "health", "alerts"],
    "timezone": "UTC",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "Service Health Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "Service Status"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Active Alerts",
        "type": "stat",
        "targets": [
          {
            "expr": "alerts_active_total",
            "legendFormat": "Active Alerts"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "External Services Health",
        "type": "table",
        "targets": [
          {
            "expr": "external_service_up",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Response Time by Service",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(external_service_duration_seconds_bucket[5m]))",
            "legendFormat": "{{service_name}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16}
      },
      {
        "id": 5,
        "title": "External Service Errors",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(external_service_errors_total[5m])",
            "legendFormat": "{{service_name}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16}
      }
    ]
  }
}
```

---

## INSTRUCTIONS FOR GRAFANA SETUP:

### 1. Install Grafana and Prometheus:
```bash
# Using Docker
docker run -d --name grafana -p 3000:3000 grafana/grafana
docker run -d --name prometheus -p 9090:9090 prom/prometheus
```

### 2. Configure Prometheus to scrape e-Estoque metrics:
Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 30s

scrape_configs:
  - job_name: 'e-estoque-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### 3. Add Prometheus as Data Source in Grafana:
- Go to Configuration > Data Sources
- Add Prometheus
- Set URL: http://localhost:9090

### 4. Import Dashboards:
- Go to Dashboards > Import
- Copy and paste each JSON configuration
- Select your Prometheus data source
- Adjust variables as needed

### 5. Configure Alerting (Optional):
- Set up alert rules in Prometheus
- Configure notification channels in Grafana
- Set up alerting for critical thresholds

---

## DASHBOARD VARIABLES TO CONFIGURE:

### For All Dashboards:
- `service`: e-estoque-api (or your service name)
- `environment`: production/staging/development
- `instance`: localhost:3000 (or your endpoint)

### Additional Variables (if needed):
- `company_id`: Filter by company
- `user_tier`: Filter by user tier
- `route`: Filter by API route
- `status_code`: Filter by HTTP status codes

---

## ALERT RULES FOR PROMETHEUS:

```yaml
groups:
- name: e-estoque-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }}"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }}s"

  - alert: HighMemoryUsage
    expr: memory_usage_bytes / 1024 / 1024 / 1024 > 1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is {{ $value }}GB"

  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service is down"
      description: "e-Estoque API is not responding"
```

---

## NOTES:
- These dashboards are designed for Grafana 8.0+
- Adjust refresh intervals based on your needs
- Customize panels according to your specific metrics
- Set up proper alerting thresholds for your environment
- Use appropriate time ranges for different metrics