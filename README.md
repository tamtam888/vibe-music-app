# 🎵 VIBE Music

**Your personal AI-powered music experience — curated vibes, smart transitions, and collaborative mixes.**

VIBE Music is a modern web-based music player that organizes your library around *vibes* — mood-based playlists powered by an intelligent flow engine. Upload your own tracks, import from Spotify, scan local files by BPM, generate AI tracks, and share mixes with anyone.

---

## ✨ Features

### 🎛 AI Radio (AI Flow)
An intelligent track-sequencing engine that analyzes energy, mood, BPM, and texture to build seamless transitions between songs. When enabled, it **immediately skips** to the best-matched next track — like having a personal DJ. Inserts classical bridges when the energy gap is too wide, avoids repeats, and boosts your favorited tracks.

### 🥁 Beat Match
Picks the next track by closest BPM to the current song. When enabled, immediately skips to the best BPM match — keeping the groove consistent across your whole session.

### 🔍 BPM Scanner
Drag and drop audio files (mp3, wav, ogg, m4a, flac) to scan them for BPM. The scanner analyzes each file's tempo using the Web Audio API and highlights tracks that match the currently playing song's BPM. Add matches directly to any vibe.

### ✨ AI Track Generation
Generate original 30-second AI music tracks in the current vibe's style using [Replicate MusicGen](https://replicate.com/meta/musicgen). The prompt is built automatically from the current track's energy, mood, BPM, and texture. Requires `VITE_REPLICATE_API_TOKEN` and `VITE_GENERATION_PROVIDER=replicate`.

### 🎧 Curated Vibes
Browse built-in vibes (80s, 90s Rock, Pop, Energy, Israeli, Classical) or create unlimited custom vibes with your own emoji, color, and description. Each vibe is a living playlist you can grow over time.

### 🔗 Spotify Link Support
Paste any Spotify track, album, or playlist URL to import music into your vibes. Metadata (title, artist, artwork) is fetched automatically via Supabase Edge Functions.

### 🤝 Share Mixes
Save any listening session as a named mix. Share it with a unique link — anyone with the link can open the mix and play it directly, no account required.

### ☁️ Cloud Sync
Sign in to sync your entire library, custom vibes, settings, and preferences across devices. Everything is saved automatically with debounced writes to avoid excessive calls.

### 🔐 Authentication
Email-based signup, password login, and magic-link (passwordless) login. User sessions persist across visits. All user data is scoped to the authenticated user.

### 🎨 Theme Support
Toggle between light and dark modes. Your preference syncs to the cloud when signed in.

### 🌐 Hebrew / English
Full bilingual support with RTL layout for Hebrew. Switch languages instantly from the UI — your choice is remembered.

### 📱 PWA / Installable App
VIBE Music is a Progressive Web App. Install it on your phone or desktop for a native-like experience with offline-capable assets and a custom app icon.

---

## 🛡 Security

| Layer | Detail |
|---|---|
| **Input Sanitization** | All user-provided text is stripped of HTML tags and script content before storage and display. |
| **URL Validation** | External URLs are validated for safe protocols (`http`/`https` only). Spotify imports are restricted to the `open.spotify.com` domain. |
| **Safe Rendering** | No use of `dangerouslySetInnerHTML` with user content. All text is rendered as safe React text nodes. |
| **Environment Variables** | Only public/anon keys are exposed to the client bundle. Private secrets (Spotify client secret, Replicate token, service role keys) are kept server-side. |
| **Row Level Security** | Every user-data table enforces RLS policies ensuring users can only read and write their own records. |
| **Upload Protection** | File uploads are validated by extension, MIME type, and size (50 MB limit). Executable and script file types are explicitly blocked. |

---

## 🏗 Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, CSS custom properties |
| State | React Context, TanStack Query |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| AI Flow | Custom energy/mood/BPM/texture scoring engine |
| AI Generation | Replicate MusicGen (`meta/musicgen`) |
| BPM Detection | Web Audio API — client-side beat detection |
| PWA | Service Worker, Web App Manifest |

---

## 🗺 Future Roadmap

- **Crossfade** — smooth audio fade between tracks like a real DJ
- **Equalizer & audio effects** — per-vibe EQ presets
- **Social discovery** — explore public vibes and mixes from other users
- **Listening stats** — personal analytics on play history and vibe usage
- **Offline playback** — cache tracks locally for true offline listening
- **Mobile native wrapper** — Capacitor or TWA for app store distribution
- **Playlist import** — bulk import from YouTube Music, Apple Music, and SoundCloud

---

## 🚀 Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.example .env

# Start the dev server
npm run dev
```

The app will be available at `http://127.0.0.1:8080`.

---

## ☁️ Deploying to Vercel

### 1 — Connect the repository

Import the GitHub repository in the [Vercel Dashboard](https://vercel.com/new). Vercel auto-detects Vite — no framework override needed.

| Setting | Value |
|---|---|
| Framework Preset | Vite (auto-detected) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 2 — Set environment variables

Add these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Required | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase Dashboard → Settings → API |
| `VITE_SPOTIFY_CLIENT_ID` | ✅ | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `VITE_REPLICATE_API_TOKEN` | Optional | [replicate.com](https://replicate.com) → Account → API tokens |
| `VITE_GENERATION_PROVIDER` | Optional | Set to `replicate` to enable AI generation |

> **Never commit `.env` to git.** It is listed in `.gitignore`. Use `.env.example` as the template.

### 3 — Configure Supabase

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| **Site URL** | `https://vibe-music-app-phi.vercel.app` |
| **Redirect URLs** | `https://vibe-music-app-phi.vercel.app` |
| **Redirect URLs** | `http://127.0.0.1:8080` (for local dev) |

> ⚠️ If Site URL is wrong, magic links and email confirmation will redirect to the wrong host. This is the most common cause of broken magic-link login.

### 4 — Deploy Supabase Edge Functions

```sh
npx supabase login
npx supabase functions deploy spotify-auth --project-ref <YOUR_PROJECT_REF>
npx supabase secrets set SPOTIFY_CLIENT_ID=<your_id> SPOTIFY_CLIENT_SECRET=<your_secret> --project-ref <YOUR_PROJECT_REF>
```

### 5 — Configure Spotify

In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → your app → **Redirect URIs**, add exactly:

```
https://vibe-music-app-phi.vercel.app
http://127.0.0.1:8080
```

No `/auth` suffix. No trailing slash variants.

### 6 — Deploy

Push to `main`. Vercel deploys automatically on every push.

---

## 📄 License

This project is proprietary. All rights reserved.
