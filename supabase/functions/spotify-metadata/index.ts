import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Spotify's public oEmbed API — no auth required
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const resp = await fetch(oembedUrl);

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch metadata", status: resp.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();

    // Parse the Spotify URL to extract type and ID
    const match = url.match(/\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    const itemType = match ? match[1] : "track";
    const spotifyId = match ? match[2] : "";

    // oEmbed returns: title, thumbnail_url, type, provider_name
    // Title format is typically "Song Name - Artist Name" for tracks
    let title = data.title || "Spotify Item";
    let subtitle = "";

    // For tracks, oEmbed title is "Title - Artist"
    if (itemType === "track" && title.includes(" - ")) {
      const parts = title.split(" - ");
      // Last part is usually the artist
      subtitle = parts.pop() || "";
      title = parts.join(" - ");
    } else if (itemType === "album") {
      // Album oEmbed title is "Album Name - Artist"
      if (title.includes(" - ")) {
        const parts = title.split(" - ");
        subtitle = parts.pop() || "";
        title = parts.join(" - ");
      }
    } else if (itemType === "playlist") {
      // Playlist oEmbed title might include owner
      subtitle = data.provider_name || "Spotify";
    }

    const result = {
      title,
      subtitle,
      image: data.thumbnail_url || null,
      spotify_id: spotifyId,
      item_type: `spotify_${itemType}`,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("spotify-metadata error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
