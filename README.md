# CodeQuest: Interactive Algorithm Visualizations

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Frontend](https://github.com/Akm592/CodeQuest101/actions/workflows/frontend.yml/badge.svg)](https://github.com/Akm592/CodeQuest101/actions/workflows/frontend.yml)
[![Backend](https://github.com/Akm592/CodeQuest101/actions/workflows/backend.yml/badge.svg)](https://github.com/Akm592/CodeQuest101/actions/workflows/backend.yml)

CodeQuest helps developers master algorithms and data structures by watching
them run. It has two parts:

- **Interactive visualizers** for sorting, searching, graphs, trees, dynamic
  programming, backtracking, tries and more. Each one has step-by-step
  playback and a "How it works" guide with pseudocode and a runnable Python
  solution.
- **An AI tutor** that answers coding questions. When an answer can be traced
  on a concrete example, it offers a **Visualize this with an example**
  button, which builds a step-by-step animation of that solution, with the
  executing code line and the variables shown at every step.

Try it at **[codequest101.vercel.app](https://codequest101.vercel.app/)**. The
tutor works without an account. Signing in saves your chat history; guests get
an ephemeral session and a usage limit.

## Repository layout

| Folder | What it is | Deployed on |
|---|---|---|
| [`frontend/`](frontend) | React + Vite + TypeScript app: visualizers, chat UI, animation player | Vercel (Root Directory `frontend`) |
| [`backend/`](backend) | FastAPI service: chat streaming, Gemini, visualization traces, Supabase persistence | Render (Root Directory `backend`, Docker) |

The two share one wire format for visualizations ("scenes"). The fixtures in
`frontend/src/lib/scene/fixtures` are validated by both sides' tests, so a
change that breaks either side fails CI.

## Running locally

**Backend** (Python 3.11):

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # GEMINI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
uvicorn app.main:app --reload --port 8000
```

See [`backend/README.md`](backend/README.md) for the API and configuration.

**Frontend** (Node.js 24):

```bash
cd frontend
npm install
cp .env.example .env.local    # VITE_API_URL=http://localhost:8000, Supabase URL and anon key
npm run dev
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend (defaults to `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

The anon key is meant to be public, since it ships in the built bundle.
Row Level Security is what protects user data, so apply
`backend/supabase/migrations` to your Supabase project before signing in.

## Search visibility

`npm run build` prerenders the public routes to HTML and generates `sitemap.xml`
and `robots.txt` in `frontend/dist`. It needs the frontend environment variables
above, including for the build-time render. The interactive React app mounts
over this HTML in the browser; the heap canvas loads only in the browser.

The catalog supplies visualizer metadata and the `/visualizations` directory.
`frontend/src/lib/seo.ts` lists other public routes and the production origin.
When adding a route, update that list so direct visits work on Vercel. Account,
chat and unknown pages use `noindex` and are excluded from the sitemap.

Vercel serves the generated files with clean URLs rather than rewriting every
request to the homepage. After deploying, submit `sitemap.xml` in Google Search
Console and inspect the priority visualizer URLs to check indexing and Google's
selected canonical. Sitemap submission is a separate step from deployment.

## Checks

These are what CI runs. Each workflow runs only when its folder changes.

```bash
# frontend/
npx tsc -b && npm run lint && npm test
node scripts/controls-lint.mjs
python3 scripts/check_guide_solutions.py
npm run build

# backend/
ruff check . && pytest -q
```

`frontend/scripts/ui-consistency-check.mjs` is a fuller browser check
(contrast, overflow, touch targets, the chat's visualization flow against a
faked backend). It needs a preview build and Chromium, so it runs by hand.

## Contributing

Contributions are welcome:

1. Fork the repository and create a branch.
2. Make your change, with tests where it makes sense.
3. Run the checks above for the folder you touched.
4. Open a pull request describing what changed and why.

Bug reports and feature ideas go in
[GitHub Issues](https://github.com/Akm592/CodeQuest101/issues).

## License

[MIT](LICENSE).
