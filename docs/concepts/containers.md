# Docker Containers

Containers are running instances of Docker images. They provide isolated environments for your applications.

## What is a Container?

A container is a lightweight, standalone, executable package that includes:

- Application code
- Runtime environment
- System tools and libraries
- Configuration settings

### Containers vs Virtual Machines

```
┌─────────────────────────────────────────────────────────────┐
│                     Containers                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  App A  │  │  App B  │  │  App C  │                     │
│  ├─────────┤  ├─────────┤  ├─────────┤                     │
│  │  Bins/  │  │  Bins/  │  │  Bins/  │                     │
│  │  Libs   │  │  Libs   │  │  Libs   │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│  ┌─────────────────────────────────────┐                   │
│  │         Docker Engine               │                   │
│  ├─────────────────────────────────────┤                   │
│  │         Host OS Kernel              │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Virtual Machines                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  App A  │  │  App B  │  │  App C  │                     │
│  ├─────────┤  ├─────────┤  ├─────────┤                     │
│  │Guest OS │  │Guest OS │  │Guest OS │   ← Full OS each    │
│  └─────────┘  └─────────┘  └─────────┘                     │
│  ┌─────────────────────────────────────┐                   │
│  │           Hypervisor                │                   │
│  ├─────────────────────────────────────┤                   │
│  │         Host OS                      │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

| Feature | Containers | VMs |
|---------|------------|-----|
| Startup | Seconds | Minutes |
| Size | Megabytes | Gigabytes |
| Isolation | Process-level | Full OS |
| Performance | Near-native | Overhead |

---

## Running Containers

### Basic Run Command

```bash
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
```

### Common Options

| Option | Description | Example |
|--------|-------------|---------|
| `-d` | Detached mode (background) | `docker run -d nginx` |
| `-it` | Interactive with TTY | `docker run -it ubuntu bash` |
| `-p` | Port mapping | `docker run -p 8080:80 nginx` |
| `-v` | Volume mount | `docker run -v /host:/container nginx` |
| `-e` | Environment variable | `docker run -e KEY=value nginx` |
| `--name` | Container name | `docker run --name web nginx` |
| `--rm` | Remove after exit | `docker run --rm nginx` |
| `--network` | Network to connect | `docker run --network mynet nginx` |

### Examples

```bash
# Run in background with port mapping
docker run -d -p 8080:80 --name webserver nginx

# Run interactively and remove on exit
docker run -it --rm ubuntu bash

# Run with environment variables
docker run -d \
  --name db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_USER=admin \
  postgres:15

# Run with volume and restart policy
docker run -d \
  --name app \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  my-app:latest
```

---

## Managing Containers

### List Containers

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# List with custom format
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# List only container IDs
docker ps -q
```

### Start, Stop, Restart

```bash
# Stop a running container
docker stop container_name

# Stop with timeout (default 10s)
docker stop -t 30 container_name

# Start a stopped container
docker start container_name

# Restart a container
docker restart container_name

# Pause a container (freeze processes)
docker pause container_name

# Unpause
docker unpause container_name
```

### Remove Containers

```bash
# Remove a stopped container
docker rm container_name

# Force remove (even if running)
docker rm -f container_name

# Remove all stopped containers
docker container prune

# Remove all containers
docker rm -f $(docker ps -aq)
```

---

## Interacting with Containers

### Execute Commands

```bash
# Run a command in a running container
docker exec container_name ls /app

# Interactive shell
docker exec -it container_name bash

# As a different user
docker exec -u root -it container_name bash

# With environment variable
docker exec -e MY_VAR=value container_name printenv
```

### View Logs

```bash
# View all logs
docker logs container_name

# Follow logs in real-time
docker logs -f container_name

# Show last N lines
docker logs --tail 100 container_name

# Show logs with timestamps
docker logs -t container_name

# Show logs since a time
docker logs --since 2023-01-01 container_name
docker logs --since 10m container_name
```

### Inspect Containers

```bash
# View detailed container info
docker inspect container_name

# Get specific information
docker inspect --format='{{.State.Status}}' container_name
docker inspect --format='{{.NetworkSettings.IPAddress}}' container_name
docker inspect --format='{{json .Config.Env}}' container_name

# View resource usage
docker stats container_name

# View running processes
docker top container_name
```

---

## Container Resource Limits

### Memory Limits

```bash
# Limit memory to 512MB
docker run -d --memory=512m nginx

# Memory with swap
docker run -d --memory=512m --memory-swap=1g nginx
```

### CPU Limits

```bash
# Limit to 1.5 CPUs
docker run -d --cpus=1.5 nginx

# Limit to specific CPU cores
docker run -d --cpuset-cpus="0,1" nginx

# CPU shares (relative weight)
docker run -d --cpu-shares=512 nginx
```

### Combined Example

```bash
docker run -d \
  --name limited-app \
  --memory=256m \
  --cpus=0.5 \
  --restart unless-stopped \
  my-app:latest
```

---

## Restart Policies

Control what happens when a container exits:

| Policy | Description |
|--------|-------------|
| `no` | Never restart (default) |
| `on-failure` | Restart only on non-zero exit |
| `on-failure:3` | Restart on failure, max 3 times |
| `always` | Always restart |
| `unless-stopped` | Restart unless manually stopped |

```bash
# Always restart
docker run -d --restart always nginx

# Restart on failure up to 5 times
docker run -d --restart on-failure:5 my-app

# Update restart policy of existing container
docker update --restart unless-stopped container_name
```

---

## Copying Files

```bash
# Copy from host to container
docker cp ./local-file.txt container_name:/path/in/container/

# Copy from container to host
docker cp container_name:/path/in/container/file.txt ./local-copy.txt

# Copy entire directory
docker cp ./local-dir container_name:/path/in/container/
```

---

## Container Health Checks

Define health checks to monitor container status:

```bash
# Run with health check
docker run -d \
  --name web \
  --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  nginx
```

Check health status:

```bash
docker inspect --format='{{.State.Health.Status}}' container_name
```

---

## Common Patterns

### Run a One-off Command

```bash
# Run a command and remove container
docker run --rm alpine echo "Hello World"

# Run a database migration
docker run --rm \
  --network app-network \
  -e DATABASE_URL=postgres://... \
  my-app:latest \
  npm run migrate
```

### Debug a Container

```bash
# Override entrypoint to get a shell
docker run -it --entrypoint /bin/sh my-app:latest

# Run alongside existing container
docker run -it --rm \
  --network container:my-app \
  --pid container:my-app \
  alpine sh
```

### Wait for Container to Start

```bash
# Wait for container to be healthy
until [ "$(docker inspect --format='{{.State.Health.Status}}' container_name)" == "healthy" ]; do
  sleep 1
done
```

---

## Commands Summary

```bash
# Run a container
docker run -d --name my-container image:tag

# List containers
docker ps -a

# Stop/Start/Restart
docker stop container_name
docker start container_name
docker restart container_name

# Execute command
docker exec -it container_name bash

# View logs
docker logs -f container_name

# Inspect
docker inspect container_name

# Remove
docker rm container_name

# Resource stats
docker stats

# Copy files
docker cp source container:dest
```

---

## Next Steps

- [Volumes](volumes.md) - Persisting container data
- [Networks](networks.md) - Container networking
