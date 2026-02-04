# Basic Docker Commands

A comprehensive reference for essential Docker commands you'll use daily.

## Getting Help

```bash
# General help
docker --help

# Command-specific help
docker run --help
docker build --help

# Version information
docker --version
docker version  # More detailed
```

---

## Image Commands

### Pulling Images

```bash
# Pull latest version
docker pull nginx

# Pull specific tag
docker pull nginx:1.24-alpine

# Pull from different registry
docker pull gcr.io/project/image:tag
```

### Listing Images

```bash
# List all images
docker images

# List with size
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# List only image IDs
docker images -q

# List dangling images (untagged)
docker images -f dangling=true
```

### Removing Images

```bash
# Remove specific image
docker rmi nginx

# Remove by ID
docker rmi abc123def

# Force remove
docker rmi -f nginx

# Remove dangling images
docker image prune

# Remove all unused images
docker image prune -a
```

### Building Images

```bash
# Build from Dockerfile in current directory
docker build -t my-app .

# Build with specific Dockerfile
docker build -f Dockerfile.prod -t my-app:prod .

# Build with build arguments
docker build --build-arg VERSION=1.0 -t my-app .

# Build without cache
docker build --no-cache -t my-app .
```

---

## Container Commands

### Running Containers

```bash
# Basic run
docker run nginx

# Run in background (detached)
docker run -d nginx

# Run with name
docker run -d --name webserver nginx

# Run interactively
docker run -it ubuntu bash

# Run and remove after exit
docker run --rm alpine echo "hello"

# Run with port mapping
docker run -d -p 8080:80 nginx

# Run with environment variables
docker run -d -e KEY=value nginx

# Run with volume
docker run -d -v mydata:/data nginx

# Run with resource limits
docker run -d --memory=512m --cpus=1 nginx
```

### Listing Containers

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# List only IDs
docker ps -q

# List with custom format
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# List last N containers
docker ps -n 5
```

### Managing Container Lifecycle

```bash
# Stop a container
docker stop container_name

# Stop with timeout
docker stop -t 30 container_name

# Start a stopped container
docker start container_name

# Restart a container
docker restart container_name

# Pause/unpause
docker pause container_name
docker unpause container_name

# Kill a container (force stop)
docker kill container_name
```

### Removing Containers

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
# Run command in container
docker exec container_name ls -la

# Interactive shell
docker exec -it container_name bash
docker exec -it container_name sh  # For Alpine

# Run as root
docker exec -u root container_name whoami

# Run with environment variable
docker exec -e DEBUG=true container_name printenv
```

### View Logs

```bash
# View all logs
docker logs container_name

# Follow logs (real-time)
docker logs -f container_name

# Show timestamps
docker logs -t container_name

# Show last N lines
docker logs --tail 100 container_name

# Show logs since time
docker logs --since 10m container_name
docker logs --since 2023-01-01T00:00:00 container_name
```

### Copy Files

```bash
# Copy to container
docker cp ./file.txt container_name:/path/

# Copy from container
docker cp container_name:/path/file.txt ./

# Copy directory
docker cp ./mydir container_name:/path/
```

### Inspect Containers

```bash
# Full inspection
docker inspect container_name

# Get IP address
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' container_name

# Get environment variables
docker inspect -f '{{json .Config.Env}}' container_name

# Resource usage statistics
docker stats container_name

# Running processes
docker top container_name
```

---

## Volume Commands

```bash
# Create volume
docker volume create myvolume

# List volumes
docker volume ls

# Inspect volume
docker volume inspect myvolume

# Remove volume
docker volume rm myvolume

# Remove unused volumes
docker volume prune
```

---

## Network Commands

```bash
# Create network
docker network create mynetwork

# List networks
docker network ls

# Inspect network
docker network inspect mynetwork

# Connect container to network
docker network connect mynetwork container_name

# Disconnect container from network
docker network disconnect mynetwork container_name

# Remove network
docker network rm mynetwork

# Remove unused networks
docker network prune
```

---

## System Commands

### System Information

```bash
# Docker system info
docker info

# Disk usage
docker system df

# Detailed disk usage
docker system df -v
```

### Cleanup

```bash
# Remove all unused data
docker system prune

# Remove all unused data including volumes
docker system prune --volumes

# Remove all unused data (aggressive)
docker system prune -a --volumes

# Remove specific resource types
docker container prune  # Stopped containers
docker image prune      # Dangling images
docker volume prune     # Unused volumes
docker network prune    # Unused networks
```

---

## Quick Reference Table

| Task | Command |
|------|---------|
| Pull image | `docker pull image:tag` |
| List images | `docker images` |
| Remove image | `docker rmi image` |
| Build image | `docker build -t name .` |
| Run container | `docker run -d image` |
| List containers | `docker ps -a` |
| Stop container | `docker stop name` |
| Remove container | `docker rm name` |
| View logs | `docker logs name` |
| Execute command | `docker exec -it name bash` |
| Copy files | `docker cp src name:dest` |
| Create volume | `docker volume create name` |
| Create network | `docker network create name` |
| System cleanup | `docker system prune` |

---

## Common Command Patterns

### Development Workflow

```bash
# Build and run
docker build -t my-app . && docker run -d -p 3000:3000 my-app

# Rebuild and restart
docker stop my-app && docker rm my-app
docker build -t my-app . && docker run -d --name my-app -p 3000:3000 my-app

# Quick test
docker run --rm -it my-app npm test
```

### Debugging

```bash
# Check why container exited
docker logs container_name
docker inspect container_name | grep -A 5 State

# Get a shell in running container
docker exec -it container_name bash

# Override entrypoint for debugging
docker run -it --entrypoint bash my-app
```

### Cleanup

```bash
# Stop and remove all containers
docker stop $(docker ps -q) && docker rm $(docker ps -aq)

# Remove all images
docker rmi $(docker images -q)

# Nuclear option - remove everything
docker system prune -a --volumes
```

---

## Next Steps

- [Advanced Commands](advanced.md) - More complex operations
- [Docker Compose](../docker-compose/introduction.md) - Multi-container applications
