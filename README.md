# VIBE Music

**VIBE Music** is an AI-powered music experience that organizes listening around moods, energy, BPM, and flow instead of traditional static playlists.

The app combines a custom AI flow engine, mood-based playlists, BPM tools, Spotify import, shareable mixes, Hebrew/English support, PWA behavior, and Supabase-based sync.

This project demonstrates product thinking, frontend architecture, media-focused UX, TypeScript, Supabase integrations, and AI-assisted interaction design.

## Live Demo

https://vibe-music-app-phi.vercel.app

## Repository

https://github.com/tamtam888/vibe-music-app

## Portfolio

Project screenshots and additional portfolio context are available here:

https://tamtam888.github.io/MyPortfolio/

---

## Core Features

| Area | Details |
|------|---------|
| AI Radio | Custom sequencing engine that chooses the next track by mood, energy, BPM, texture, favorites, and flow continuity |
| Beat Match | Selects the next track by closest BPM to keep the listening session consistent |
| BPM Scanner | Scans local audio files with the Web Audio API and identifies tracks that match the current vibe |
| AI Track Generation | Optional Replicate MusicGen integration for short AI-generated tracks based on the current vibe |
| Curated Vibes | Built-in and custom mood-based playlists with emoji, color, description, and track grouping |
| Spotify Import | Spotify links can be imported through Supabase Edge Functions for metadata enrichment |
| Shareable Mixes | Listening sessions can be saved and shared through a unique link |
| Cloud Sync | Authenticated users can sync library, custom vibes, settings, and preferences across devices |
| Authentication | Supabase Auth with email/password and magic-link flows |
| Hebrew and English | Bilingual UI with RTL support for Hebrew |
| PWA | Installable web app behavior with manifest and service-worker setup |

---

## Product Focus

VIBE Music was built as a product experiment around a simple idea: music apps should understand the emotional flow of a listening session, not only store playlists.

The main product decisions are:

- Organize music around vibes and listening context
- Use AI logic to improve the next-track decision
- Keep users in control while offering smart sequencing
- Support bilingual Hebrew/English UX
- Make the app usable across devices through cloud sync and PWA support
- Treat sharing as a core experience, not an afterthought

---

## Security and Data Handling

| Layer | Approach |
|------|----------|
| Input Sanitization | User-provided text is sanitized before storage and display |
| URL Validation | External links are validated and Spotify imports are restricted to Spotify domains |
| Safe Rendering | User content is rendered as React text, not unsafe HTML |
| Environment Variables | Private secrets are kept outside the client bundle and handled server-side where required |
| Row Level Security | User-owned data is scoped with Supabase RLS policies |
| Upload Protection | File type and size checks reduce unsafe upload behavior |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Routing | React Router |
| Styling | Tailwind CSS, shadcn/ui, Radix UI, CSS custom properties |
| State and Data | React Context, TanStack Query |
| Backend | Supabase, PostgreSQL, Auth, Edge Functions, Storage |
| AI Flow | Custom energy, mood, BPM, and texture scoring logic |
| AI Generation | Optional Replicate MusicGen integration |
| Audio | Web Audio API for BPM analysis |
| PWA | Web App Manifest and service-worker setup |
| Testing | Vitest, React Testing Library |
| Deployment | Vercel-ready Vite build |

---

## Project Structure

```text
vibe-music-app/
  src/
    components/       UI components and app sections
    contexts/         Shared app state and preferences
    hooks/            Reusable React hooks
    integrations/     Supabase and external service integrations
    lib/              Utility logic and shared helpers
    pages/            Route-level screens
  public/             Static assets and PWA files
  supabase/           Supabase functions and configuration
  package.json        Scripts and dependencies
  vite.config.ts      Vite configuration
  README.md
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/tamtam888/vibe-music-app.git
cd vibe-music-app
npm install
```

### 2. Configure environment variables

Create a local `.env` file based on `.env.example` and add the required values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SPOTIFY_CLIENT_ID=your-spotify-client-id
VITE_GENERATION_PROVIDER=replicate
VITE_REPLICATE_API_TOKEN=optional-token-for-ai-generation
```

AI generation is optional. The app can still be reviewed without enabling Replicate.

### 3. Run locally

```bash
npm run dev
```

The app will run locally at:

```text
http://127.0.0.1:8080
```

---

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint checks.

```bash
npm test
```

Runs the Vitest test suite.

---

## Deployment Notes

The app is configured for Vercel deployment.

Required Vercel environment variables:

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon public key |
| `VITE_SPOTIFY_CLIENT_ID` | Yes | Spotify import support |
| `VITE_GENERATION_PROVIDER` | Optional | Enables AI generation provider selection |
| `VITE_REPLICATE_API_TOKEN` | Optional | Enables Replicate MusicGen integration |

Supabase Authentication URL settings should include the production Vercel URL and the local development URL.

The live demo may depend on active Supabase, Spotify, and optional AI-generation services. If a free-tier backend is paused, the source code and portfolio screenshots still document the product and architecture.

---

## What This Project Demonstrates

- React and TypeScript product architecture
- Audio-oriented UX with Web Audio API integration
- Custom AI-style sequencing logic for mood and BPM flow
- Supabase Auth, data sync, Edge Functions, and RLS-aware design
- Bilingual Hebrew/English interface with RTL support
- PWA-oriented frontend setup
- Safe user input and URL handling
- Vercel-ready deployment workflow

---

## Future Improvements

- Crossfade between tracks
- Equalizer and per-vibe sound presets
- Public vibe discovery
- Listening analytics
- Offline playback for saved tracks
- Native mobile wrapper with Capacitor or TWA
- Bulk playlist import from additional music platforms

---

## License

This project is proprietary and presented as part of a professional frontend portfolio.
