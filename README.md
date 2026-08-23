# Divi — Beszélő vörös panda

Talking Tom–stílusú interaktív animációs karakter GitHub Pages-hez.

## Karakter (PNG állapotok)
- `assets/panda-idle.webp` — alap / hallgat / gondolkodik
- `assets/panda-talk.webp` — beszél (lip-sync vált idle↔talk)
- `assets/panda-happy.webp` — nevet / koppintás

## Mit tud?
- AI-generált vörös panda mascot
- **Gemini AI** kérdez–felel (API kulcs a ⚙️ beállításokban)
- Mikrofon (`hu-HU`) vagy szövegbevitel
- Böngésző hang / opcionális ElevenLabs

## Gemini kulcs
1. ⚙️ Beállítások → Gemini API kulcs
2. A kulcs a böngésző `localStorage`-ában marad (ne commitold)
3. Google AI Studio-ban állíts HTTP-referrer korlátozást

## Futtatás
Nyisd meg az `index.html` fájlt, vagy a GitHub Pages URL-t.
