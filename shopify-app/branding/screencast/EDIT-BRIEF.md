# CraftFrame Bundle Quiz demo: edit brief

Assemble one 3 minute 25 second video from the assets below. The screen recording is
the picture track and is not cut, sped up or re-timed; everything else is laid over it.
Output: 1920 x 1080, H.264, AAC 48 kHz stereo, 16:9, 3:25 total, file name
`craftframe-bundle-quiz-demo-v2.mp4`.

## Assets

| Track | File | Notes |
|---|---|---|
| Picture | `Screen Recording 2026-09-22 at 14.18.20.mov` | 4096 x 2300, 3:21. Scale to fit 1920 x 1080, letterbox with #f6f6f7 (the admin's page grey) if the aspect leaves bars. Hold the last frame to 3:25. |
| Voice | `voiceover.mp3` | ElevenLabs, single file, breaks baked in. Starts at 0:00. |
| Music | `bed.mp3` | 3:25 instrumental, structure below. Starts at 0:00. |
| SFX | `sfx-*.mp3` | Nine short files, placed at the cue points below. |
| End card | `end-card.png` | 1920 x 1080. Icon `app-icon-1200.png` centred at 240 px, "CraftFrame Bundle Quiz" beneath in Inter Semibold 56 px #1a1a1a, "apps.shopify.com" in Inter 28 px #6b6b6b, background #f6f6f7. |

## Timeline (minutes:seconds)

| Time | Picture | Voice section | SFX |
|---|---|---|---|
| 0:00 | Settings, Apps, uninstalled banner | Intro | |
| 0:06 | Install screen | Installation | |
| 0:18 | Approve subscription | Plan | |
| 0:24 | Approve clicked | | `sfx-confirm` |
| 0:30 | Overview | Overview | |
| 0:34 | Setup complete badge visible | | `sfx-success` |
| 0:38 | Category page | Step one | `sfx-transition` |
| 1:00 | Look page | Step two | `sfx-transition` |
| 1:04 | Match my store runs | | `sfx-scan` |
| 1:20 | Questions page | Step three | `sfx-transition` |
| 1:56 | Products page | Step four | `sfx-transition` |
| 2:14 | "Linked 16 sample products" toast | | `sfx-ticks` |
| 2:20 | Go live page | Step five | `sfx-transition` |
| 2:36 | Overview, live banner | Back on the overview | `sfx-success` |
| 2:44 | Storefront home page | Shopper's side | |
| 2:50 to 2:56 | Answers being clicked | | `sfx-tap`, one per click, max 5 |
| 2:58 | Result screen | The result | `sfx-reveal` |
| 3:08 | Checkout | One click | `sfx-pop` |
| 3:14 | End card fades in over checkout, 0.5 s cross-dissolve | Closing line | `sfx-sting` |
| 3:21 | Recording ends; end card holds | | |
| 3:25 | Fade to black over 0.5 s | | |

If the voice section starts more than one second off its picture cue, slide that voice
section, not the picture. The gaps in the voice file exist for this.

## Mix levels (LUFS integrated for the master, dBFS peak per track)

Target: master −16 LUFS integrated, true peak −1.5 dBTP. This is the level YouTube and
Shopify listings play comfortably without the viewer touching the volume.

| Track | Level | Rule |
|---|---|---|
| Voice | −3 dBFS peak, about −18 LUFS on its own | Always the loudest element. Light compression 3:1, gentle de-ess. |
| Music | −24 dBFS peak while voice is speaking, −18 dBFS peak in gaps | Sidechain duck from the voice: −8 dB, 80 ms attack, 600 ms release. The music should be felt, not noticed. |
| SFX | −10 dBFS peak | Louder than the music, quieter than the voice. Each one must be clearly audible on laptop speakers. Never overlap two SFX. |
| End sting | −8 dBFS peak | The one place the music and an effect can be equal. |

Fades: music 1 s fade in at 0:00, 1 s fade out ending at 3:25. No fade on the voice.
No reverb or EQ on SFX beyond a high-pass at 80 Hz.

## Music structure (matches `bed.mp3`)

- 0:00 to 0:30 intro, piano and pad only
- 0:30 to 2:30 main bed, soft drums, one lift at 1:40
- 2:30 to 3:05 build
- 3:05 to 3:15 peak, under "One click, checkout opens"
- 3:15 to 3:25 settle and end on a held chord

## Captions

Burn in the voiceover as captions: Inter 36 px, white with 60% black rounded background,
bottom centre, 80 px from the bottom edge, one line at a time, max 42 characters per line,
sentence-cased. Shopify asks for English or English subtitles; captions cover viewers on
mute. Source text is `voiceover-script.txt` with the break tags removed.

## Checks before export

- Nothing personal in frame: no email addresses, no other browser tabs, no notifications.
  The recording was made clean; confirm nothing was introduced.
- Every SFX is audible with the video played at 50% system volume on laptop speakers.
- Music never masks a word. Scrub 1:20 to 1:56 (longest narration) and 3:05 to 3:15 (music
  peak) specifically.
- Total runtime 3:25, under the 4-minute guidance.
- Export, then play the file start to finish once before uploading.

## Delivery

Upload to YouTube as unlisted with the title "CraftFrame Bundle Quiz Demo" and replace the
video on the existing link (YouTube Studio, the video, Editor, Replace) so
https://youtu.be/674VwioNeDY keeps working. If replace is unavailable, upload new, set
unlisted, allow embedding, and update the Screencast URL in the App Store submission form.
