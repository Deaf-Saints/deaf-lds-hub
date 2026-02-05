# Docker Compose Introduction

Docker Compose is a tool for defining and running multi-container Docker applications.

## What is Docker Compose?

Instead of running multiple `docker run` commands, you define your entire application stack in a YAML file and manage it with simple commands.

### Before Docker Compose

```bash
# Create network
docker network create myapp

# Start database
docker run -d \
  --name db \
  --network myapp \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15

# Start Redis
docker run -d \
  --name redis \
  --network myapp \
  redis:7

# Start application
docker run -d \
  --name app \
  --network myapp \
  -p 3000:3000 \
  -e DATABASE_URL=postgres://postgres:secret@db:5432/postgres \
  -e REDIS_URL=redis://redis:6379 \
  my-app
```

### With Docker Compose

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7

  app:
    image: my-app
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/postgres
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

volumes:
  pgdata:
```

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down
```

---

## Installation

Docker Compose V2 comes bundled with Docker Desktop and Docker Engine.

```bash
# Check version
docker compose version

# For older systems, install compose plugin
sudo apt-get install docker-compose-plugin
```

!!! note "V1 vs V2"
    V2 uses `docker compose` (space), V1 used `docker-compose` (hyphen).

---

## Basic Commands

```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# View running services
docker compose ps

# View logs
docker compose logs

# Follow logs
docker compose logs -f

# Follow specific service
docker compose logs -f app

# Rebuild and start
docker compose up --build

# Scale a service
docker compose up -d --scale web=3
```

---

## Compose File Structure

```yaml
# Compose file version (optional in recent versions)
version: '3.8'

# Define services (containers)
services:
  service_name:
    image: image:tag
    # ... service configuration

# Define named volumes
volumes:
  volume_name:

# Define networks
networks:
  network_name:

# Define secrets
secrets:
  secret_name:

# Define configs
configs:
  config_name:
```

---

## Service Configuration

### Basic Options

```yaml
services:
  web:
    # Use an image
    image: nginx:alpine

    # Or build from Dockerfile
    build: ./app

    # Or build with options
    build:
      context: ./app
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production

    # Container name (optional)
    container_name: my-web

    # Restart policy
    restart: unless-stopped

    # Port mapping
    ports:
      - "8080:80"
      - "443:443"

    # Environment variables
    environment:
      - NODE_ENV=production
      - API_KEY=secret

    # Or use env file
    env_file:
      - .env

    # Volumes
    volumes:
      - ./data:/app/data
      - cache:/app/cache

    # Dependencies
    depends_on:
      - db
      - redis
```

### Advanced Options

```yaml
services:
  app:
    image: my-app

    # Command override
    command: npm run dev

    # Entrypoint override
    entrypoint: /custom-entrypoint.sh

    # Working directory
    working_dir: /app

    # User
    user: "1000:1000"

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

    # Networks
    networks:
      - frontend
      - backend

    # Labels
    labels:
      - "traefik.enable=true"
      - "app.version=1.0"
```

---

## Volumes

```yaml
services:
  db:
    image: postgres:15
    volumes:
      # Named volume
      - pgdata:/var/lib/postgresql/data
      # Bind mount
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
      # Anonymous volume
      - /var/log

volumes:
  pgdata:
    # Use default driver

  external-volume:
    # Reference existing volume
    external: true

  nfs-volume:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.1,rw
      device: ":/path/to/dir"
```

---

## Networks

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
    # Uses default bridge driver

  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16

  existing:
    external: true
    name: my-existing-network
```

---

## Environment Variables

### In Compose File

```yaml
services:
  app:
    environment:
      # Direct value
      - NODE_ENV=production
      # From host environment
      - API_KEY
      # With default
      - DEBUG=${DEBUG:-false}
```

### From File

```yaml
services:
  app:
    env_file:
      - .env
      - .env.local
```

`.env` file:
```
NODE_ENV=production
API_KEY=secret123
DEBUG=false
```

### Variable Substitution

```yaml
services:
  app:
    image: my-app:${TAG:-latest}
    ports:
      - "${PORT:-3000}:3000"
```

---

## Dependencies

### Basic Dependency

```yaml
services:
  app:
    depends_on:
      - db
      - redis
```

### Conditional Dependency

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 5s
      timeout: 5s
      retries: 5
```

---

## Profiles

Run subsets of services:

```yaml
services:
  web:
    image: nginx
    # Always runs

  db:
    image: postgres:15
    # Always runs

  debug:
    image: nicolaka/netshoot
    profiles:
      - debug

  test:
    image: my-app
    command: npm test
    profiles:
      - test
```

```bash
# Run without profile services
docker compose up -d

# Run with debug profile
docker compose --profile debug up -d

# Run multiple profiles
docker compose --profile debug --profile test up -d
```

---

## Multiple Compose Files

### Override Files

```bash
# Base file
docker-compose.yml

# Override for development
docker-compose.override.yml  # Auto-loaded

# Override for production
docker-compose.prod.yml
```

```bash
# Development (auto-loads override)
docker compose up -d

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Example Override

`docker-compose.yml`:
```yaml
services:
  app:
    image: my-app
    ports:
      - "3000:3000"
```

`docker-compose.override.yml`:
```yaml
services:
  app:
    build: .
    volumes:
      - ./src:/app/src
    environment:
      - DEBUG=true
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `docker compose up` | Create and start containers |
| `docker compose up -d` | Start in detached mode |
| `docker compose down` | Stop and remove containers |
| `docker compose down -v` | Also remove volumes |
| `docker compose ps` | List containers |
| `docker compose logs` | View output |
| `docker compose logs -f` | Follow output |
| `docker compose build` | Build images |
| `docker compose pull` | Pull images |
| `docker compose exec app bash` | Execute command |
| `docker compose run app npm test` | Run one-off command |
| `docker compose restart` | Restart services |
| `docker compose stop` | Stop services |
| `docker compose start` | Start services |
| `docker compose config` | Validate and view config |

---

## Next Steps

- [Docker Compose Examples](examples.md) - Real-world examples
- [Writing Dockerfiles](../dockerfile/writing.md) - Build custom images
