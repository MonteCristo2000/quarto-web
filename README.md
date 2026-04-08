# Quarto Web

A full-stack, real-time two-player implementation of the **Quarto** board game, built with:

- **Backend**: Python / FastAPI / WebSockets (in-memory, no database needed)
- **Frontend**: React 18 + Vite, plain CSS

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.11 |
| Node.js | 18 |
| npm | 9 |

---

## Getting Started

### 1 — Backend

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

The server starts on **http://localhost:8000**.

### 2 — Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

The dev server starts on **http://localhost:5173**.

---

## How to Play

1. Open two browser tabs (or two different browsers) and navigate to **http://localhost:5173**.
2. In the first tab, enter your name and click **Create New Room**. A 4-letter room code will appear.
3. Share that room code with your opponent.
4. In the second tab, enter a name and the room code, then click **Join Room**.
5. The game starts automatically once both players are connected.

### Rules

Quarto is a two-player abstract strategy game played on a 4×4 board with 16 unique pieces.

Each piece has four binary attributes:

| Attribute | Values |
|-----------|--------|
| Size | tall / short |
| Color | light (cyan) / dark (red) |
| Shape | round / square |
| Fill | solid / hollow |

**Turn order:**

1. The active player **selects** a piece from the tray and hands it to their opponent.
2. The opponent **places** that piece anywhere on the board.
3. Roles swap — the player who just placed now selects the next piece.

**Winning:**
A player wins if, after placing a piece, there exist four pieces in a line (row, column, diagonal) **or** a 2×2 square that all share at least one attribute.

If all 16 pieces are placed with no winner the game is a draw.

Each player has a **5-minute clock**. Running out of time loses the game.

---

## Project Structure

```
quarto-web/
  server/
    game_logic.py    Pure game logic (QuartoGame class + helpers)
    main.py          FastAPI app — HTTP room creation + WebSocket handler
    requirements.txt

  client/
    index.html
    package.json
    vite.config.js
    src/
      main.jsx       React entry point
      App.jsx        Top-level router (Lobby <-> Game)
      ws.js          WebSocket singleton with auto-reconnect
      index.css      All styles (dark theme, CSS variables)
      components/
        Lobby.jsx      Create / join room screen
        Game.jsx       Main game layout
        Board.jsx      4×4 interactive board
        PieceTray.jsx  16-piece selection grid
        PieceShape.jsx SVG piece renderer
        ClockBar.jsx   Dual countdown clocks
        StatusBar.jsx  Turn / phase indicator
        WinOverlay.jsx End-game modal
      hooks/
        useGame.js   WebSocket wiring + game state
        useClock.js  Client-side clock interpolation
```

---

## Local network (same WiFi — phone, tablet, another laptop)

```bash
# Backend — bind to all interfaces
cd server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend — vite.config.js already sets host: true
cd client
npm run dev
```

Vite prints a `Network:` URL like `http://192.168.x.x:5173` — open that on any device on the same WiFi.

---

## Production deployment (Railway + Vercel)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/quarto-web.git
git push -u origin main
```

### Step 2 — Deploy backend on Railway

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → select your repo
2. In the service settings set **Root Directory** to `server`
3. Railway detects the `Dockerfile` automatically and builds it
4. After deploy: **Settings → Networking → Generate Domain**
5. Copy the domain, e.g. `quarto-backend-production.up.railway.app`

### Step 3 — Deploy frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project → Import** → select your repo
2. Set **Root Directory** to `client`
3. Vercel auto-detects Vite (build: `npm run build`, output: `dist`)
4. Add an **Environment Variable**:
   ```
   VITE_WS_URL = wss://quarto-backend-production.up.railway.app/ws
   ```
   (use your Railway domain from Step 2 — note `wss://`, not `https://`)
5. Click **Deploy** → Vercel gives you a URL like `https://quarto-web.vercel.app`

Share that URL with anyone — no install required.

### Redeployment

Every `git push` to `main` automatically redeploys both services.

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_WS_URL` | auto-detected from `window.location.hostname` | WebSocket server URL — must be set in production |

---

## Notes

- Rooms expire after **1 hour** of inactivity.
- If a player refreshes, they can reconnect by entering the same room code and name — they will be restored to their slot.
- The server is authoritative for clock management; the client only interpolates for smooth display.
- `game_logic.py` has no networking imports — plug in an RL bot by importing it directly.
