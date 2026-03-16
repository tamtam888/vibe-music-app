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
| Backend | Lovable Cloud (PostgreSQL, Auth, Edge Functions, Storage) |
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

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## 📄 License

This project is proprietary. All rights reserved.
