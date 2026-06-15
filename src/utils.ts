/**
 * Generates an elegant soft oscillator chime sound on incoming messages.
 * Uses native Web Audio API to avoid requiring external sound file assets.
 */
export function playChime() {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
    
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // blocked by browser ambient play policy
  }
}

/**
 * Ascending Discord connect sound (when joining voice)
 */
export function playJoinChime() {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Play double beep ascending
    const playBeep = (freq: number, start: number, len: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + len);
      
      osc.start(start);
      osc.stop(start + len + 0.05);
    };
    
    playBeep(440, now, 0.15); // A4
    playBeep(554.37, now + 0.08, 0.15); // C#5
    playBeep(659.25, now + 0.16, 0.25); // E5
  } catch (e) {}
}

/**
 * Descending Discord disconnect sound (when leaving voice)
 */
export function playLeaveChime() {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const playBeep = (freq: number, start: number, len: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + len);
      
      osc.start(start);
      osc.stop(start + len + 0.05);
    };
    
    playBeep(659.25, now, 0.15); // E5
    playBeep(554.37, now + 0.08, 0.15); // C#5
    playBeep(370.00, now + 0.16, 0.25); // F#4
  } catch (e) {}
}

/**
 * Format bytes to readable strings (KB, MB, etc.)
 */
export function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Static pre-defined avatar set for elegant UI profile selection
 */
export const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucy",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Max",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo",
];
