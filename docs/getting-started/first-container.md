# Your First Container

Let's run your first Docker container and understand what happens behind the scenes.

## Running Hello World

The simplest Docker command:

```bash
docker run hello-world
```

### What Happens?

1. Docker looks for the `hello-world` image locally
2. If not found, it downloads (pulls) from Docker Hub
3. Docker creates a container from the image
4. The container runs and prints a message
5. The container exits

---

## Running an Interactive Container

Let's run something more interactive—an Ubuntu container:

```bash
docker run -it ubuntu bash
```

Breaking down this command:

| Flag | Meaning |
|------|---------|
| `-i` | Interactive mode (keep STDIN open) |
| `-t` | Allocate a pseudo-TTY (terminal) |
| `ubuntu` | The image to use |
| `bash` | The command to run |

### Inside the Container

Once inside, you're in an isolated Ubuntu environment:

```bash
# Check the OS
cat /etc/os-release

# List files
ls /

# Install something
apt-get update && apt-get install -y curl

# Exit the container
exit
```

!!! info "Container Lifecycle"
    When you exit, the container stops. Any changes you made (like installing curl) are lost unless you commit them to a new image.

---

## Running a Web Server

Let's run a more practical example—an Nginx web server:

```bash
docker run -d -p 8080:80 --name my-nginx nginx
```

| Flag | Meaning |
|------|---------|
| `-d` | Detached mode (run in background) |
| `-p 8080:80` | Map port 8080 on host to port 80 in container |
| `--name my-nginx` | Give the container a name |
| `nginx` | The image to use |

### Access the Web Server

Open your browser and visit: `http://localhost:8080`

You should see the Nginx welcome page!

### Managing the Container

```bash
# View running containers
docker ps

# View container logs
docker logs my-nginx

# Stop the container
docker stop my-nginx

# Start it again
docker start my-nginx

# Remove the container
docker stop my-nginx
docker rm my-nginx
```

---

## Running a Database

Let's run a PostgreSQL database:

```bash
docker run -d \
  --name my-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  postgres:15
```

| Flag | Meaning |
|------|---------|
| `-e` | Set environment variables |
| `postgres:15` | Use PostgreSQL version 15 |

### Connect to the Database

```bash
# Using psql inside the container
docker exec -it my-postgres psql -U myuser -d mydb

# Run SQL commands
\l          # List databases
\dt         # List tables
\q          # Quit
```

---

## Useful Beginner Commands

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# List downloaded images
docker images

# Remove a container
docker rm container_name

# Remove an image
docker rmi image_name

# View container logs
docker logs container_name

# Follow logs in real-time
docker logs -f container_name

# Execute command in running container
docker exec -it container_name bash

# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker container prune
```

---

## Understanding Container Lifecycle

```
┌─────────────────────────────────────────────────────┐
│                  Container Lifecycle                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│   docker create ──► Created                          │
│                         │                            │
│                         ▼                            │
│   docker start ───► Running ◄─── docker restart     │
│                         │                            │
│              ┌──────────┴──────────┐                │
│              ▼                     ▼                │
│   docker pause ──► Paused    docker stop ──► Stopped│
│              │                     │                │
│              ▼                     ▼                │
│   docker unpause            docker start            │
│              │                     │                │
│              └──────────┬──────────┘                │
│                         │                            │
│                         ▼                            │
│   docker rm ────────► Deleted                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Practice Exercise

Try this exercise to reinforce what you've learned:

1. **Run an Alpine Linux container interactively**
   ```bash
   docker run -it alpine sh
   ```

2. **Inside the container, create a file**
   ```bash
   echo "Hello Docker" > /tmp/test.txt
   cat /tmp/test.txt
   exit
   ```

3. **Run the container again and check if the file exists**
   ```bash
   docker run -it alpine sh
   ls /tmp/
   # The file is gone! Each container starts fresh.
   exit
   ```

!!! question "Why did the file disappear?"
    Containers are ephemeral by default. When a container is removed, its filesystem is deleted. To persist data, you need to use **volumes** (covered in [Volumes](../concepts/volumes.md)).

---

## Next Steps

Now that you've run your first containers, learn about:

- [Docker Images](../concepts/images.md) - Understanding and managing images
- [Containers](../concepts/containers.md) - Deep dive into containers
- [Volumes](../concepts/volumes.md) - Persisting data
