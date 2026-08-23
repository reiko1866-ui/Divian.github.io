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

## HTTP 429 (kvóta)
Ha túl sok a kérés, a Gemini `429 RESOURCE_EXHAUSTED` hibát ad.
Az app automatikusan **újrapróbál exponenciális várakozással**, sorba állítja a hívásokat,
és rövid válaszokat kér. Ha a hang-kvóta is tele, a szöveg továbbra is megjelenik.
Várj 1–2 percet, vagy nézd meg a kvótát az AI Studio Rate limits oldalán.

## Futtatás
Nyisd meg az `index.html` fájlt, vagy a GitHub Pages URL-t.
