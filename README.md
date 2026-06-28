# Camo

A simpler, customizable version of the chameleon/word-bluffing party game. One player (the chameleon) doesn't know the secret word — everyone else does. Talk it out, vote, and try to catch them.

- **Online mode**: host a room, share a 4-letter code, friends join from their own phones.
- **Pass-and-play mode**: no internet needed, one device passed around the table.
- **Fully customizable**: edit/add/remove word categories, set how many chameleons, set the discussion timer — all from the in-game settings screen, no code editing required.

## Why this needs a real backend

The earlier prototype used a Claude-artifact-only storage API that doesn't work outside Claude.ai — that's why other tabs/devices couldn't see the room. This version uses an actual serverless API route (`/api/room`) backed by **Vercel KV** (a hosted Redis database), so any device hitting your deployed URL talks to the same shared room state.

## Project structure

```
camo/
├── api/
│   └── room.js        # serverless function: GET/POST room state
├── public/
│   └── index.html     # the entire game UI (vanilla JS, no build step)
├── package.json
└── README.md
```

## Deploy it yourself

### 1. Put this on GitHub
Create a new repo, push these files to it (root of the repo, not in a subfolder).

### 2. Import into Vercel
- Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
- Framework preset: choose **"Other"** (this isn't Next.js — it's a static site + serverless functions, which Vercel supports natively).
- Click **Deploy**. The first deploy will succeed even without a database connected, but creating/joining rooms won't work until you add KV (next step).

### 3. Add a Vercel KV database
- In your Vercel project dashboard, go to **Storage → Create Database → KV** (Redis).
- Create it and **connect it to this project** when prompted. This automatically adds the required environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) to your project.
- Redeploy the project (Vercel usually prompts you to, or go to **Deployments → ⋯ → Redeploy**).

### 4. Play
- Visit your deployed URL (e.g. `https://camo-yourname.vercel.app`).
- One person clicks **"Host online room"**, gets a code, shares it.
- Everyone else opens the same URL on their own device and clicks **"Join with code"**.

## Local development

```bash
npm install -g vercel   # if you don't have the Vercel CLI
npm install
vercel dev
```
`vercel dev` runs both the static site and the `/api` functions locally, and will prompt you to link a KV database (or you can run against your real Vercel KV by pulling env vars with `vercel env pull`).

## Customizing the game

Everything is editable from the **Customize game** screen in the lobby — no code changes needed:
- Turn category packs on/off, or delete ones you don't like.
- Add new categories with your own word lists (one word per line).
- Change number of chameleons (1–3) and discussion timer length.

If you want to change the **default** starting categories (what loads before anyone customizes anything), edit the `DEFAULT_PACK` object near the top of the `<script>` tag in `public/index.html`.

## Notes & limitations

- Rooms auto-expire after 6 hours of inactivity (configurable via `TTL_SECONDS` in `api/room.js`).
- Each player's secret card is stored in shared room state and only hidden by the UI — it's not cryptographically private. Fine for a friendly game, not for anything where someone might peek at the network tab.
- Syncing is done by polling every ~1.5s rather than websockets, which keeps this simple and free-tier friendly on Vercel. There will be a tiny lag between actions on different devices.
