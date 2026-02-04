# Dockerfile Best Practices

Optimize your Dockerfiles for smaller, faster, and more secure images.

## Image Size Optimization

### Use Small Base Images

| Base Image | Size |
|------------|------|
| `ubuntu:22.04` | ~77 MB |
| `debian:bullseye-slim` | ~52 MB |
| `alpine:3.18` | ~7 MB |
| `distroless/static` | ~2 MB |

```dockerfile
# Instead of
FROM node:18

# Use
FROM node:18-alpine

# Or for production
FROM node:18-slim
```

### Use Multi-Stage Builds

Keep only what's needed in the final image:

```dockerfile
# Build stage with all tools
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - minimal
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

### Minimize Layer Count

Combine related commands:

```dockerfile
# Bad - 3 layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git

# Good - 1 layer
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*
```

### Clean Up in Same Layer

```dockerfile
# Bad - cache still in layer
RUN apt-get update && apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# Good - cache removed in same layer
RUN apt-get update \
    && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*
```

---

## Build Speed Optimization

### Order Instructions by Change Frequency

Put rarely-changing instructions first:

```dockerfile
# Rarely changes
FROM node:18-alpine
WORKDIR /app

# Changes sometimes
COPY package*.json ./
RUN npm ci

# Changes often - put last
COPY . .
RUN npm run build
```

### Use .dockerignore

Exclude unnecessary files:

```
node_modules
.git
.env
*.md
Dockerfile
docker-compose*
coverage
.nyc_output
```

### Use Cache Mounts (BuildKit)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./

# Cache npm packages
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build
```

---

## Security Best Practices

### Don't Run as Root

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY --chown=node:node . .

# Switch to non-root user
USER node

CMD ["node", "server.js"]
```

Or create a dedicated user:

```dockerfile
FROM alpine:3.18

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup . .

USER appuser
CMD ["./app"]
```

### Use Specific Image Tags

```dockerfile
# Bad - unpredictable
FROM node:latest

# Good - specific version
FROM node:18.17.1-alpine3.18

# Even better - use digest
FROM node@sha256:abc123...
```

### Don't Store Secrets in Images

```dockerfile
# Bad - secret in image history
ENV API_KEY=secret123
COPY .env .

# Good - use at runtime
# docker run -e API_KEY=secret123 my-app
```

Use BuildKit secrets for build-time secrets:

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install
```

### Scan for Vulnerabilities

```bash
# Using Docker Scout
docker scout cves my-image

# Using Trivy
trivy image my-image
```

### Use Read-Only Filesystem

```dockerfile
# In Dockerfile
RUN chmod -R a-w /app

# Or at runtime
docker run --read-only my-app
```

### Drop Capabilities

```bash
# At runtime
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE my-app
```

---

## Reproducibility

### Pin Versions Everywhere

```dockerfile
FROM node:18.17.1-alpine3.18

RUN apk add --no-cache curl=8.2.1-r0

COPY package-lock.json ./
RUN npm ci  # Uses exact versions from lock file
```

### Use COPY Instead of ADD

```dockerfile
# ADD has extra features that may surprise you
ADD app.tar.gz /app/    # Extracts automatically
ADD https://... /app/   # Downloads URL

# COPY is explicit and predictable
COPY app.tar.gz /app/   # Just copies
```

### Set Explicit Working Directory

```dockerfile
# Bad - relies on image default
COPY . .

# Good - explicit path
WORKDIR /app
COPY . .
```

---

## Maintainability

### Use ARG for Versions

```dockerfile
ARG NODE_VERSION=18
ARG ALPINE_VERSION=3.18

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION}
```

### Add Labels

```dockerfile
LABEL org.opencontainers.image.source="https://github.com/user/repo"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.description="My application"
LABEL org.opencontainers.image.licenses="MIT"
```

### Document Ports

```dockerfile
# Document which ports are used
EXPOSE 3000/tcp
EXPOSE 8080/tcp
```

### Add Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

---

## Language-Specific Tips

### Node.js

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Use ci for reproducible installs
RUN npm ci --only=production

# Copy application
COPY . .

# Don't run as root
USER node

EXPOSE 3000
CMD ["node", "server.js"]
```

### Python

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing pyc files
ENV PYTHONDONTWRITEBYTECODE=1
# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m appuser
USER appuser

CMD ["python", "app.py"]
```

### Go

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Download dependencies first
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main .

# Minimal runtime
FROM scratch

COPY --from=builder /app/main /main
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ENTRYPOINT ["/main"]
```

---

## Anti-Patterns to Avoid

### Don't Use Latest Tag

```dockerfile
# Bad
FROM ubuntu:latest

# Good
FROM ubuntu:22.04
```

### Don't Install Unnecessary Packages

```dockerfile
# Bad
RUN apt-get install -y vim nano curl wget git

# Good - only what's needed
RUN apt-get install -y --no-install-recommends curl
```

### Don't Store Data in Containers

```dockerfile
# Bad - data lost when container removed
RUN mkdir /data

# Good - use volumes
VOLUME /data
```

### Don't Use sudo

```dockerfile
# Bad
RUN sudo apt-get update

# Good - already root during build
RUN apt-get update
```

### Don't Hardcode Secrets

```dockerfile
# Bad
ENV DATABASE_PASSWORD=secret123

# Good - pass at runtime
# docker run -e DATABASE_PASSWORD=secret my-app
```

---

## Checklist

Before pushing your Dockerfile:

- [ ] Using specific base image tag
- [ ] Multi-stage build if applicable
- [ ] .dockerignore is configured
- [ ] Running as non-root user
- [ ] No secrets in image
- [ ] Dependencies installed first (cache optimization)
- [ ] Cleanup in same RUN layer
- [ ] Health check defined
- [ ] Labels added
- [ ] Image scanned for vulnerabilities

---

## Next Steps

- [Docker Compose](../docker-compose/introduction.md) - Multi-container apps
- [General Best Practices](../best-practices.md) - Production tips
