# Divi — Beszélő vörös panda

Talking Tom–stílusú interaktív animációs karakter GitHub Pages-hez.

## Karakter (PNG állapotok)
- `assets/panda-idle.webp` — alap / hallgat / gondolkodik
- `assets/panda-talk.webp` — beszél (lip-sync vált idle↔talk)
- `assets/panda-happy.webp` — nevet / koppintás

## Mit tud?
- AI-generált vörös panda mascot
- **Gemini AI** szöveges válaszok (szigorú Divi system prompt)
- **Gemini TTS** élethű hang (nem böngésző `speechSynthesis`)
- Mikrofon (`hu-HU`) vagy szövegbevitel
- Beszéd közben lágy pulzáló animáció a pandán

## Hol add meg a Gemini API kulcsot?
1. Nyisd meg az oldalt → kattints a **⚙️** ikonra
2. Illeszd be a kulcsot a **„Gemini API kulcs”** mezőbe (`#gemini-key` az `index.html`-ben)
3. Válassz hangszínt (Aoede / Kore / Puck / Charon)
4. Kattints **Kész**-re

A kulcs a böngésző `localStorage` kulcsába kerül: **`divi-gemini-key`**.
**Ne commitold** a kulcsot a forráskódba. Ha hiányzik, a konzol és a felület is egyértelmű hibát jelez.

Kulcs igénylése: [Google AI Studio](https://aistudio.google.com/apikey)

## Futtatás
Nyisd meg az `index.html` fájlt, vagy a GitHub Pages URL-t.
