// Builds craftframe-bundle-quiz-demo-v2.mp4 from the folder's assets, per PROMPT.md.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const B = __dirname;
const ff = (args) => execFileSync("ffmpeg", ["-nostats", "-loglevel", "warning", "-y", ...args], { cwd: root, stdio: "inherit" });
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { cwd: root }).toString());

// 1. Voice sections: [from, to] inside the voice file, and where each is placed on the picture.
const sections = [
  [0, 11.7, 0], [11.7, 18.0, 6], [18.0, 23.8, 18], [23.8, 31.9, 30], [31.9, 49.7, 38],
  [49.7, 70.5, 60], [70.5, 93.3, 80], [93.3, 109.7, 116], [109.7, 120.4, 140], [120.4, 131.3, 154],
  [131.3, 144.5, 166], [144.5, 155.4, 186], [159.8, 162.0, 196.5], [162.0, 166.77, 199],
];
// Never overlap: push a section later if the previous one is still speaking.
let end = 0; const placed = sections.map(([a, b, at]) => { const start = Math.max(at, end + 0.3); end = start + (b - a); return [a, b, +start.toFixed(2)]; });
placed.forEach(([a, b, at], i) => {
  const len = b - a;
  ff(["-ss", String(a), "-t", String(len), "-i", "build/voice.wav", "-af", `afade=t=in:d=0.05,afade=t=out:st=${(len - 0.08).toFixed(2)}:d=0.08`, `build/v${String(i + 1).padStart(2, "0")}.wav`]);
});
console.log("voice sections placed at:", placed.map((p) => p[2]).join(", "));

// 2. Effects: trim padding, cap length, high-pass.
const fx = {
  confirm: ["Soft,_short_UI_confi_#3-1790092240154.mp3", 1.4], success: ["Warm_success_tone,_a_#2-1790092328139.mp3", 1.0],
  transition: ["Very_subtle,_soft_cl_#3-1790092367151.mp3", 0.35], scan: ["Light_scanning_sweep_#3-1790092397315.mp3", 1.0],
  ticks: ["Quick_series_of_six__#3-1790092426257.mp3", 1.0], tap: ["Soft_rounded_tap,_li_#2-1790092461390.mp3", 0.35],
  reveal: ["Gentle_reveal_whoosh_#4-1790092565845.mp3", 1.4], pop: ["Satisfying_single_so_#4-1790092590237.mp3", 0.5],
  sting: ["Subtle_brand_sting_a_#2-1790092640302.mp3", 1.8],
};
for (const [k, [f, t]] of Object.entries(fx)) {
  const target = k === "sting" ? -8 : -10;
  ff(["-i", f, "-t", String(t), "-af", `highpass=f=80,afade=t=out:st=${(t - 0.05).toFixed(2)}:d=0.05,alimiter=limit=0.5:level=0`, "-ar", "48000", `build/${k}.tmp.wav`]);
  const peak = parseFloat(execFileSync("sh", ["-c", `ffmpeg -i "build/${k}.tmp.wav" -af volumedetect -f null /dev/null 2>&1 | grep -o "max_volume: [-0-9.]*" | cut -d" " -f2`], { cwd: root }).toString());
  ff(["-i", `build/${k}.tmp.wav`, "-af", `volume=${(target - peak).toFixed(2)}dB`, `build/${k}.wav`]);
}
const cues = [[24, "confirm"], [34, "success"], [38, "transition"], [60, "transition"], [64, "scan"], [80, "transition"], [116, "transition"], [134, "ticks"], [140, "transition"], [156, "success"], [172, "tap"], [176, "tap"], [180, "tap"], [184, "tap"], [186, "reveal"], [196, "pop"], [199, "sting"]];

// 3. End card: build/endcard.png is rendered separately (no drawtext in this ffmpeg).
if (!fs.existsSync(path.join(B, "endcard.png"))) throw new Error("build/endcard.png missing");

// 4. Mix graph.
const TOTAL = 206;
const [VG, MG, FG] = (process.env.GAINS || "0,0,0").split(",").map(Number);
const inputs = ["-i", "film_raw.mov", "-i", "build/music.wav", "-loop", "1", "-t", "7", "-i", "build/endcard.png"];
let idx = 3; const parts = []; const labels = [];
placed.forEach((p, i) => { inputs.push("-i", `build/v${String(i + 1).padStart(2, "0")}.wav`); parts.push(`[${idx}:a]aformat=channel_layouts=stereo,adelay=${Math.round(p[2] * 1000)}|${Math.round(p[2] * 1000)}[vo${i}]`); labels.push(`[vo${i}]`); idx++; });
const voiceMix = `${parts.join(";")};${labels.join("")}amix=inputs=${labels.length}:normalize=0[voice]`;
const fxParts = []; const fxLabels = [];
cues.forEach(([t, k], i) => { inputs.push("-i", `build/${k}.wav`); fxParts.push(`[${idx}:a]aformat=channel_layouts=stereo,adelay=${t * 1000}|${t * 1000}[fx${i}]`); fxLabels.push(`[fx${i}]`); idx++; });
const fxMix = `${fxParts.join(";")};${fxLabels.join("")}amix=inputs=${fxLabels.length}:normalize=0[fx]`;
// Voice peaks at -3 dBFS; music -24 dBFS under speech via sidechain duck (-8 dB from a -18 dBFS bed); effects -10 dBFS peak.
const duck = "volume=\x27" + placed.map(([a,b,at]) => { const e = at + (b - a); return `if(between(t,${at.toFixed(2)},${e.toFixed(2)}),0.45,1)`; }).reduce((acc,cur)=>acc.replace(/,1\)$/, `,${cur})`)) + "\x27:eval=frame";
const filter = [
  `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xf6f6f7,tpad=stop_mode=clone:stop_duration=5,fps=30,settb=1/30,setsar=1[pic]`,
  `[2:v]format=yuv420p,fps=30,settb=1/30,setsar=1[card]`,
  `[pic][card]xfade=transition=fade:duration=0.5:offset=199[vid0]`,
  `[vid0]fade=t=out:st=204:d=1,trim=0:${TOTAL}[vid]`,
  voiceMix,
  `[voice]acopy[voiceA]`,
  `[1:a]aformat=channel_layouts=stereo,volume=-18dB:precision=fixed[bed]`,
  `[bed]${duck}[ducked]`,
  fxMix,
  `[voiceA]volume=${VG}dB[v2]`,`[ducked]volume=${MG}dB[d2]`,`[fx]volume=${FG}dB[f2]`,`[v2][d2][f2]amix=inputs=3:normalize=0,atrim=0:${TOTAL},alimiter=limit=0.89:level=0[aud]`,
].join(";");
fs.writeFileSync(path.join(B, "filter.txt"), filter);
ff([...inputs, "-filter_complex_script", "build/filter.txt", "-map", "[vid]", "-map", "[aud]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", "-t", String(TOTAL), "craftframe-bundle-quiz-demo-v2.mp4"]);
console.log("done", dur("craftframe-bundle-quiz-demo-v2.mp4"), "s");
