# 🎵 VIBE Music

**Your personal AI-powered music experience — curated vibes, smart transitions, and collaborative mixes.**

VIBE Music is a modern web-based music player that organizes your library around *vibes* — mood-based playlists powered by an intelligent flow engine. Upload your own tracks, import from Spotify, create custom vibes, and share collaborative mixes with friends.

---

## ✨ Features

### 🎛 AI Flow / AI Radio
An intelligent track-sequencing engine that analyzes energy, mood, and texture to build seamless transitions between songs. It inserts classical bridges when the energy gap is too wide, avoids repeats, and keeps the listening experience smooth — like having a personal DJ.

### 🎧 Curated Vibes
Browse built-in vibes (80s, 90s Rock, Pop, Energy, Israeli, Classical) or create unlimited custom vibes with your own emoji, color, and description. Each vibe is a living playlist you can grow over time.

### 🔗 Spotify Link Support
Paste any Spotify track, album, or playlist URL to import music into your vibes. Metadata (title, artist, artwork) is fetched automatically via backend functions.

### 🤝 Collaborative Mixes
Share a mix with a unique link. Enable collaboration so friends can join, add tracks, and build a playlist together in real time. The owner retains full control — only they can delete the mix or remove tracks.

### ☁️ Cloud Sync
Sign in to sync your entire library, custom vibes, settings, and preferences across devices. Everything is saved automatically with debounced writes to avoid excessive calls.

### 🔐 Authentication
Email-based signup and login with email verification. User sessions persist across visits. All user data is scoped to the authenticated user.

### 🎨 Theme Support
Toggle between light and dark modes. Your preference syncs to the cloud when signed in.

### 🌐 Hebrew / English
Full bilingual support with RTL layout for Hebrew. Switch languages instantly from the UI — your choice is remembered.

### 📱 PWA / Installable App
VIBE Music is a Progressive Web App. Install it on your phone or desktop for a native-like experience with offline-capable assets and a custom app icon.

---

## 🛡 Security

VIBE Music implements multiple layers of security hardening:

| Layer | Detail |
|---|---|
| **Input Sanitization** | All user-provided text (vibe names, descriptions, track titles, mix names) is stripped of HTML tags and script content before storage and display. |
| **URL Validation** | External URLs are validated for safe protocols (`http`/`https` only). Spotify imports are restricted to the `open.spotify.com` domain. |
| **Safe Rendering** | No use of `dangerouslySetInnerHTML` with user content. All text is rendered as safe React text nodes. |
| **Environment Variables** | Only public/anon keys are exposed to the client bundle. Private secrets (Spotify client secret, service role keys) are kept server-side in backend functions. |
| **Row Level Security** | Every user-data table enforces RLS policies ensuring users can only read and write their own records. Shared mixes have scoped public read access. |
| **Upload Protection** | File uploads are validated by extension, MIME type, and size (50 MB limit). Executable and script file types are explicitly blocked. Filenames are sanitized before storage. |

---

## 🏗 Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, CSS custom properties |
| State | React Context, TanStack Query |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| AI Flow | Custom energy/mood/texture scoring engine |
| PWA | Service Worker, Web App Manifest |

---

## 🗺 Future Roadmap

- **Equalizer & audio effects** — per-vibe EQ presets and crossfade controls
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

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `VITE_SPOTIFY_CLIENT_ID` | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |

`VITE_GENERATION_PROVIDER` is optional — leave unset to disable AI generation.

> **Never commit `.env` to git.** It is listed in `.gitignore`. Use `.env.example` as the template.

### 3 — Configure Supabase

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| **Site URL** | `https://vibe-music-app-phi.vercel.app` |
| **Redirect URLs** | `https://vibe-music-app-phi.vercel.app` |
| **Redirect URLs** | `http://127.0.0.1:8080` (add for local dev) |

> If Site URL is wrong, email magic links will redirect to the wrong host — even if the frontend code is correct. Supabase validates `emailRedirectTo` against the allow-list server-side.

### 4 — Configure Spotify

In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → your app → **Redirect URIs**, add exactly:

```
https://vibe-music-app-phi.vercel.app
http://127.0.0.1:8080
```

No `/auth` suffix. No trailing slash variants. These must match exactly what the app sends.

### 5 — Deploy

Push to `main`. Vercel deploys automatically on every push.

---

## 📄 License

This project is proprietary. All rights reserved.
