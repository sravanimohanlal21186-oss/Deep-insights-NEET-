# Deep Insights NEET - Production Setup for 200K Concurrent Users

## Architecture Overview

This setup supports 200,000 concurrent users with automatic scaling, caching, and monitoring.

```
Users (200K)
    ↓
CDN/Load Balancer (AWS ALB/GCP LB)
    ↓
Kubernetes Cluster (Auto-scaling 10-100 pods)
    ├── API Pods (Node.js clusters)
    ├── PostgreSQL (1 primary + read replicas)
    └── Redis (Cache layer)
    ↓
Monitoring (Prometheus + Grafana)
```

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Start with Docker Compose
docker-compose up

# Run tests
npm test

# Load test locally
npm run test:load
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace production

# Create secrets
kubectl create secret generic postgres-secret \
  --from-literal=password=your_secure_password \
  -n production

kubectl create secret generic grafana-secret \
  --from-literal=password=your_secure_password \
  -n production

# Build and push Docker image
npm run docker:build
docker tag deep-insights-neet:latest your-registry/deep-insights-neet:latest
docker push your-registry/deep-insights-neet:latest

# Deploy
kubectl apply -f k8s/ -n production

# Monitor deployment
kubectl rollout status deployment/neet-insights -n production
```

## Performance Optimizations

### 1. **Horizontal Scaling**
- Node.js clustering (multi-core utilization)
- Kubernetes HPA (10-100 replicas)
- Load balancing with session affinity

### 2. **Caching Strategy**
- Redis for session/frequent data (5-10 min TTL)
- In-memory caching for static queries
- Cache invalidation on updates

### 3. **Database Optimization**
- Connection pooling (50 connections per pod)
- Prepared statements
- Composite indexes on common queries
- Read replicas for scaling reads

### 4. **API Efficiency**
- Pagination (max 100 items/page)
- Response compression (gzip)
- Rate limiting (1000 req/user per 15 min)
- Request validation with Joi

### 5. **Monitoring & Alerts**
- Prometheus metrics on every endpoint
- Grafana dashboards
- Health checks every 10s
- Auto-scale on CPU/Memory

## Capacity Planning

For **200,000 concurrent users**:

| Component | Sizing | Notes |
|-----------|--------|-------|
| API Pods | 50-100 | 2000 users per pod |
| CPU per Pod | 500m | 5 cores total cluster |
| Memory per Pod | 512Mi | 50GB total cluster |
| PostgreSQL | 2CPU, 8GB RAM | With connection pooling |
| Redis | 1CPU, 1GB RAM | LRU eviction policy |
| Bandwidth | ~10 Gbps | Depends on response size |

## Monitoring Dashboard

Access Grafana at `http://localhost:3001` (production load balancer)

Key metrics to watch:
- Request latency (p50, p95, p99)
- Error rate (5xx, 4xx)
- Database connection pool usage
- Redis hit/miss rate
- Pod CPU/Memory utilization

## Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] Monitoring alerts set up
- [ ] Auto-scaling thresholds tuned
- [ ] Load test passed (200K users)
- [ ] CI/CD pipeline configured
- [ ] Log aggregation set up
- [ ] Disaster recovery plan documented

## Common Issues & Fixes

### High Database Connection Pool Usage
- Increase `max` in pool.js
- Check for connection leaks in routes
- Verify Redis caching is working

### High Redis Memory
- Lower cache TTL
- Reduce cache key cardinality
- Enable Redis eviction policy

### 5XX Errors on Scale
- Check pod resource requests/limits
- Verify database replication lag
- Review application logs

## Load Testing

```bash
# Test with 200K concurrent users (5000 RPS)
artillery run artillery/load-test.yml

# Test specific endpoint
artillery quick --count 50000 --num 1000 https://deepinsightsneet.com/api/questions
```

## Security Hardening

✅ Implemented:
- Helmet.js security headers
- CORS configuration
- Rate limiting per IP
- Input validation with Joi
- SQL injection prevention (parameterized queries)
- XSS protection (JSON responses only)

Additional steps:
- Enable WAF rules
- Configure DDoS protection
- Set up API gateway authentication
- Implement request signing

## Scaling Beyond 200K

For 1M+ concurrent users:
1. Database sharding by user/subject
2. Multi-region deployment
3. GraphQL with DataLoader for batching
4. WebSocket servers for real-time features
5. Message queue (RabbitMQ/Kafka) for async tasks

## Support & Alerts

Set up PagerDuty/OpsGenie alerts for:
- 5XX error rate > 1%
- Response time p99 > 5s
- Database replication lag > 10s
- Pod CPU > 80% for 5 min
- Pod Memory > 90% for 5 min

---

**Last Updated**: 2026-06-06
**Target Load**: 200,000 concurrent users
**SLA**: 99.95% uptime
