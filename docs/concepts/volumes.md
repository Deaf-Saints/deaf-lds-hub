# Docker Volumes

Volumes are the preferred mechanism for persisting data generated and used by Docker containers.

## Why Use Volumes?

By default, data inside a container is lost when the container is removed. Volumes solve this by:

- Persisting data beyond container lifecycle
- Sharing data between containers
- Backing up and migrating data easily
- Providing better performance than bind mounts

---

## Types of Storage

Docker offers three main storage options:

```
┌─────────────────────────────────────────────────────────────┐
│                    Storage Options                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Volumes           │ Managed by Docker                   │
│     /var/lib/docker/  │ Best for most use cases             │
│     volumes/          │                                      │
│                       │                                      │
│  2. Bind Mounts       │ Host filesystem path                │
│     /home/user/data   │ Good for development                │
│                       │                                      │
│  3. tmpfs Mounts      │ Stored in memory only               │
│     (memory)          │ For sensitive data                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

| Type | Location | Managed by | Persistence | Use Case |
|------|----------|------------|-------------|----------|
| Volume | Docker area | Docker | Yes | Database data, app data |
| Bind Mount | Anywhere on host | User | Yes | Development, config files |
| tmpfs | Memory | Kernel | No | Secrets, temp data |

---

## Working with Volumes

### Create a Volume

```bash
# Create a named volume
docker volume create my-volume

# Create with specific driver
docker volume create --driver local my-volume

# Create with options
docker volume create --driver local \
  --opt type=nfs \
  --opt o=addr=192.168.1.1,rw \
  --opt device=:/path/to/dir \
  nfs-volume
```

### List Volumes

```bash
# List all volumes
docker volume ls

# Filter volumes
docker volume ls --filter name=my

# List dangling volumes (unused)
docker volume ls --filter dangling=true
```

### Inspect Volumes

```bash
# View volume details
docker volume inspect my-volume
```

Output:
```json
[
    {
        "CreatedAt": "2023-01-01T00:00:00Z",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/my-volume/_data",
        "Name": "my-volume",
        "Options": {},
        "Scope": "local"
    }
]
```

### Remove Volumes

```bash
# Remove a specific volume
docker volume rm my-volume

# Remove all unused volumes
docker volume prune

# Force remove
docker volume rm -f my-volume
```

---

## Using Volumes with Containers

### Mount a Named Volume

```bash
# Using -v flag
docker run -d \
  --name db \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15

# Using --mount flag (more explicit)
docker run -d \
  --name db \
  --mount source=pgdata,target=/var/lib/postgresql/data \
  postgres:15
```

### Mount as Read-Only

```bash
# Using -v
docker run -d -v my-volume:/data:ro nginx

# Using --mount
docker run -d \
  --mount source=my-volume,target=/data,readonly \
  nginx
```

### Anonymous Volumes

```bash
# Create anonymous volume (Docker generates name)
docker run -d -v /data nginx

# Listed as random hash in docker volume ls
```

---

## Bind Mounts

Bind mounts map a host directory or file directly into the container.

### Basic Bind Mount

```bash
# Mount current directory
docker run -d \
  -v $(pwd):/app \
  node:18

# Using --mount
docker run -d \
  --mount type=bind,source=$(pwd),target=/app \
  node:18
```

### Development Example

```bash
# Hot reload with bind mount
docker run -d \
  --name dev-app \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/package.json:/app/package.json \
  -p 3000:3000 \
  node:18 \
  npm run dev
```

!!! warning "Permission Issues"
    On Linux, files created in bind mounts are owned by root by default.
    Use `--user $(id -u):$(id -g)` to run as your user.

---

## tmpfs Mounts

Store data in memory only (never written to disk).

```bash
# Using --tmpfs
docker run -d \
  --tmpfs /tmp \
  nginx

# Using --mount with options
docker run -d \
  --mount type=tmpfs,target=/tmp,tmpfs-size=100m \
  nginx
```

Use cases:
- Storing secrets that shouldn't persist
- Temporary cache files
- High-performance scratch space

---

## Volume Patterns

### Database Data Persistence

```bash
# PostgreSQL
docker run -d \
  --name postgres \
  -v postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:15

# MySQL
docker run -d \
  --name mysql \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  mysql:8

# MongoDB
docker run -d \
  --name mongo \
  -v mongo-data:/data/db \
  mongo:6
```

### Sharing Data Between Containers

```bash
# Create a shared volume
docker volume create shared-data

# Container 1: Writer
docker run -d \
  --name writer \
  -v shared-data:/data \
  alpine sh -c "while true; do date >> /data/log.txt; sleep 5; done"

# Container 2: Reader
docker run -it --rm \
  -v shared-data:/data:ro \
  alpine tail -f /data/log.txt
```

### Backup and Restore

**Backup a volume:**
```bash
# Backup to tar file
docker run --rm \
  -v pgdata:/source:ro \
  -v $(pwd):/backup \
  alpine tar cvf /backup/pgdata-backup.tar -C /source .
```

**Restore a volume:**
```bash
# Create new volume and restore
docker volume create pgdata-restored

docker run --rm \
  -v pgdata-restored:/target \
  -v $(pwd):/backup \
  alpine tar xvf /backup/pgdata-backup.tar -C /target
```

---

## Volume vs Bind Mount Comparison

| Feature | Volume | Bind Mount |
|---------|--------|------------|
| Location | Docker manages | You specify |
| CLI syntax | `-v name:/path` | `-v /host/path:/path` |
| Portability | Easy | Host-dependent |
| Performance | Best on Docker Desktop | Native |
| Backup | Docker commands | Standard file tools |
| Pre-populate | Yes, from image | No |
| Use case | Production data | Development |

---

## Docker Compose Volumes

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    volumes:
      # Named volume
      - pgdata:/var/lib/postgresql/data
      # Bind mount for init scripts
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro

  app:
    image: my-app
    volumes:
      # Bind mount for development
      - ./src:/app/src
      # Anonymous volume for node_modules
      - /app/node_modules

volumes:
  pgdata:
    # Use default driver

  external-vol:
    # Use existing volume
    external: true
```

---

## Troubleshooting

### Permission Denied

```bash
# Run as your user
docker run -u $(id -u):$(id -g) -v $(pwd):/app my-image

# Or fix ownership inside container
docker exec -u root container_name chown -R 1000:1000 /data
```

### Volume Not Updating

```bash
# Check if volume is cached (Docker Desktop)
# Add :delegated or :cached flag
docker run -v $(pwd):/app:delegated my-image
```

### Finding Volume Data

```bash
# Find volume location
docker volume inspect my-volume --format '{{.Mountpoint}}'

# Access data (Linux, requires sudo)
sudo ls /var/lib/docker/volumes/my-volume/_data
```

---

## Commands Summary

```bash
# Create volume
docker volume create my-volume

# List volumes
docker volume ls

# Inspect volume
docker volume inspect my-volume

# Remove volume
docker volume rm my-volume

# Remove unused volumes
docker volume prune

# Run with volume
docker run -v my-volume:/data image

# Run with bind mount
docker run -v $(pwd):/app image

# Run with tmpfs
docker run --tmpfs /tmp image
```

---

## Next Steps

- [Networks](networks.md) - Container networking
- [Docker Compose](../docker-compose/introduction.md) - Multi-container applications
