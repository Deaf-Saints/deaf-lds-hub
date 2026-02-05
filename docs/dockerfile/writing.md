# Writing Dockerfiles

A Dockerfile is a text file containing instructions for building a Docker image.

## Dockerfile Basics

### Simple Example

```dockerfile
# Use an official base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Define startup command
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

---

## Dockerfile Instructions

### FROM

Specifies the base image:

```dockerfile
# Official image
FROM ubuntu:22.04

# Specific version
FROM node:18.17-alpine

# From scratch (empty image)
FROM scratch
```

### WORKDIR

Sets the working directory:

```dockerfile
WORKDIR /app

# Creates directory if it doesn't exist
# All subsequent commands run from this directory
```

### COPY and ADD

Copy files into the image:

```dockerfile
# Copy single file
COPY package.json .

# Copy multiple files
COPY package.json package-lock.json ./

# Copy directory
COPY src/ ./src/

# Copy with different name
COPY config.json ./app-config.json

# ADD can extract archives and fetch URLs (prefer COPY)
ADD archive.tar.gz /app/
```

### RUN

Execute commands during build:

```dockerfile
# Shell form
RUN apt-get update && apt-get install -y curl

# Exec form
RUN ["apt-get", "install", "-y", "curl"]

# Multi-line for readability
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*
```

### CMD and ENTRYPOINT

Define the container's startup command:

```dockerfile
# CMD - can be overridden at runtime
CMD ["npm", "start"]
CMD npm start  # Shell form

# ENTRYPOINT - always runs
ENTRYPOINT ["python", "app.py"]

# Combined (ENTRYPOINT + CMD as default args)
ENTRYPOINT ["python"]
CMD ["app.py"]  # docker run image other.py overrides this
```

### ENV

Set environment variables:

```dockerfile
# Single variable
ENV NODE_ENV=production

# Multiple variables
ENV NODE_ENV=production \
    PORT=3000 \
    DEBUG=false
```

### ARG

Build-time variables:

```dockerfile
# Define argument with default
ARG NODE_VERSION=18

# Use in FROM
FROM node:${NODE_VERSION}-alpine

# Use elsewhere
ARG BUILD_DATE
LABEL build-date=${BUILD_DATE}
```

Build with arguments:
```bash
docker build --build-arg NODE_VERSION=20 --build-arg BUILD_DATE=$(date -I) .
```

### EXPOSE

Document which ports the container listens on:

```dockerfile
EXPOSE 3000
EXPOSE 80 443
EXPOSE 8080/tcp 8080/udp
```

!!! note
    EXPOSE doesn't publish the port. Use `-p` at runtime.

### VOLUME

Create mount points:

```dockerfile
VOLUME /data
VOLUME ["/data", "/logs"]
```

### USER

Set the user for subsequent commands:

```dockerfile
# Create user and switch to it
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Or use numeric UID
USER 1000:1000
```

### LABEL

Add metadata:

```dockerfile
LABEL maintainer="you@example.com"
LABEL version="1.0"
LABEL description="My awesome app"

# Multiple labels
LABEL maintainer="you@example.com" \
      version="1.0" \
      description="My awesome app"
```

### HEALTHCHECK

Define health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Disable health check
HEALTHCHECK NONE
```

---

## Common Patterns

### Node.js Application

```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
```

### Python Application

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m appuser
USER appuser

EXPOSE 8000
CMD ["python", "app.py"]
```

### Go Application

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Runtime stage
FROM alpine:3.18

RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]
```

### Java Application

```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Multi-Stage Builds

Use multiple FROM statements to create smaller final images:

```dockerfile
# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Named Stages

```dockerfile
FROM node:18 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS builder
COPY . .
RUN npm run build

FROM deps AS dev
COPY . .
CMD ["npm", "run", "dev"]

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
```

Build specific stage:
```bash
docker build --target dev -t my-app:dev .
docker build --target production -t my-app:prod .
```

---

## .dockerignore

Create a `.dockerignore` file to exclude files from the build context:

```
# Dependencies
node_modules
vendor

# Build output
dist
build
*.egg-info

# Development
.git
.gitignore
.env
.env.local
*.md
Dockerfile*
docker-compose*

# IDE
.idea
.vscode
*.swp

# OS
.DS_Store
Thumbs.db

# Tests
__tests__
*.test.js
coverage

# Logs
*.log
logs
```

---

## Build Context

The build context is the directory sent to the Docker daemon:

```bash
# Current directory as context
docker build .

# Different context
docker build /path/to/context

# Context from URL
docker build https://github.com/user/repo.git

# Context from stdin
docker build - < Dockerfile
```

---

## BuildKit Features

Enable BuildKit for advanced features:

```bash
export DOCKER_BUILDKIT=1
```

### Cache Mounts

```dockerfile
# Cache apt packages
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y curl

# Cache npm packages
RUN --mount=type=cache,target=/root/.npm \
    npm install
```

### Secret Mounts

```dockerfile
# Mount secret during build (not stored in image)
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install
```

Build with secret:
```bash
docker build --secret id=npmrc,src=.npmrc .
```

### SSH Mounts

```dockerfile
# Use SSH for private repos
RUN --mount=type=ssh \
    git clone git@github.com:private/repo.git
```

Build with SSH:
```bash
docker build --ssh default .
```

---

## Commands Summary

| Instruction | Purpose |
|-------------|---------|
| `FROM` | Base image |
| `WORKDIR` | Working directory |
| `COPY` | Copy files |
| `ADD` | Copy files (with extras) |
| `RUN` | Execute command |
| `CMD` | Default command |
| `ENTRYPOINT` | Main executable |
| `ENV` | Environment variable |
| `ARG` | Build argument |
| `EXPOSE` | Document port |
| `VOLUME` | Create mount point |
| `USER` | Set user |
| `LABEL` | Add metadata |
| `HEALTHCHECK` | Define health check |

---

## Next Steps

- [Dockerfile Best Practices](best-practices.md) - Optimize your Dockerfiles
- [Docker Compose](../docker-compose/introduction.md) - Multi-container apps
