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
2. **Gemini API kulcs** → szöveg (`divi-gemini-key`)
3. **ElevenLabs API kulcs** → hang (`divi-eleven-key`)
4. **Voice ID**: ElevenLabs → Voices / Voice Lab → **Copy Voice ID** → illeszd be a mezőbe
5. **Kész**

Ha a Voice ID üres, hibás, vagy az API **HTTP 400**-at ad, Divi automatikusan a böngésző magyar `speechSynthesis` hangjára vált.

Végpont: `https://api.elevenlabs.io/v1/text-to-speech/{VoiceID}`  
Modell: `eleven_multilingual_v2`

**Ne commitold** a kulcsokat a forráskódba.

- Gemini: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- ElevenLabs: [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)

## Futtatás
Nyisd meg az `index.html` fájlt, vagy a GitHub Pages URL-t.
