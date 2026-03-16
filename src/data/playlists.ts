export type TrackMood = "calm" | "warm" | "emotional" | "uplifting" | "driving" | "party";
export type TrackTexture = "electronic" | "guitar" | "vocal" | "instrumental" | "classical";
export type TrackSource = "mp3" | "spotify";
export type SpotifyItemType = "spotify_track" | "spotify_album" | "spotify_playlist";

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  url: string;
  energy?: number;
  mood?: TrackMood;
  texture?: TrackTexture;
  bpm?: number;
  isBridge?: boolean;
  source?: TrackSource;
  spotify_url?: string;
  spotify_id?: string;
  item_type?: SpotifyItemType;
  subtitle?: string;
  image?: string;
  metadata_fetched_at?: string;
}

export interface Playlist {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  tracks: Track[];
}

// All built-in tracks use real, playable audio files from Wikimedia Commons.
// Music by Kevin MacLeod (incompetech.com) – licensed under Creative Commons: By Attribution 4.0
// https://creativecommons.org/licenses/by/4.0/
// Classical pieces are arrangements/performances of public-domain compositions.
// URLs use Wikimedia Commons Special:FilePath redirect → upload.wikimedia.org CDN.
export const playlists: Playlist[] = [
  {
    id: "80s",
    name: "80s",
    emoji: "🕺",
    description: "Synth-pop & retro hits",
    color: "from-fuchsia-900 to-purple-950",
    tracks: [
      {
        id: "80s-1",
        title: "Funkorama",
        artist: "Kevin MacLeod",
        duration: "3:21",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Funkorama_(MacLeod,_Kevin)_(ISRC_USUAN1100474).oga",
        energy: 5, mood: "uplifting", texture: "electronic", bpm: 120,
      },
      {
        id: "80s-2",
        title: "Stringed Disco",
        artist: "Kevin MacLeod",
        duration: "3:30",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Stringed_Disco_(MacLeod,_Kevin)_(ISRC_USUAN1100059).oga",
        energy: 6, mood: "uplifting", texture: "electronic", bpm: 115,
      },
      {
        id: "80s-3",
        title: "Hitman",
        artist: "Kevin MacLeod",
        duration: "3:00",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Hitman_by_Kevin_MacLeod.ogg",
        energy: 5, mood: "warm", texture: "electronic", bpm: 110,
      },
    ],
  },
  {
    id: "90s-rock",
    name: "90s ROCK",
    emoji: "🎸",
    description: "Grunge & alternative anthems",
    color: "from-slate-800 to-zinc-950",
    tracks: [
      {
        id: "90s-1",
        title: "Sax, Rock, and Roll",
        artist: "Kevin MacLeod",
        duration: "3:50",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_Sax,_Rock,_and_Roll.ogg",
        energy: 7, mood: "driving", texture: "guitar", bpm: 130,
      },
      {
        id: "90s-2",
        title: "Interloper",
        artist: "Kevin MacLeod",
        duration: "4:23",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Interloper_(MacLeod,_Kevin)_(ISRC_USUAN1100401).oga",
        energy: 7, mood: "driving", texture: "guitar", bpm: 128,
      },
      {
        id: "90s-3",
        title: "Faceoff",
        artist: "Kevin MacLeod",
        duration: "1:13",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Faceoff_(MacLeod,_Kevin)_(ISRC_USUAN1100403).oga",
        energy: 8, mood: "driving", texture: "guitar", bpm: 145,
      },
    ],
  },
  {
    id: "pop",
    name: "POP",
    emoji: "🎤",
    description: "Chart-topping pop bangers",
    color: "from-pink-800 to-rose-950",
    tracks: [
      {
        id: "pop-1",
        title: "Carefree",
        artist: "Kevin MacLeod",
        duration: "3:25",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_Carefree.ogg",
        energy: 6, mood: "uplifting", texture: "vocal", bpm: 110,
      },
      {
        id: "pop-2",
        title: "Kool Kats",
        artist: "Kevin MacLeod",
        duration: "3:40",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Kool_Kats_(MacLeod,_Kevin)_(ISRC_USUAN1100601).oga",
        energy: 7, mood: "uplifting", texture: "vocal", bpm: 125,
      },
      {
        id: "pop-3",
        title: "Just Nasty",
        artist: "Kevin MacLeod",
        duration: "3:25",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Just_Nasty_(Computer_generated)(MacLeod,_Kevin)_(ISRC_USUAN1100518).oga",
        energy: 6, mood: "warm", texture: "vocal", bpm: 105,
      },
    ],
  },
  {
    id: "energy",
    name: "ENERGY",
    emoji: "⚡",
    description: "High-energy pump-up & party tracks",
    color: "from-red-900 to-orange-950",
    tracks: [
      {
        id: "work-1",
        title: "Faceoff",
        artist: "Kevin MacLeod",
        duration: "1:13",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Faceoff_(MacLeod,_Kevin)_(ISRC_USUAN1100403).oga",
        energy: 9, mood: "driving", texture: "electronic", bpm: 145,
      },
      {
        id: "work-2",
        title: "Interloper",
        artist: "Kevin MacLeod",
        duration: "4:23",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Interloper_(MacLeod,_Kevin)_(ISRC_USUAN1100401).oga",
        energy: 9, mood: "driving", texture: "electronic", bpm: 128,
      },
      {
        id: "work-3",
        title: "Hitman",
        artist: "Kevin MacLeod",
        duration: "3:00",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Hitman_by_Kevin_MacLeod.ogg",
        energy: 8, mood: "party", texture: "electronic", bpm: 110,
      },
      {
        id: "party-1",
        title: "Funkorama",
        artist: "Kevin MacLeod",
        duration: "3:21",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Funkorama_(MacLeod,_Kevin)_(ISRC_USUAN1100474).oga",
        energy: 8, mood: "party", texture: "electronic", bpm: 120,
      },
      {
        id: "party-2",
        title: "Stringed Disco",
        artist: "Kevin MacLeod",
        duration: "3:30",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Stringed_Disco_(MacLeod,_Kevin)_(ISRC_USUAN1100059).oga",
        energy: 9, mood: "party", texture: "electronic", bpm: 115,
      },
      {
        id: "party-3",
        title: "Kool Kats",
        artist: "Kevin MacLeod",
        duration: "3:40",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Kool_Kats_(MacLeod,_Kevin)_(ISRC_USUAN1100601).oga",
        energy: 8, mood: "party", texture: "vocal", bpm: 125,
      },
    ],
  },
  {
    id: "israeli",
    name: "ISRAELI",
    emoji: "🇮🇱",
    description: "Israeli hits & Mediterranean vibes",
    color: "from-blue-900 to-sky-950",
    tracks: [
      {
        id: "il-1",
        title: "Tea Roots",
        artist: "Kevin MacLeod",
        duration: "3:40",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Tea_Roots_(MacLeod,_Kevin)_(ISRC_USUAN1100472).oga",
        energy: 5, mood: "emotional", texture: "vocal", bpm: 95,
      },
      {
        id: "il-2",
        title: "Celtic Impulse",
        artist: "Kevin MacLeod",
        duration: "4:00",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Celtic_Impulse_(MacLeod,_Kevin)_(ISRC_USUAN1100297).oga",
        energy: 6, mood: "emotional", texture: "vocal", bpm: 115,
      },
      {
        id: "il-3",
        title: "Heart of Nowhere",
        artist: "Kevin MacLeod",
        duration: "3:25",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Heart_of_Nowhere_(MacLeod,_Kevin)_(ISRC_USUAN1400045).oga",
        energy: 5, mood: "warm", texture: "vocal", bpm: 100,
      },
    ],
  },
  {
    id: "classical",
    name: "CLASSICAL",
    emoji: "🎻",
    description: "Timeless classical & orchestral pieces",
    color: "from-emerald-900 to-teal-950",
    tracks: [
      {
        id: "class-1",
        title: "Brandenburg Concerto No. 4 in G, Mvt I",
        artist: "J.S. Bach (Kevin MacLeod)",
        duration: "7:18",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Brandenburg_Concerto_No._4_in_G,_Movement_I_(Allegro),_BWV_1049_(ISRC_USUAN1100303).mp3",
        energy: 3, mood: "calm", texture: "classical", isBridge: true, bpm: 80,
      },
      {
        id: "class-2",
        title: "Gymnopedie No. 1",
        artist: "Erik Satie (Kevin MacLeod)",
        duration: "3:07",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Gymnopedie_No._1_(ISRC_USUAN1100787).mp3",
        energy: 2, mood: "emotional", texture: "classical", isBridge: true, bpm: 58,
      },
      {
        id: "class-3",
        title: "Bach Cello Suite No. 1 – Prelude",
        artist: "J.S. Bach (Kevin MacLeod)",
        duration: "2:09",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Kevin_MacLeod_-_J_S_Bach_Cello_Suite_1_in_G_on_Dulcimer_-_Prelude.ogg",
        energy: 2, mood: "calm", texture: "instrumental", isBridge: true, bpm: 72,
      },
    ],
  },
];
