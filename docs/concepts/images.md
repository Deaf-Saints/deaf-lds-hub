# Docker Images

Images are the blueprints for containers. They contain the application code, runtime, libraries, and dependencies.

## What is a Docker Image?

A Docker image is a read-only template used to create containers. Think of it as a snapshot of a filesystem with everything needed to run an application.

### Image Layers

Images are built in layers, where each layer represents a set of filesystem changes:

```
┌─────────────────────────────┐
│     Application Code        │  ← Your code
├─────────────────────────────┤
│     Dependencies            │  ← npm install, pip install
├─────────────────────────────┤
│     Runtime (Node, Python)  │  ← Programming language
├─────────────────────────────┤
│     Base OS (Debian, Alpine)│  ← Operating system
└─────────────────────────────┘
```

!!! tip "Layer Caching"
    Docker caches layers. If a layer hasn't changed, Docker reuses it, making builds faster.

---

## Finding Images

### Docker Hub

[Docker Hub](https://hub.docker.com) is the default registry for Docker images.

```bash
# Search for images
docker search nginx

# Search with filters
docker search --filter is-official=true nginx
```

### Official Images

Official images are curated by Docker and maintained by the software vendors:

- `nginx` - Web server
- `postgres` - PostgreSQL database
- `node` - Node.js runtime
- `python` - Python runtime
- `redis` - In-memory data store

---

## Pulling Images

```bash
# Pull the latest version
docker pull nginx

# Pull a specific version (tag)
docker pull nginx:1.24

# Pull from a different registry
docker pull gcr.io/google-containers/nginx

# Pull by digest (exact version)
docker pull nginx@sha256:abc123...
```

### Understanding Tags

Tags identify different versions of an image:

| Tag | Description |
|-----|-------------|
| `latest` | Default tag, usually the most recent stable version |
| `1.24` | Specific version |
| `1.24-alpine` | Version 1.24 based on Alpine Linux (smaller) |
| `1.24-slim` | Minimal version without extras |

!!! warning "Avoid `latest` in Production"
    The `latest` tag can change unexpectedly. Always use specific version tags in production.

---

## Managing Images

### List Images

```bash
# List all images
docker images

# List with specific format
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# List image IDs only
docker images -q
```

### Inspect Images

```bash
# View detailed image information
docker inspect nginx

# View image history (layers)
docker history nginx

# View specific information
docker inspect --format='{{.Config.Env}}' nginx
```

### Remove Images

```bash
# Remove a specific image
docker rmi nginx

# Remove by image ID
docker rmi abc123

# Force remove (even if containers exist)
docker rmi -f nginx

# Remove all unused images
docker image prune

# Remove all images
docker rmi $(docker images -q)
```

---

## Image Naming Convention

Docker images follow this naming pattern:

```
[registry/][namespace/]repository[:tag]
```

Examples:

| Full Name | Registry | Namespace | Repository | Tag |
|-----------|----------|-----------|------------|-----|
| `nginx` | Docker Hub | (official) | nginx | latest |
| `nginx:1.24` | Docker Hub | (official) | nginx | 1.24 |
| `myuser/myapp:v1` | Docker Hub | myuser | myapp | v1 |
| `gcr.io/project/app:v2` | gcr.io | project | app | v2 |

---

## Building Images

While you can pull pre-built images, you'll often need to build your own.

### Quick Build Example

Create a file named `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build the image:

```bash
docker build -t my-app:v1 .
```

| Flag | Meaning |
|------|---------|
| `-t my-app:v1` | Tag the image with name and version |
| `.` | Build context (current directory) |

!!! note "Learn More"
    See [Writing Dockerfiles](../dockerfile/writing.md) for detailed instructions.

---

## Saving and Loading Images

### Export to File

```bash
# Save image to tar file
docker save -o nginx.tar nginx:latest

# Save multiple images
docker save -o images.tar nginx:latest postgres:15
```

### Import from File

```bash
# Load image from tar file
docker load -i nginx.tar
```

### Export Container Filesystem

```bash
# Export a container's filesystem
docker export container_name > container.tar

# Import as new image
docker import container.tar my-new-image:latest
```

---

## Image Best Practices

### 1. Use Specific Tags

```bash
# Bad - unpredictable
FROM node:latest

# Good - reproducible
FROM node:18.17-alpine
```

### 2. Use Small Base Images

| Base Image | Size |
|------------|------|
| `ubuntu:22.04` | ~77 MB |
| `debian:slim` | ~52 MB |
| `alpine:3.18` | ~7 MB |

### 3. Minimize Layers

```dockerfile
# Bad - multiple layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git

# Good - single layer
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*
```

### 4. Order Instructions by Change Frequency

```dockerfile
# Rarely changes - put first
FROM node:18-alpine
WORKDIR /app

# Changes sometimes
COPY package*.json ./
RUN npm install

# Changes often - put last
COPY . .
```

---

## Common Commands Summary

```bash
# Pull an image
docker pull image:tag

# List images
docker images

# Remove an image
docker rmi image:tag

# Build an image
docker build -t name:tag .

# Tag an image
docker tag source:tag target:tag

# Push to registry
docker push image:tag

# Inspect image
docker inspect image:tag

# View image layers
docker history image:tag

# Remove unused images
docker image prune

# Remove all images
docker image prune -a
```

---

## Next Steps

- [Containers](containers.md) - Running and managing containers
- [Writing Dockerfiles](../dockerfile/writing.md) - Building custom images
