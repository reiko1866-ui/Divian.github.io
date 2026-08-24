# Divi — Beszélő vörös panda

Talking Tom–stílusú interaktív animációs karakter GitHub Pages-hez.

## Karakter (PNG állapotok)
- `assets/panda-idle.webp` — alap / hallgat / gondolkodik
- `assets/panda-talk.webp` — beszél (lip-sync vált idle↔talk)
- `assets/panda-happy.webp` — nevet / koppintás

## Mit tud?
- AI-generált vörös panda mascot
- **Gemini AI** szöveges válaszok (mesés Divi system prompt)
- **ElevenLabs TTS** élethű hang (gyors flash modell)
- Mikrofon (`hu-HU`) vagy szövegbevitel
- Beszéd közben lágy pulzáló animáció a pandán

## Hol add meg a kulcsokat?
1. Nyisd meg az oldalt → **⚙️**
2. **Gemini API kulcs** → szöveg (`localStorage`: `divi-gemini-key`)
3. **ElevenLabs API kulcs** → hang (`localStorage`: `divi-eleven-key`)
4. Válassz hangot (Adam / Arnold / Josh / Antoni / Bella), vagy saját Voice ID
5. **Kész**

**Ne commitold** a kulcsokat a forráskódba.

- Gemini: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- ElevenLabs: [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)

## Futtatás
Nyisd meg az `index.html` fájlt, vagy a GitHub Pages URL-t.
