# Innenschau — installierbare App

Das ist INNENSCHAU als eigenständige, installierbare Web-App (PWA) — nicht mehr nur eine Vorschau im Claude-Chat. Sobald sie online ist, kann jeder den Link öffnen und sich die App per "Zum Home-Bildschirm hinzufügen" wie eine normale App aufs Handy holen. Kein App Store, keine Wartezeit, keine Kosten für dich.

> Für Claude Code: Die Datei `CLAUDE.md` in diesem Ordner enthält den vollständigen Projektkontext, das Design-System und eine priorisierte Aufgabenliste — wird automatisch gelesen, wenn du Claude Code in diesem Ordner startest.

## Was schon funktioniert, sobald sie online ist

- Tägliche Einträge, Ziele, Mood-Kalender, Atemübung, Yoga, Musik-Liste, Suche, Export — alles läuft direkt im Browser, Daten bleiben lokal auf dem Gerät der Person (localStorage), genau wie im Prototyp.
- Installierbar auf iPhone (Safari → Teilen → "Zum Home-Bildschirm") und Android (Chrome fragt automatisch).

## Was noch einen weiteren Schritt braucht: die KI-Analyse

Die KI-Analyse kann nicht direkt aus dem Browser auf Claude zugreifen — ein API-Key darf nie im Code stehen, den jeder im Browser einsehen kann. Deshalb ruft der Knopf jetzt `/api/analyze` auf, eine kleine Funktion, die im Hintergrund auf einem Server läuft (Datei: `api/analyze.js`, schon fertig geschrieben). Du brauchst nur noch:

1. Einen Account bei [console.anthropic.com](https://console.anthropic.com), dort einen API-Key erstellen.
2. Beim Deployment (siehe unten) den Key als Umgebungsvariable `ANTHROPIC_API_KEY` hinterlegen.

Das ist der Punkt, an dem aus "gratis für immer" ein laufender Kostenpunkt wird — pro KI-Analyse fällt eine kleine Gebühr bei Anthropic an. Genau deshalb war das in unserem Freemium-Modell die Funktion hinter der Bezahlschranke.

## Deployment (kostenlos, ohne Server-Wissen)

Am einfachsten mit [Vercel](https://vercel.com) — erkennt dieses Projekt automatisch, inklusive der `api/`-Funktion:

1. Kostenlosen Account auf vercel.com erstellen.
2. Dieses Projekt als GitHub-Repo hochladen (oder direkt per `vercel`-CLI deployen, siehe unten).
3. Im Vercel-Projekt unter **Settings → Environment Variables**: `ANTHROPIC_API_KEY` mit deinem Key eintragen.
4. Deploy klicken. Du bekommst eine URL wie `innenschau.vercel.app` — die kannst du teilen.

Per Kommandozeile (falls du Claude Code nutzt, kann es das für dich ausführen):
```
npm install -g vercel
vercel
```

## Lokal testen, bevor du es online stellst

```
npm install
npm run build      # baut bundle.js aus App.jsx
npm run serve       # startet einen lokalen Server, Link öffnen
```

## Wenn du weiterbauen willst (z. B. mit Claude Code oder Lovable)

- `App.jsx` ist die komplette App-Logik — alles, was in den letzten Schritten gebaut wurde (Morgen/Abend, KI-Analyse, Mood-Kalender, Yoga, etc.).
- `npm run watch` baut automatisch neu, während du Änderungen machst.
- Eigener Domain-Name: in Vercel unter Settings → Domains, ein paar Klicks.
- Bezahlschranke für die KI-Analyse: aktuell rein optisch (PRO-Badge). Echte Zahlungen brauchen einen weiteren Schritt — sag Bescheid, dann bauen wir das als Nächstes (z. B. mit Stripe).
