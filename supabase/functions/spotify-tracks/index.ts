import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getClientToken(clientId: string, clientSecret: string): Promise<string> {
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) throw new Error(`Token request failed: ${resp.status}`);
  const data = await resp.json();
  return data.access_token;
}

interface SimpleTrack {
  title: string;
  artist: string;
  spotify_url: string;
  spotify_id: string;
  duration_ms: number;
  image?: string;
}

function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
    const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Spotify credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const match = url.match(/\/(album|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: "URL must be a Spotify album or playlist" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [, itemType, itemId] = match;
    const token = await getClientToken(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET);

    const headers = { Authorization: `Bearer ${token}` };
    const tracks: SimpleTrack[] = [];

    if (itemType === "album") {
      // Fetch album details for cover image
      const albumResp = await fetch(`https://api.spotify.com/v1/albums/${itemId}`, { headers });
      if (!albumResp.ok) {
        return new Response(
          JSON.stringify({ error: `Spotify API error: ${albumResp.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const album = await albumResp.json();
      const albumImage = album.images?.[1]?.url || album.images?.[0]?.url || null;

      for (const t of album.tracks?.items || []) {
        tracks.push({
          title: t.name,
          artist: (t.artists || []).map((a: any) => a.name).join(", "),
          spotify_url: t.external_urls?.spotify || "",
          spotify_id: t.id,
          duration_ms: t.duration_ms || 0,
          image: albumImage,
        });
      }
    } else {
      // Playlist — paginate up to 100 tracks
      const plResp = await fetch(
        `https://api.spotify.com/v1/playlists/${itemId}?fields=tracks.items(track(id,name,duration_ms,artists,external_urls,album(images)))`,
        { headers }
      );
      if (!plResp.ok) {
        return new Response(
          JSON.stringify({ error: `Spotify API error: ${plResp.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const pl = await plResp.json();

      for (const item of pl.tracks?.items || []) {
        const t = item.track;
        if (!t || !t.id) continue; // skip local/unavailable tracks
        tracks.push({
          title: t.name,
          artist: (t.artists || []).map((a: any) => a.name).join(", "),
          spotify_url: t.external_urls?.spotify || "",
          spotify_id: t.id,
          duration_ms: t.duration_ms || 0,
          image: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || undefined,
        });
      }
    }

    const result = tracks.map((t) => ({
      ...t,
      duration: formatDuration(t.duration_ms),
    }));

    return new Response(JSON.stringify({ tracks: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("spotify-tracks error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
