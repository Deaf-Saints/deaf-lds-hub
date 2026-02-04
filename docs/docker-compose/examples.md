# Docker Compose Examples

Real-world examples for common application stacks.

## Web Application with Database

### Node.js + PostgreSQL + Redis

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://postgres:secret@db:5432/myapp
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  pgdata:
  redis-data:
```

---

## Full-Stack Development

### React + Express + MongoDB

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
      - /app/node_modules
    environment:
      - REACT_APP_API_URL=http://localhost:5000

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "5000:5000"
    volumes:
      - ./backend/src:/app/src
      - /app/node_modules
    environment:
      - MONGO_URI=mongodb://mongo:27017/myapp
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  mongo-express:
    image: mongo-express
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_SERVER: mongo
    depends_on:
      - mongo

volumes:
  mongo-data:
```

---

## WordPress

### WordPress + MySQL + phpMyAdmin

```yaml
version: '3.8'

services:
  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wordpress-data:/var/www/html
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

  phpmyadmin:
    image: phpmyadmin
    ports:
      - "8081:80"
    environment:
      PMA_HOST: db
      PMA_USER: root
      PMA_PASSWORD: rootpassword
    depends_on:
      - db

volumes:
  wordpress-data:
  db-data:
```

---

## Reverse Proxy with Nginx

### Multiple Apps Behind Nginx

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app1
      - app2
    restart: unless-stopped

  app1:
    build: ./app1
    expose:
      - "3000"
    environment:
      - PORT=3000
    restart: unless-stopped

  app2:
    build: ./app2
    expose:
      - "3000"
    environment:
      - PORT=3000
    restart: unless-stopped
```

`nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app1 {
        server app1:3000;
    }

    upstream app2 {
        server app2:3000;
    }

    server {
        listen 80;
        server_name app1.example.com;

        location / {
            proxy_pass http://app1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    server {
        listen 80;
        server_name app2.example.com;

        location / {
            proxy_pass http://app2;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## ELK Stack (Logging)

### Elasticsearch + Logstash + Kibana

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - es-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    healthcheck:
      test: curl -s http://localhost:9200 >/dev/null || exit 1
      interval: 30s
      timeout: 10s
      retries: 5

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      elasticsearch:
        condition: service_healthy

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  es-data:
```

---

## CI/CD Pipeline Tools

### GitLab Runner

```yaml
version: '3.8'

services:
  gitlab-runner:
    image: gitlab/gitlab-runner:latest
    volumes:
      - ./config:/etc/gitlab-runner
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

### Jenkins

```yaml
version: '3.8'

services:
  jenkins:
    image: jenkins/jenkins:lts
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins-data:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped

volumes:
  jenkins-data:
```

---

## Microservices Example

### API Gateway Pattern

```yaml
version: '3.8'

services:
  # API Gateway
  gateway:
    build: ./gateway
    ports:
      - "80:80"
    environment:
      - USER_SERVICE_URL=http://user-service:3000
      - ORDER_SERVICE_URL=http://order-service:3000
      - PRODUCT_SERVICE_URL=http://product-service:3000
    depends_on:
      - user-service
      - order-service
      - product-service

  # User Service
  user-service:
    build: ./services/user
    environment:
      - DATABASE_URL=postgres://postgres:secret@user-db:5432/users
    depends_on:
      - user-db

  user-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: users
      POSTGRES_PASSWORD: secret
    volumes:
      - user-db-data:/var/lib/postgresql/data

  # Order Service
  order-service:
    build: ./services/order
    environment:
      - DATABASE_URL=postgres://postgres:secret@order-db:5432/orders
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - order-db
      - rabbitmq

  order-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_PASSWORD: secret
    volumes:
      - order-db-data:/var/lib/postgresql/data

  # Product Service
  product-service:
    build: ./services/product
    environment:
      - MONGO_URI=mongodb://product-db:27017/products
    depends_on:
      - product-db

  product-db:
    image: mongo:6
    volumes:
      - product-db-data:/data/db

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "15672:15672"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  user-db-data:
  order-db-data:
  product-db-data:
  rabbitmq-data:
```

---

## Development vs Production

### Base Configuration

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    image: my-app:${TAG:-latest}
    environment:
      - NODE_ENV=${NODE_ENV:-production}

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Development Override

`docker-compose.override.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=true

  db:
    ports:
      - "5432:5432"
```

### Production Override

`docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  app:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: always

  db:
    deploy:
      resources:
        limits:
          memory: 1G
    restart: always
```

Usage:
```bash
# Development
docker compose up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Tips and Best Practices

1. **Use `.env` files** for sensitive data
2. **Pin image versions** (avoid `latest`)
3. **Use health checks** for dependencies
4. **Separate development and production** configs
5. **Use named volumes** for persistent data
6. **Set restart policies** for production
7. **Use profiles** for optional services

---

## Next Steps

- [Writing Dockerfiles](../dockerfile/writing.md) - Build custom images
- [Best Practices](../best-practices.md) - Production tips
