import { useState, useCallback, useRef } from "react";

// webkitSpeechRecognition is not in standard TypeScript DOM types.
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export type VoiceInputStatus = "idle" | "listening" | "processing" | "error";

// Resolve the available implementation once at module load time.
const SpeechRecognitionImpl: typeof SpeechRecognition | null =
  typeof window !== "undefined"
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
    : null;

/**
 * True if the current browser supports the Web Speech API.
 * Chrome/Edge: yes. Firefox: no. Safari 15+: partial.
 * Always check this before showing any voice UI.
 */
export const isVoiceInputSupported: boolean = SpeechRecognitionImpl !== null;

/**
 * Minimal wrapper around the browser Web Speech API.
 *
 * Responsibilities:
 *   - Detect support
 *   - Start / stop listening
 *   - Report lifecycle status
 *   - Pass raw transcript strings to the caller
 *
 * NOT responsible for:
 *   - Command parsing (caller's concern)
 *   - Continuous listening / wake-word detection
 *   - Any playback or vibe logic
 *
 * @param onResult  Called with the recognized transcript string.
 * @param lang      BCP 47 tag (e.g. "en-US", "he"). Defaults to "en-US".
 */
export function useVoiceInput(
  onResult: (transcript: string) => void,
  lang = "en-US"
) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const recRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionImpl) {
      setStatus("error");
      return;
    }
    if (recRef.current) return; // already running

    const rec = new SpeechRecognitionImpl();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang;

    rec.onstart = () => setStatus("listening");

    rec.onresult = (event) => {
      setStatus("processing");
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) onResult(transcript);
      setStatus("idle");
    };

    rec.onerror = () => {
      recRef.current = null;
      setStatus("error");
    };

    rec.onend = () => {
      recRef.current = null;
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    recRef.current = rec;
    rec.start();
  }, [lang, onResult]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setStatus("idle");
  }, []);

  return { status, isSupported: isVoiceInputSupported, startListening, stopListening };
}
