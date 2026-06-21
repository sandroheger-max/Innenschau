# Innenschau — Projektkontext für Claude Code

Tägliche Reflexions- und Ziel-App. Entstanden als Prototyp im Claude.ai-Chat,
hier als eigenständiges, deploybares Web-App-Projekt (PWA). Eigentümer: Sandro,
Schweiz. Kein technischer Hintergrund — bitte Entscheidungen, die er treffen
muss (z. B. API-Keys, Domain-Namen), klar und einfach erklären, nicht
voraussetzen, dass er Entwickler-Jargon kennt.

## Was die App macht

Eine sanfte, nicht-bestrafende Tagebuch-App nach dem Vorbild von Stoic (siehe
"Produktphilosophie" unten): morgens Vorsatz + Dankbarkeit, abends Stimmung +
Reflexion + Tags. Dazu Zielverfolgung, ein KI-gestützter Muster-Rückblick,
Atemübung, geführte Meditation, Yoga-Anleitungen und Musik-Empfehlungen.

## Tech-Stack

- React 18, einzelne Komponente in `App.jsx` (~900 Zeilen, alles drin)
- Tailwind via CDN-Script in `index.html` (kein Build-Step für CSS — siehe TODO)
- `lucide-react` für Icons, `recharts` für den Stimmungs-Chart
- Bundling mit `esbuild` (`npm run build` → `bundle.js`)
- Persistenz: `localStorage`, kein Backend, keine Accounts (Daten bleiben auf
  dem Gerät der Person)
- Eine Vercel-Serverless-Funktion (`api/analyze.js`) für die KI-Analyse, hält
  den Anthropic-API-Key serverseitig

## Design-System (bei Änderungen bitte einhalten)

Farben und Schriften sind bewusst gewählt, nicht generisch — siehe Konstanten
`C` (Farben) und `G` (Verläufe) ganz oben in `App.jsx`. Vier Akzentfarben sind
funktional zugeordnet: Korall = Eintrag/Handlung, Salbei = Ziele/Wachstum,
Gold = Verlauf/Einsicht, Lavendel = Ruhe. Schrift: `Fraunces` (Display/Titel,
seriös-warm), `IBM Plex Sans` (Fliesstext), `IBM Plex Mono` (Daten, Labels,
Zahlen). Cremefarbener Hintergrund, runde Karten, keine harten Kanten. Bitte
keine neuen Farben einführen, ohne sie ins bestehende System einzupassen.

## Produktphilosophie (wichtig für Entscheidungen)

- Kein hartes Bestrafen bei verpassten Tagen — daher "Stärke in %" statt
  starrer Serie, die auf 0 zurückfällt (siehe `computeStrength`)
- Freemium: Standardfunktionen bleiben für immer gratis (lokal, keine
  laufenden Kosten). Einzige geplante Bezahlfunktion: die KI-Analyse, weil sie
  die einzige Funktion mit echten laufenden Kosten ist (API-Aufrufe).
- Datenschutz first: Daten bleiben primär lokal beim Nutzer. Cloud-Sync nur,
  wenn der Nutzer es aktiv will.

## Bekannte Lücken / TODOs, priorisiert

1. **Stripe/Bezahlschranke für die KI-Analyse** — aktuell rein visuell (ein
   "PRO"-Badge), jeder kann den Knopf drücken. Echte Abrechnung fehlt
   komplett. Das ist der wichtigste fehlende Baustein vor einem Launch mit
   echten Nutzern.
2. **Tailwind-Production-Build** — `index.html` lädt Tailwind aktuell per
   CDN-Script (`cdn.tailwindcss.com`). Funktioniert, ist aber nicht für
   Produktion gedacht (lädt bei jedem Seitenaufruf neu, kein Purging). Auf
   einen echten Build mit PostCSS/Tailwind-CLI umstellen.
3. **Cross-Device-Sync** — aktuell rein lokal (`localStorage`), Daten gehen
   beim Geräte- oder Browserwechsel verloren. Bräuchte ein echtes Backend
   (z. B. Supabase oder eine eigene API) plus simple Anmeldung (z. B. Magic
   Link, kein Passwort nötig).
4. **Web Speech API (Mikrofon-Diktat)** funktioniert nur in Chromium-Browsern
   zuverlässig, nicht in Safari/Firefox. Aktuell wird der Button einfach
   ausgeblendet, wenn die API fehlt (sauberer Fallback, kein Bug — aber für
   iPhone-Nutzer faktisch nie sichtbar, das sollte Sandro wissen).
5. **Tests** — keine vorhanden. Mindestens die Speicher-Logik
   (`saveEntries`, `saveGoals`, Merge-Verhalten bei Morgen/Abend) verdient
   Unit-Tests, bevor daran viel verändert wird.
6. **Ende-zu-Ende-Verschlüsselung** — wurde Sandro als Vertrauensmerkmal für
   später vorgeschlagen (vergleichbar mit Day One). Nicht dringend, aber auf
   dem Radar behalten, falls Cloud-Sync (Punkt 3) umgesetzt wird.
7. **App-Store-Distribution** — aktuell reine PWA (Web-App, "Zum
   Home-Bildschirm hinzufügen"). Falls ein echter App-Store-Eintrag gewünscht
   ist, eignet sich z. B. Capacitor, um dieselbe Codebasis zu verpacken.

## Befehle

```
npm install        # einmalig
npm run build       # baut bundle.js aus App.jsx + main.jsx
npm run watch        # baut automatisch neu bei Änderungen
npm run serve         # lokaler Test-Server
```

## Deployment

Siehe `README.md` — kurz: Vercel, erkennt `api/analyze.js` automatisch als
Serverless-Funktion, `ANTHROPIC_API_KEY` als Environment Variable setzen.
