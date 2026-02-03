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

# deaf-lds-hub
A centralized hub for ward accessibility resources, including deaf membership data and interpreter availability worldwide.
