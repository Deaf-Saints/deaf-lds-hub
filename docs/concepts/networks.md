# Docker Networks

Docker networks enable containers to communicate with each other and the outside world.

## Network Types

Docker provides several network drivers:

| Driver | Description | Use Case |
|--------|-------------|----------|
| `bridge` | Default network for containers | Single-host container communication |
| `host` | Container uses host's network | Maximum network performance |
| `none` | No network access | Isolated containers |
| `overlay` | Multi-host networking | Docker Swarm clusters |
| `macvlan` | Assigns MAC address | Legacy applications |

---

## Bridge Networks

The default and most common network type.

### Default Bridge Network

```bash
# Containers on default bridge communicate by IP only
docker run -d --name web nginx
docker run -d --name api my-api

# Get container IP
docker inspect web --format '{{.NetworkSettings.IPAddress}}'
```

!!! warning "Default Bridge Limitations"
    Containers on the default bridge network can only communicate by IP address, not by container name.

### User-Defined Bridge Networks

User-defined bridges provide automatic DNS resolution between containers.

```bash
# Create a network
docker network create my-network

# Run containers on the network
docker run -d --name web --network my-network nginx
docker run -d --name api --network my-network my-api

# Containers can now communicate by name
docker exec api ping web  # Works!
```

### Benefits of User-Defined Networks

| Feature | Default Bridge | User-Defined Bridge |
|---------|---------------|---------------------|
| DNS resolution | No | Yes |
| Isolation | Shared with all | Only connected containers |
| Connect/disconnect | Restart required | Live connect/disconnect |
| Environment variables | Shared | Isolated |

---

## Network Commands

### Create Networks

```bash
# Create a bridge network
docker network create my-network

# Create with specific subnet
docker network create \
  --driver bridge \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1 \
  my-network

# Create with options
docker network create \
  --driver bridge \
  --opt com.docker.network.bridge.name=my-bridge \
  my-network
```

### List Networks

```bash
# List all networks
docker network ls

# Filter networks
docker network ls --filter driver=bridge
```

### Inspect Networks

```bash
# View network details
docker network inspect my-network

# See connected containers
docker network inspect my-network --format '{{json .Containers}}'
```

### Remove Networks

```bash
# Remove a specific network
docker network rm my-network

# Remove all unused networks
docker network prune
```

---

## Connecting Containers to Networks

### At Run Time

```bash
# Connect when starting
docker run -d --name web --network my-network nginx
```

### Connect Running Container

```bash
# Connect to additional network
docker network connect my-network container_name

# Connect with alias
docker network connect --alias db my-network container_name

# Disconnect from network
docker network disconnect my-network container_name
```

### Multiple Networks

```bash
# Container on multiple networks
docker run -d --name app --network frontend nginx
docker network connect backend app

# Now 'app' can talk to both frontend and backend networks
```

---

## Port Mapping

Expose container ports to the host.

### Basic Port Mapping

```bash
# Map host port 8080 to container port 80
docker run -d -p 8080:80 nginx

# Map to specific interface
docker run -d -p 127.0.0.1:8080:80 nginx

# Map random host port
docker run -d -p 80 nginx

# Map UDP port
docker run -d -p 53:53/udp dns-server

# Map multiple ports
docker run -d -p 80:80 -p 443:443 nginx
```

### View Port Mappings

```bash
# See mapped ports
docker port container_name

# Output:
# 80/tcp -> 0.0.0.0:8080
```

---

## Host Network

Container shares the host's network namespace.

```bash
docker run -d --network host nginx
```

- No port mapping needed (container uses host ports directly)
- Best network performance
- Less isolation
- Only works on Linux

---

## Network Isolation Example

Create isolated environments for different applications:

```bash
# Create networks
docker network create frontend
docker network create backend

# Database (only on backend)
docker run -d \
  --name db \
  --network backend \
  postgres:15

# API (connected to both)
docker run -d \
  --name api \
  --network backend \
  my-api
docker network connect frontend api

# Web (only on frontend)
docker run -d \
  --name web \
  --network frontend \
  -p 80:80 \
  nginx
```

Network diagram:
```
┌─────────────────────────────────────────────────┐
│                                                  │
│  Frontend Network                               │
│  ┌─────────┐        ┌─────────┐                │
│  │   web   │◄──────►│   api   │                │
│  └─────────┘        └────┬────┘                │
│       ▲                  │                      │
│       │ Port 80          │                      │
├───────┼──────────────────┼──────────────────────┤
│  Host │                  │                      │
├───────┼──────────────────┼──────────────────────┤
│       │                  │                      │
│  Backend Network         │                      │
│                     ┌────┴────┐                │
│                     │   api   │                │
│                     └────┬────┘                │
│                          │                      │
│                     ┌────▼────┐                │
│                     │   db    │                │
│                     └─────────┘                │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## DNS and Service Discovery

### Automatic DNS

On user-defined networks, Docker provides automatic DNS:

```bash
# Create network and containers
docker network create app-net
docker run -d --name db --network app-net postgres:15
docker run -d --name api --network app-net my-api

# API can connect to db using hostname "db"
# Environment: DATABASE_HOST=db
```

### Network Aliases

```bash
# Add alias for container
docker run -d \
  --name postgres-main \
  --network app-net \
  --network-alias db \
  --network-alias database \
  postgres:15

# Container is reachable as:
# - postgres-main
# - db
# - database
```

### Multiple Containers, Same Alias

```bash
# Load balancing with aliases
docker run -d --name web1 --network app-net --network-alias web nginx
docker run -d --name web2 --network app-net --network-alias web nginx
docker run -d --name web3 --network app-net --network-alias web nginx

# DNS round-robin: 'web' resolves to different IPs
```

---

## Docker Compose Networking

```yaml
version: '3.8'

services:
  web:
    image: nginx
    ports:
      - "80:80"
    networks:
      - frontend

  api:
    image: my-api
    networks:
      - frontend
      - backend

  db:
    image: postgres:15
    networks:
      - backend

networks:
  frontend:
  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

!!! note "Automatic Network"
    Docker Compose creates a default network for each project automatically.

---

## Troubleshooting

### Check Connectivity

```bash
# Ping another container
docker exec container1 ping container2

# Check DNS resolution
docker exec container1 nslookup container2

# Check network connectivity
docker exec container1 nc -zv container2 80
```

### Debug Network Issues

```bash
# Inspect container's network settings
docker inspect container_name --format '{{json .NetworkSettings.Networks}}'

# List containers on a network
docker network inspect my-network

# Check published ports
docker port container_name
```

### Common Issues

**Container can't reach another container:**
```bash
# Check they're on the same network
docker inspect container1 --format '{{json .NetworkSettings.Networks}}'
docker inspect container2 --format '{{json .NetworkSettings.Networks}}'
```

**Port already in use:**
```bash
# Find what's using the port
sudo lsof -i :8080

# Use a different port
docker run -p 8081:80 nginx
```

---

## Commands Summary

```bash
# Create network
docker network create my-network

# List networks
docker network ls

# Inspect network
docker network inspect my-network

# Connect container
docker network connect my-network container

# Disconnect container
docker network disconnect my-network container

# Remove network
docker network rm my-network

# Remove unused networks
docker network prune

# Run with network
docker run --network my-network image

# Run with port mapping
docker run -p 8080:80 image
```

---

## Next Steps

- [Basic Commands](../commands/basic.md) - Essential Docker commands
- [Docker Compose](../docker-compose/introduction.md) - Multi-container applications
