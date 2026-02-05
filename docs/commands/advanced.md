# Advanced Docker Commands

Advanced commands and techniques for power users.

## Advanced Run Options

### Resource Constraints

```bash
# Memory limits
docker run -d \
  --memory=512m \
  --memory-swap=1g \
  --memory-reservation=256m \
  nginx

# CPU limits
docker run -d \
  --cpus=1.5 \
  --cpu-shares=512 \
  --cpuset-cpus="0,1" \
  nginx

# Combined limits
docker run -d \
  --memory=1g \
  --cpus=2 \
  --pids-limit=100 \
  nginx
```

### Security Options

```bash
# Run as non-root user
docker run -d --user 1000:1000 nginx

# Drop capabilities
docker run -d --cap-drop ALL --cap-add NET_BIND_SERVICE nginx

# Read-only filesystem
docker run -d --read-only nginx

# No new privileges
docker run -d --security-opt no-new-privileges nginx

# Custom seccomp profile
docker run -d --security-opt seccomp=profile.json nginx
```

### Process Namespace

```bash
# Share PID namespace with another container
docker run -d --pid=container:other_container nginx

# Share PID namespace with host
docker run -d --pid=host nginx

# Share network namespace
docker run -d --network=container:other_container nginx
```

---

## Image Management

### Tagging and Pushing

```bash
# Tag an image
docker tag source:tag target:tag
docker tag my-app:latest myregistry.com/my-app:v1.0

# Push to registry
docker push myregistry.com/my-app:v1.0

# Login to registry
docker login myregistry.com
docker login -u username -p password myregistry.com
```

### Image History and Layers

```bash
# View image layers
docker history nginx

# Detailed history
docker history --no-trunc nginx

# View layer sizes
docker history --format "{{.CreatedBy}}: {{.Size}}" nginx
```

### Saving and Loading

```bash
# Save image to tar
docker save -o image.tar my-app:latest

# Save multiple images
docker save -o images.tar nginx:latest postgres:15

# Load image from tar
docker load -i image.tar

# Export container filesystem
docker export container_name > container.tar

# Import as image
docker import container.tar my-new-image:latest
```

---

## Advanced Networking

### Custom Bridge Networks

```bash
# Create with specific subnet
docker network create \
  --driver bridge \
  --subnet 172.25.0.0/16 \
  --ip-range 172.25.5.0/24 \
  --gateway 172.25.0.1 \
  --aux-address "my-router=172.25.5.99" \
  my-network

# Assign static IP to container
docker run -d \
  --network my-network \
  --ip 172.25.5.10 \
  nginx
```

### macvlan Network

```bash
# Create macvlan network
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 \
  macvlan-net

# Run container with real IP
docker run -d \
  --network macvlan-net \
  --ip=192.168.1.100 \
  nginx
```

---

## Container Inspection

### Format Output

```bash
# JSON output
docker inspect container_name

# Specific fields
docker inspect -f '{{.State.Status}}' container_name
docker inspect -f '{{.Config.Image}}' container_name
docker inspect -f '{{.NetworkSettings.IPAddress}}' container_name

# Multiple fields
docker inspect -f 'Name: {{.Name}}, Status: {{.State.Status}}' container_name

# Iterate over arrays
docker inspect -f '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' container_name

# JSON formatting
docker inspect -f '{{json .Config.Env}}' container_name | jq
```

### Events and Monitoring

```bash
# Watch Docker events
docker events

# Filter events
docker events --filter type=container
docker events --filter event=start
docker events --filter container=my-container

# Events since/until
docker events --since '2023-01-01' --until '2023-01-02'

# Format events
docker events --format '{{.Time}} {{.Type}} {{.Action}}'
```

### Stats and Resource Usage

```bash
# Live stats for all containers
docker stats

# Stats for specific containers
docker stats container1 container2

# No stream (single snapshot)
docker stats --no-stream

# Custom format
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## Build Techniques

### Multi-stage Builds

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
CMD ["node", "dist/main.js"]
```

### BuildKit Features

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with BuildKit
docker build -t my-app .

# Build with cache from registry
docker build \
  --cache-from myregistry.com/my-app:latest \
  -t my-app .

# Build with secrets
docker build \
  --secret id=mysecret,src=./secret.txt \
  -t my-app .

# Build with SSH
docker build --ssh default -t my-app .
```

### Build Arguments

```bash
# Pass build arguments
docker build \
  --build-arg NODE_ENV=production \
  --build-arg VERSION=$(git rev-parse --short HEAD) \
  -t my-app .

# Dockerfile usage
ARG NODE_ENV=development
ARG VERSION
ENV NODE_ENV=${NODE_ENV}
LABEL version=${VERSION}
```

---

## Debugging Containers

### Enter Failed Container

```bash
# Commit failed container to image
docker commit failed_container debug-image

# Run with shell override
docker run -it --entrypoint sh debug-image
```

### Debug with Sidecar

```bash
# Run debug container in same namespace
docker run -it --rm \
  --pid=container:target_container \
  --network=container:target_container \
  nicolaka/netshoot
```

### Attach to Container

```bash
# Attach to running container (STDIN/STDOUT)
docker attach container_name

# Detach without stopping: Ctrl+P, Ctrl+Q
```

### Container Diff

```bash
# See filesystem changes
docker diff container_name

# Output:
# A /new-file.txt      (Added)
# C /modified-file.txt (Changed)
# D /deleted-file.txt  (Deleted)
```

---

## Health Checks

### In Run Command

```bash
docker run -d \
  --health-cmd="curl -f http://localhost/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=60s \
  my-app
```

### Check Health Status

```bash
# View health status
docker inspect --format='{{.State.Health.Status}}' container_name

# View health log
docker inspect --format='{{json .State.Health}}' container_name | jq
```

---

## Log Management

### Log Drivers

```bash
# Use different log driver
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  nginx

# Syslog driver
docker run -d \
  --log-driver syslog \
  --log-opt syslog-address=udp://localhost:514 \
  nginx

# Disable logging
docker run -d --log-driver none nginx
```

### Configure Default Log Driver

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

## Registry Operations

### Working with Registries

```bash
# Login
docker login registry.example.com

# Pull from private registry
docker pull registry.example.com/my-app:v1

# Push to private registry
docker tag my-app registry.example.com/my-app:v1
docker push registry.example.com/my-app:v1

# Logout
docker logout registry.example.com
```

### Registry API

```bash
# List repositories
curl https://registry.example.com/v2/_catalog

# List tags
curl https://registry.example.com/v2/my-app/tags/list

# Get manifest
curl https://registry.example.com/v2/my-app/manifests/v1
```

---

## Docker Context

Manage multiple Docker endpoints:

```bash
# List contexts
docker context ls

# Create context for remote Docker
docker context create remote \
  --docker "host=ssh://user@remotehost"

# Use context
docker context use remote

# Run command with specific context
docker --context remote ps
```

---

## Useful Command Combinations

```bash
# Get container IP addresses
docker ps -q | xargs -I {} docker inspect -f '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' {}

# Kill all running containers
docker kill $(docker ps -q)

# Remove all containers and images
docker rm -f $(docker ps -aq) && docker rmi -f $(docker images -q)

# Follow logs of all containers
docker ps -q | xargs -P10 -I {} docker logs -f {}

# Export all images
docker images --format '{{.Repository}}:{{.Tag}}' | xargs -I {} docker save -o {}.tar {}

# Cleanup everything
docker system prune -a --volumes -f
```

---

## Next Steps

- [Docker Compose Introduction](../docker-compose/introduction.md) - Orchestrate multiple containers
- [Writing Dockerfiles](../dockerfile/writing.md) - Build custom images
