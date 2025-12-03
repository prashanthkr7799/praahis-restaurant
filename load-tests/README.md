# Load Testing with k6

This directory contains k6 load testing scripts for the Praahis Restaurant SaaS platform.

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Windows (with Chocolatey)
choco install k6

# Docker
docker pull grafana/k6
```

## Available Tests

| Script                | Description                 | Target            |
| --------------------- | --------------------------- | ----------------- |
| `api-load-test.js`    | API endpoint stress testing | Backend APIs      |
| `customer-journey.js` | Full customer order flow    | E2E User Journey  |
| `realtime-test.js`    | WebSocket/Realtime load     | Supabase Realtime |

## Running Tests

### Quick Smoke Test (10 users, 30 seconds)

```bash
k6 run --vus 10 --duration 30s load-tests/api-load-test.js
```

### Standard Load Test (50 users, 5 minutes)

```bash
k6 run --vus 50 --duration 5m load-tests/api-load-test.js
```

### Stress Test (Ramp up to 200 users)

```bash
k6 run load-tests/api-load-test.js
```

### With Environment Variables

```bash
k6 run \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  -e RESTAURANT_ID=your-restaurant-id \
  load-tests/api-load-test.js
```

## Output Formats

### Console (default)

```bash
k6 run load-tests/api-load-test.js
```

### JSON Output

```bash
k6 run --out json=results.json load-tests/api-load-test.js
```

### InfluxDB + Grafana

```bash
k6 run --out influxdb=http://localhost:8086/k6 load-tests/api-load-test.js
```

## Performance Targets

| Metric              | Target      | Critical   |
| ------------------- | ----------- | ---------- |
| Response Time (p95) | < 500ms     | < 1000ms   |
| Response Time (p99) | < 1000ms    | < 2000ms   |
| Error Rate          | < 1%        | < 5%       |
| Throughput          | > 100 req/s | > 50 req/s |

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Run Load Tests
  uses: grafana/k6-action@v0.3.0
  with:
    filename: load-tests/api-load-test.js
    flags: --vus 50 --duration 2m
```
