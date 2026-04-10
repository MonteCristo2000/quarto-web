# Quarto Web

A full-stack, real-time two-player implementation of the **Quarto** board game.

- **Backend**: Python / FastAPI / WebSockets (in-memory, no database)
- **Frontend**: React 18 + Vite, plain CSS
- **Deployed**: Railway (backend) + Vercel (frontend)

---

## How to Play

Quarto is a two-player abstract strategy game played on a 4×4 board with 16 unique pieces.

Each piece has four binary attributes:

| Attribute | Values |
|-----------|--------|
| Size | tall / short |
| Color | light (cyan) / dark (red) |
| Shape | round / square |
| Fill | solid / hollow |

**Turn order:**

1. The active player **selects** a piece from the tray and gives it to their opponent.
2. The opponent **places** that piece anywhere on the board.
3. Roles swap — the player who just placed now selects the next piece.

**Winning:** A player wins if, after placing a piece, there are four pieces in a row, column, diagonal, **or** a 2×2 square that all share at least one attribute.

If all 16 pieces are placed with no winner, the game is a draw.

---

## Game Modes

### Classic Mode
Standard Quarto rules — any piece can be given to the opponent.

### Color Mode
Each player is assigned a color (Player 1 = cyan, Player 2 = red). You may only **give** pieces of your own color to your opponent. This adds a strategic constraint on piece selection.

---

## Features

- **Room system** — create a room, get a 4-letter code, share it with your opponent
- **Chess clock** — configurable time limit (3 / 5 / 10 min per player); running out of time loses the game
- **Rematch** — both players can vote for a rematch; the starting player alternates each game
- **Score tracker** — win/loss/draw tally persists across rematches in the same room
- **Winning condition display** — end screen shows exactly what won (e.g. "4 dark + tall pieces in Column 3")
- **Reconnect** — refresh the page and rejoin using the same room code + name to restore your slot
- **Mobile friendly** — responsive layout for phones and tablets

---

## Project Structure

```
quarto-web/
  server/
    game_logic.py    Pure game logic (QuartoGame class, win detection)
    main.py          FastAPI app — HTTP room creation + WebSocket handler
    Dockerfile       For Railway deployment
    requirements.txt

  client/
    index.html
    package.json
    vite.config.js
    src/
      main.jsx       React entry point
      App.jsx        Top-level router (Lobby <-> Game)
      ws.js          WebSocket singleton with auto-reconnect
      index.css      All styles (dark theme, CSS variables, responsive)
      components/
        Lobby.jsx      Create / join room + game mode & time limit selection
        Game.jsx       Main game layout (board + side panel)
        Board.jsx      4x4 interactive board
        PieceTray.jsx  16-piece selection grid
        PieceShape.jsx SVG piece renderer
        ClockBar.jsx   Dual countdown clocks
        StatusBar.jsx  Turn / phase indicator
        ScoreBar.jsx   Cross-rematch score tally
        WinOverlay.jsx End-game modal with winning condition
      hooks/
        useGame.js   WebSocket wiring + all game state
        useClock.js  Client-side clock interpolation for smooth display
```

---

## Local Setup

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.11 |
| Node.js | 18 |
| npm | 9 |

### Backend

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

Starts on **http://localhost:8000**.

### Frontend

```bash
cd client
npm install
npm run dev
```

Starts on **http://localhost:5173**. Open two tabs to play locally.

### Local network (phone, tablet, another laptop on same WiFi)

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

## Production Deployment (Railway + Vercel)

### Backend on Railway

1. [railway.app](https://railway.app) -> **New Project -> Deploy from GitHub repo**
2. Set **Root Directory** to `server`
3. Railway detects the `Dockerfile` and builds automatically
4. After deploy: **Settings -> Networking -> Generate Domain**
5. Copy the domain, e.g. `quarto-web-production.up.railway.app`

### Frontend on Vercel

1. [vercel.com](https://vercel.com) -> **Add New Project -> Import** -> select your repo
2. Set **Root Directory** to `client`
3. Add an **Environment Variable**:
   ```
   VITE_WS_URL = wss://quarto-web-production.up.railway.app/ws
   ```
   (use your Railway domain — note `wss://` not `https://`, and include `/ws`)
4. Click **Deploy**

Every `git push` to `main` automatically redeploys both services.

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_WS_URL` | auto-detected from `window.location` | WebSocket server URL — required in production |

---

## Technical Notes

- Rooms expire after **1 hour** of inactivity.
- The server is authoritative for clock management; the client interpolates for smooth display.
- `game_logic.py` has no networking imports — it can be imported directly to build an AI bot.
- CORS is set to `allow_origins=["*"]` because Vercel generates a new preview URL on every deploy.
