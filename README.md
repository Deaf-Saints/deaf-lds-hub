# deaf-lds-hub
A centralized hub for ward accessibility resources, including deaf membership data and interpreter availability worldwide.

---

## Hello World app (Next.js + TypeScript)

A minimal Next.js + TypeScript "Hello, world!" app was added to this repository for quick development testing.

Run the app locally:

```bash
# install dependencies
npm install

# run development server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Launch locally

These steps start the site for local development.

1. From the project root, install dependencies:

```bash
npm install
```

2. Start the Next.js development server:

```bash
npm run dev
```

3. Open the app in your browser at:

```
http://localhost:3000
```

Optional:

- Run on a different port:

```bash
PORT=3001 npm run dev
```

- Build and run production server locally:

```bash
npm run build
npm start
```

Troubleshooting:

- If the server is already running or port is busy, find and stop the process:

```bash
lsof -i :3000
# then
kill <PID>
```

- To stop the dev server: press Ctrl+C in the terminal running `npm run dev`.

---

## Run with Docker

You can run the app in a Docker container instead of installing Node.js locally.

### Install Docker Desktop

1. Download Docker Desktop for your operating system:
   - **Windows**: https://docs.docker.com/desktop/setup/install/windows-install/
   - **Mac**: https://docs.docker.com/desktop/setup/install/mac-install/
   - **Linux**: https://docs.docker.com/desktop/setup/install/linux/

2. Run the installer and follow the prompts.

3. After installation, start Docker Desktop and wait for it to fully initialize (the Docker icon in your system tray should show "running").

4. Verify the installation by opening a terminal and running:

```bash
docker --version
docker compose version
```

### Run the app with Docker Compose

From the project root, start the app:

```bash
docker compose up
```

This will:
- Pull the Node.js image (first run only)
- Install dependencies
- Start the development server

Open http://localhost:3000 in your browser.

To stop the container, press `Ctrl+C` or run:

```bash
docker compose down
```

To run in detached mode (background):

```bash
docker compose up -d
```

To view logs when running in detached mode:

```bash
docker compose logs -f
```
