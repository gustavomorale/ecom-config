// Tight cut: removes the dead time between narration sections. Each segment shows the
// recording from a screen change, for as long as its narration plus a beat, then jumps.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const ff = (args) => execFileSync("ffmpeg", ["-nostats", "-loglevel", "error", "-y", ...args], { cwd: root, stdio: "inherit" });
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { cwd: root }).toString());

// [voiceFrom, voiceTo, picIn, minPic, fxList]  voice times are in voice.wav; picIn is where the
// segment starts in film_raw.mov; minPic is the least picture to show even if narration is short;
// fx are [offsetWithinSegment, name].
const BEAT = 0.9;
const segs = [
  [0, 11.7, 0.0, 6, []],                          // settings, uninstalled banner (intro line)
  [11.7, 18.0, 5.0, 6, [], 4.8],                      // install screen
  [18.0, 23.8, 19.8, 6, [[4.6, "confirm"]]],      // approve plan
  [23.8, 31.9, 30.0, 6, [[3.5, "success"]]],      // overview, setup complete
  [31.9, 49.7, 38.2, 8, [[0.2, "transition"]]],   // category templates (scrolling)
  [49.7, 70.5, 56.2, 8, [[0.2, "transition"], [3.5, "scan"]]], // look, match my store
  [70.5, 93.3, 70.6, 8, [[0.2, "transition"]]],   // questions page
  [93.3, 109.7, 104.7, 8, [[0.2, "transition"], [15.4, "ticks"]]], // products, linking
  [109.7, 120.4, 132.8, 8, [[0.2, "transition"]]], // go live
  [120.4, 131.3, 155.1, 8, [[0.6, "success"]]],   // overview, live banner
  [131.3, 144.5, 163.2, 22, [[4.0, "tap"], [8.0, "tap"], [12.0, "tap"], [16.0, "tap"]]], // storefront, answering (needs real time)
  [144.5, 155.4, 185.7, 11, [[0.3, "reveal"]]],   // result
  [155.4, 162.0, 195.2, 9, [[1.0, "pop"]]],       // cart line + one click (checkout appears ~196)
];
// Closing line plays over the end card.
const CLOSING = [162.0, 166.77];

// 1. Cut voice sections.
let parts = [];
segs.forEach(([a, b, picIn, minPic, , hold], i) => {
  const len = b - a;
  ff(["-ss", String(a), "-t", String(len), "-i", "build/voice.wav", "-af", `afade=t=in:d=0.05,afade=t=out:st=${(len - 0.08).toFixed(2)}:d=0.08`, `build/t_v${i}.wav`]);
  const picLen = Math.max(minPic, len + BEAT);
  parts.push({ i, a, b, picIn, picLen, voiceLen: len, hold });
});
ff(["-ss", String(CLOSING[0]), "-t", String(CLOSING[1] - CLOSING[0]), "-i", "build/voice.wav", "build/t_vclose.wav"]);

// 2. Timeline positions.
let t = 0; parts.forEach((p) => { p.at = t; t += p.picLen; });
const cardAt = t; const closeLen = CLOSING[1] - CLOSING[0]; const TOTAL = +(cardAt + closeLen + 2.0).toFixed(2);
console.log("segments:", parts.map((p) => `${p.i}@${p.at.toFixed(1)}(${p.picLen.toFixed(1)}s)`).join(" "), "| card at", cardAt.toFixed(1), "| total", TOTAL);

// 3. Picture: trim each segment from the recording, concatenate, then the end card.
const vin = []; const vlab = [];
parts.forEach((p, k) => { vin.push("-ss", String(p.picIn), "-t", String(p.hold ? p.hold : p.picLen), "-i", "film_raw.mov"); vlab.push(`[${k}:v]`); });
const cardIdx = parts.length;
vin.push("-loop", "1", "-t", String(TOTAL - cardAt), "-i", "build/endcard.png");
const musicIdx = cardIdx + 1; vin.push("-i", "build/music.wav");
let idx = musicIdx + 1;
const voiceIn = []; const voiceLab = [];
parts.forEach((p) => { vin.push("-i", `build/t_v${p.i}.wav`); voiceIn.push(`[${idx}:a]aformat=channel_layouts=stereo,adelay=${Math.round(p.at * 1000)}|${Math.round(p.at * 1000)}[vo${p.i}]`); voiceLab.push(`[vo${p.i}]`); idx++; });
vin.push("-i", "build/t_vclose.wav"); voiceIn.push(`[${idx}:a]aformat=channel_layouts=stereo,adelay=${Math.round((cardAt + 0.3) * 1000)}|${Math.round((cardAt + 0.3) * 1000)}[voc]`); voiceLab.push("[voc]"); idx++;
const fxIn = []; const fxLab = [];
parts.forEach((p) => { p && segs[p.i][4].forEach(([off, name]) => { const at = p.at + off; vin.push("-i", `build/${name}.wav`); fxIn.push(`[${idx}:a]aformat=channel_layouts=stereo,adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}[fx${idx}]`); fxLab.push(`[fx${idx}]`); idx++; }); });
vin.push("-i", "build/sting.wav"); fxIn.push(`[${idx}:a]aformat=channel_layouts=stereo,adelay=${Math.round(cardAt * 1000)}|${Math.round(cardAt * 1000)}[fxs]`); fxLab.push("[fxs]"); idx++;

const speaking = [...parts.map((p) => [p.at, p.at + p.voiceLen]), [cardAt + 0.3, cardAt + 0.3 + closeLen]];
const duck = "volume='" + speaking.reduce((acc, [s, e]) => acc.replace(/,1\)$/, `,if(between(t,${s.toFixed(2)},${e.toFixed(2)}),0.45,1))`), `if(between(t,${speaking[0][0].toFixed(2)},${speaking[0][1].toFixed(2)}),0.45,1)`) + "':eval=frame";

const filter = [
  ...parts.map((p, k) => `[${k}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xf6f6f7,fps=30,settb=1/30,setsar=1,setpts=PTS-STARTPTS${p.hold ? `,tpad=stop_mode=clone:stop_duration=${(p.picLen - p.hold).toFixed(2)}` : ""}[p${k}]`),
  `${vlab.map((_, k) => `[p${k}]`).join("")}concat=n=${parts.length}:v=1:a=0,fps=30,settb=1/30,setsar=1[pic]`,
  `[${cardIdx}:v]format=yuv420p,fps=30,settb=1/30,setsar=1[card]`,
  `[pic][card]xfade=transition=fade:duration=0.5:offset=${(cardAt - 0.5).toFixed(2)}[vid0]`,
  `[vid0]fade=t=out:st=${(TOTAL - 1).toFixed(2)}:d=1,trim=0:${TOTAL}[vid]`,
  `${voiceIn.join(";")};${voiceLab.join("")}amix=inputs=${voiceLab.length}:normalize=0[voice]`,
  `[${musicIdx}:a]aformat=channel_layouts=stereo,atrim=0:${TOTAL},afade=t=out:st=${(TOTAL - 1.5).toFixed(2)}:d=1.5,volume=-18dB:precision=fixed,${duck}[bed]`,
  `${fxIn.join(";")};${fxLab.join("")}amix=inputs=${fxLab.length}:normalize=0[fx]`,
  `[voice][bed][fx]amix=inputs=3:normalize=0,atrim=0:${TOTAL},alimiter=limit=0.89:level=0[aud]`,
].join(";");
fs.writeFileSync(path.join(__dirname, "filter-tight.txt"), filter);
ff([...vin, "-filter_complex_script", "build/filter-tight.txt", "-map", "[vid]", "-map", "[aud]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", "-t", String(TOTAL), "craftframe-bundle-quiz-demo-v3.mp4"]);
console.log("done", dur("craftframe-bundle-quiz-demo-v3.mp4"), "s");
