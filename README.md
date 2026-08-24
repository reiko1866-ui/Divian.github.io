# Divi — Beszélő vörös panda

Talking Tom–stílusú interaktív animációs karakter GitHub Pages-hez.

## Éles futtatás (GitHub Pages)
1. Merge / push a `main` ágra (vagy állítsd a Pages source-t a PR ágra)
2. Repo → **Settings → Pages → Deploy from branch → `/ (root)`**
3. Nyisd meg (proxy nélkül):
   - `https://reiko1866-ui.github.io/Divian.github.io/`
   - vagy közvetlenül: `…/index.html` / `…/demo.html`

A `demo.html` önálló (CSS/JS beágyazva), a képek relatív `assets/` útvonalon jönnek — **ne** htmlpreview-t használj (CORS / mikrofon / hang miatt).

## Karakter (PNG állapotok)
- `assets/panda-idle.webp` — alap / hallgat / gondolkodik
- `assets/panda-talk.webp` — beszél
- `assets/panda-happy.webp` — nevet / koppintás

## Mit tud?
- **Gemini** szöveg
- **ElevenLabs** hang — Gábor (`7B7mSWflzRSaO1yGeJH6`), modell: `eleven_multilingual_v2`
- Hiba esetén pontos üzenet a képernyő alján + böngésző TTS tartalék

## Kulcsok (⚙️)
1. Gemini API kulcs → szöveg (`divi-gemini-key`)
2. ElevenLabs API kulcs → hang (`divi-eleven-key`)
3. Voice ID alapból: `7B7mSWflzRSaO1yGeJH6` ([Gábor](https://elevenlabs.io/voices/7B7mSWflzRSaO1yGeJH6) → Use voice)

**Ne commitold** a kulcsokat.
