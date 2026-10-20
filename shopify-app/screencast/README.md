# Review screencast, cut of 2026-10-20

- Edited video: `~/Desktop/1020-edit.mp4` (2:51, no sound), cut from `~/Desktop/1020.mp4`.
- Voiceover: `voiceover-1020.txt` (ElevenLabs text with pause tags, timed shot by shot).
- English subtitles: `subtitles-1020.srt` (upload to YouTube, or let YouTube auto-sync the plain text).

## 1. Make the voice (one command)

Needs your ElevenLabs API key (Profile, API keys) and a voice ID (Voices, the voice, Copy voice
ID). Use the **Eleven Multilingual v2** model: it honours the `<break>` pause tags.

```bash
cd "/Users/gustavomorale/ECOM CONFIGURATOR/bundle-configurator/shopify-app/screencast" && read -s "ELEVEN_KEY?ElevenLabs API key: " && echo && read "VOICE_ID?Voice ID: " && curl -sS -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID?output_format=mp3_44100_128" -H "xi-api-key: $ELEVEN_KEY" -H "Content-Type: application/json" -d "$(python3 -c 'import json;print(json.dumps({"text":open("voiceover-1020.txt").read(),"model_id":"eleven_multilingual_v2","voice_settings":{"stability":0.55,"similarity_boost":0.75,"style":0,"use_speaker_boost":True}}))')" -o voiceover-1020.mp3 && unset ELEVEN_KEY && ls -l voiceover-1020.mp3
```

Or in the ElevenLabs website: Text to Speech, model Eleven Multilingual v2, paste the whole
of `voiceover-1020.txt`, Generate, download as `voiceover-1020.mp3` into this folder.

## 2. Put voice and video together (one command)

```bash
cd "/Users/gustavomorale/ECOM CONFIGURATOR/bundle-configurator/shopify-app/screencast" && ffmpeg -y -i ~/Desktop/1020-edit.mp4 -i voiceover-1020.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k ~/Desktop/CraftFrame-Bundle-Quiz-review.mp4
```

If the voice ends before or after the picture, tell Claude the voice file's length; the pauses
can be adjusted per shot.

## 3. YouTube

Unlisted. Title: CraftFrame Bundle Quiz: setup walkthrough (app review). Subtitles: English,
upload `subtitles-1020.srt`. Description chapters:

```
0:00 The store's own products (the app has no inventory)
0:09 Install and permissions
0:22 Welcome and plans
0:34 Step 1: Your products
0:54 Shopify's product picker: where every product comes from
1:20 Step 2: Questions
1:58 Step 3: Go live (theme editor)
2:17 The shopper's view and checkout
2:45 Home
```
