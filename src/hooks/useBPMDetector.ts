/**
 * BPM Detector — analyses local audio files using the Web Audio API.
 *
 * Algorithm:
 *   1. Decode the audio file to PCM samples
 *   2. Compute short-window energy (50 ms hops)
 *   3. Detect onset peaks (energy spikes above adaptive threshold)
 *   4. Build a histogram of inter-onset intervals
 *   5. Convert the dominant interval to BPM, normalised to 60–180
 */

export interface BPMResult {
  file: File;
  bpm: number | null;
  /** Human-readable name without extension */
  name: string;
  /** Object URL — caller must revoke when done */
  objectUrl: string;
}

/** Detect BPM from a single audio File. Returns null if detection fails. */
export async function detectBPMFromFile(file: File): Promise<BPMResult> {
  const objectUrl = URL.createObjectURL(file);
  const name = file.name.replace(/\.[^.]+$/, "");

  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

    const arrayBuffer = await file.arrayBuffer();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch {
      await ctx.close();
      return { file, bpm: null, name, objectUrl };
    }

    const raw = audioBuffer.getChannelData(0);
    const sr   = audioBuffer.sampleRate;

    // Use at most 90 s to keep memory reasonable
    const samples = raw.subarray(0, Math.min(raw.length, sr * 90));

    // --- energy windows (50 ms hop, 100 ms window) ---
    const hop  = Math.floor(sr * 0.05);
    const win  = Math.floor(sr * 0.10);
    const energies: number[] = [];

    for (let i = 0; i + win < samples.length; i += hop) {
      let e = 0;
      for (let j = i; j < i + win; j++) e += samples[j] * samples[j];
      energies.push(e / win);
    }

    // --- smooth with 5-frame moving average ---
    const smoothed = energies.map((_, i) => {
      const s = Math.max(0, i - 2);
      const end = Math.min(energies.length, i + 3);
      let sum = 0; for (let k = s; k < end; k++) sum += energies[k];
      return sum / (end - s);
    });

    // --- adaptive threshold (local mean × 1.4) ---
    const globalMean = smoothed.reduce((a, b) => a + b, 0) / smoothed.length;
    const threshold  = globalMean * 1.4;

    // minimum 300 ms between beats → frames
    const minGap = Math.floor(0.30 / (hop / sr));

    const peaks: number[] = [];
    let lastPeak = -minGap;

    for (let i = 1; i < smoothed.length - 1; i++) {
      if (
        smoothed[i] > smoothed[i - 1] &&
        smoothed[i] > smoothed[i + 1] &&
        smoothed[i] > threshold &&
        i - lastPeak >= minGap
      ) {
        peaks.push(i);
        lastPeak = i;
      }
    }

    if (peaks.length < 4) {
      await ctx.close();
      return { file, bpm: null, name, objectUrl };
    }

    // --- inter-peak intervals in seconds ---
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const sec = ((peaks[i] - peaks[i - 1]) * hop) / sr;
      if (sec > 0.20 && sec < 2.0) intervals.push(sec);
    }

    if (intervals.length < 3) {
      await ctx.close();
      return { file, bpm: null, name, objectUrl };
    }

    // --- histogram to find dominant interval ---
    const BINS    = 24;
    const MIN_INT = 0.25; // 240 BPM
    const MAX_INT = 2.00; // 30 BPM
    const binW    = (MAX_INT - MIN_INT) / BINS;
    const hist    = new Array(BINS).fill(0);
    intervals.forEach(v => {
      const b = Math.floor((v - MIN_INT) / binW);
      if (b >= 0 && b < BINS) hist[b]++;
    });

    const maxBin     = hist.indexOf(Math.max(...hist));
    const dominant   = MIN_INT + (maxBin + 0.5) * binW;
    let bpm          = Math.round(60 / dominant);

    // Normalise to 60–180 BPM
    while (bpm < 60)  bpm = Math.round(bpm * 2);
    while (bpm > 180) bpm = Math.round(bpm / 2);

    await ctx.close();
    return { file, bpm, name, objectUrl };
  } catch {
    return { file, bpm: null, name, objectUrl };
  }
}

/** How well does a candidate BPM match a reference BPM? Returns 0–100. */
export function bpmMatchScore(ref: number, candidate: number): number {
  if (!ref || !candidate) return 0;
  // Also check half/double tempo relationships
  const diffs = [
    Math.abs(candidate - ref),
    Math.abs(candidate - ref * 2),
    Math.abs(candidate - ref / 2),
  ];
  const best = Math.min(...diffs);
  if (best <= 3)  return 100;
  if (best <= 8)  return 85;
  if (best <= 15) return 65;
  if (best <= 25) return 40;
  return 0;
}
