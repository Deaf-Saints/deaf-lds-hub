# Docker Best Practices

Production-ready Docker guidelines for security, performance, and maintainability.

## Container Design

### One Process Per Container

```yaml
# Good - separate containers
services:
  web:
    image: nginx
  app:
    image: my-app
  db:
    image: postgres

# Bad - multiple processes in one container
```

Benefits:
- Easier scaling
- Independent updates
- Cleaner logs
- Better resource management

### Make Containers Ephemeral

Containers should be disposable. Design for:
- Quick startup and shutdown
- No important state inside containers
- External data storage (volumes, databases)

```bash
# Container can be killed and recreated without data loss
docker stop my-app && docker rm my-app
docker run -v data:/app/data my-app
```

### Use Environment Variables for Configuration

```yaml
services:
  app:
    image: my-app
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - FEATURE_FLAG=${FEATURE_FLAG:-false}
```

---

## Security

### Run as Non-Root

```dockerfile
FROM node:18-alpine

RUN addgroup -S app && adduser -S app -G app
USER app

WORKDIR /app
COPY --chown=app:app . .
CMD ["node", "server.js"]
```

### Use Read-Only Filesystems

```yaml
services:
  app:
    image: my-app
    read_only: true
    tmpfs:
      - /tmp
    volumes:
      - logs:/app/logs
```

### Limit Capabilities

```yaml
services:
  app:
    image: my-app
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### Don't Store Secrets in Images

```bash
# Bad
docker build --build-arg API_KEY=secret .

# Good - use secret management
docker run -e API_KEY_FILE=/run/secrets/api_key \
  -v ./secrets/api_key:/run/secrets/api_key:ro \
  my-app
```

### Scan Images Regularly

```bash
# Docker Scout
docker scout cves my-image:latest

# Trivy
trivy image my-image:latest

# Snyk
snyk container test my-image:latest
```

### Use Trusted Base Images

- Official images from Docker Hub
- Verified publisher images
- Images from your organization's registry

```dockerfile
# Good - official image
FROM node:18-alpine

# Avoid - unknown sources
FROM randomuser/node
```

---

## Networking

### Use User-Defined Networks

```yaml
services:
  web:
    networks:
      - frontend
  api:
    networks:
      - frontend
      - backend
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
```

### Don't Expose Unnecessary Ports

```yaml
services:
  db:
    image: postgres
    # No ports exposed - only accessible within network
    # ports:
    #   - "5432:5432"  # Don't do this in production
```

### Use Internal Networks for Backend Services

```yaml
networks:
  backend:
    internal: true  # No external access
```

---

## Data Management

### Use Named Volumes for Persistent Data

```yaml
services:
  db:
    image: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Backup Volumes Regularly

```bash
# Backup
docker run --rm \
  -v pgdata:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/pgdata-$(date +%Y%m%d).tar.gz -C /source .

# Restore
docker run --rm \
  -v pgdata:/target \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/pgdata-20230101.tar.gz -C /target
```

### Don't Use Bind Mounts in Production

```yaml
# Development - bind mounts OK
services:
  app:
    volumes:
      - ./src:/app/src

# Production - use named volumes or no mounts
services:
  app:
    # Code baked into image
```

---

## Resource Management

### Set Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Use Appropriate Restart Policies

```yaml
services:
  # Production services
  app:
    restart: unless-stopped

  # Databases
  db:
    restart: always

  # One-off tasks
  migration:
    restart: "no"
```

---

## Logging

### Use Centralized Logging

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Log to stdout/stderr

```dockerfile
# Application should log to stdout/stderr
CMD ["node", "server.js"]

# Not to files
# CMD ["node", "server.js", ">", "/var/log/app.log"]
```

### Configure Log Rotation

```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

---

## Health Checks

### Define Health Checks

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

### Use Health Checks for Dependencies

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

## Image Management

### Tag Images Properly

```bash
# Version tags
my-app:1.0.0
my-app:1.0
my-app:1

# Environment tags
my-app:production
my-app:staging

# Git-based tags
my-app:abc123f
my-app:main-abc123f
```

### Clean Up Unused Resources

```bash
# Remove dangling images
docker image prune

# Remove unused images
docker image prune -a

# Remove all unused resources
docker system prune

# Aggressive cleanup
docker system prune -a --volumes
```

### Use Multi-Stage Builds

```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/main.js"]
```

---

## CI/CD Integration

### Build Once, Deploy Many

```bash
# Build with specific tag
docker build -t my-app:$GIT_SHA .

# Deploy to staging
docker tag my-app:$GIT_SHA registry.example.com/my-app:staging
docker push registry.example.com/my-app:staging

# Promote to production
docker tag my-app:$GIT_SHA registry.example.com/my-app:production
docker push registry.example.com/my-app:production
```

### Automate Image Scanning

```yaml
# GitHub Actions example
- name: Scan image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'my-app:${{ github.sha }}'
    exit-code: '1'
    severity: 'HIGH,CRITICAL'
```

---

## Monitoring

### Monitor Container Metrics

```bash
# Built-in stats
docker stats

# Prometheus metrics
# Use cAdvisor or Docker exporter
```

### Set Up Alerts

Monitor for:
- Container restarts
- High memory/CPU usage
- Health check failures
- Disk space (volumes)

---

## Checklist

### Development

- [ ] Use docker-compose for local development
- [ ] Bind mount source code for hot reload
- [ ] Use override files for dev-specific config
- [ ] Document how to run locally in README

### Production

- [ ] Use specific image tags (not `latest`)
- [ ] Set resource limits
- [ ] Configure health checks
- [ ] Use non-root user
- [ ] Enable log rotation
- [ ] Set restart policies
- [ ] Use secrets management
- [ ] Regular security scans
- [ ] Backup strategy for volumes
- [ ] Monitoring and alerting

---

## Quick Reference

| Practice | Development | Production |
|----------|-------------|------------|
| Image tags | `latest` OK | Specific versions |
| Volumes | Bind mounts | Named volumes |
| Ports | Expose freely | Minimal exposure |
| Logging | Console OK | Centralized |
| Secrets | .env files | Secret management |
| Resources | Unlimited OK | Set limits |
| Health checks | Optional | Required |
| Restart policy | `no` | `unless-stopped` |

---

## Summary

1. **Security First**: Non-root, minimal permissions, scan regularly
2. **Ephemeral Containers**: Disposable, stateless, quick startup
3. **External State**: Use volumes and databases for persistence
4. **Resource Limits**: Prevent runaway containers
5. **Health Checks**: Enable automatic recovery
6. **Logging**: Centralize and rotate logs
7. **Networking**: Isolate services appropriately
8. **Automation**: CI/CD for builds and deployments
