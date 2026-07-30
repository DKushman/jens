# Jens Hoffmann – Kampagnen-Website

Vanilla HTML + CSS + Vite. `src/main.js` enthält ausschließlich Eventlistener
(Karte + Scroll-Fallback) – alles Visuelle läuft in reinem CSS.

## Starten

```bash
npm install
npm run dev      # Entwicklung (http://localhost:5173)
npm run build    # Produktions-Build nach /dist
npm run preview  # Build lokal testen
```

## Sektionen

1. **Hero** – Name erscheint mittig, fährt nach oben, Bild öffnet sich wie
   ein Fenster von unten nach oben (Vorhang per `scaleY`).
2. **Manifest** (Cosmos-Stil) – drei fette Anton-Zeilen schieben sich beim
   Scrollen abwechselnd von links und rechts herein.
3. **Projekte** (A24-Stil) – riesige Textzeilen mit Jahres-Superscript,
   Hover schiebt die Zeile leicht nach rechts.
4. **Werdegang** (Apollo-Stil) – Mittellinie wächst scroll-getrieben mit,
   Stationen faden Punkt für Punkt ein, Jahre in Türkis.
5. **Wahlkreis-Karte** (Manus-Stil) – Punktraster-SVG, 5 türkise Orte.
   Desktop: Hover/Fokus zeigt Foto-Karte am Punkt. Mobil: Tap öffnet das
   Bild an genau dieser Stelle, zweiter Tap/Escape/Klick daneben schließt.
6. **Kontakt + Footer** (TinyWins-Stil) – „Sprechen wir." + Mail-Link,
   Link-Spalten, darunter riesige, unten angeschnittene Wortmarke.

## Scroll-Animationen: view() + Fallback

- **Modern (Chrome, Edge, neuere Safari/Firefox):** reine CSS
  Scroll-Driven Animations über `animation-timeline: view()` – laufen
  off-main-thread, kein einziges JS-Event beim Scrollen.
- **Fallback:** `main.js` prüft einmalig
  `CSS.supports('animation-timeline: view()')`. Nur wenn das fehlt, wird
  `html.io` gesetzt und EIN IntersectionObserver aktiviert. Jedes Element
  wird nach dem ersten Sichtbarwerden per `unobserve` freigegeben –
  danach entstehen null laufende Kosten.
- **Ohne JS / uralte Browser:** Basiszustand ist „sichtbar", die Seite
  funktioniert immer.
- `prefers-reduced-motion` deaktiviert alles und zeigt das fertige Layout.

## Performance-Entscheidungen

- Nur `transform` + `opacity` werden animiert (Compositor-only).
- Keine Endlos-Animationen – der Karten-Halo ist ein statischer Schatten.
- `content-visibility: auto` auf allen Sektionen unter dem Fold:
  Rendering wird übersprungen, bis die Sektion in die Nähe scrollt.
- Karte: 1 Inline-SVG (Pattern + Clip-Path), keine Map-Library, keine
  Tiles, kein iframe. Punkte sind echte `<button>` (Tastatur + Screenreader).
- Spot-Bilder: `loading="lazy"` + feste `width`/`height` (kein CLS) –
  laden erst, wenn die Karte in Sicht kommt.
- Hover-Regeln nur unter `@media (hover: hover)` – Touch-Geräte bekommen
  sauberes Tap-Verhalten ohne Hover-Geister.

## Inhalte ersetzen

- **Porträt:** `public/portrait.jpg` ablegen, `src` in `index.html` ändern.
- **Karten-Fotos:** `public/spots/spot-1…5.svg` durch kleine WebP-Dateien
  (~560×360, 30–60 KB) ersetzen und `src`-Attribute anpassen.
- **Orte/Koordinaten:** Position der Punkte über `--x`/`--y` am
  `<li class="map__spot">`; Wahlkreis-Umriss ist stilisiert und kann durch
  einen echten Pfad im `clipPath` ersetzt werden.
- **Werdegang/Projekte:** Beispieltexte in `index.html` sind Platzhalter.
- **Impressum/Datenschutz:** Links im Footer auf echte Seiten zeigen lassen
  (für eine Kandidaten-Seite Pflicht).

## Hinweise zu Inhalten (bitte prüfen!)

- **Schreibweise:** Überall auf „Jens Hoffmann" (zwei n) umgestellt,
  da der Brief so unterschreibt.
- **Werdegang-Jahre 2005 und 2012 sind abgeleitet** („über 20 Jahre im
  Kiez", „14 Jahre Bundeskanzleramt") – bitte durch echte Jahre ersetzen.
- **Signatur:** Schriftzug in „Mrs Saint Delafield" mit Schreib-Wipe beim
  Scrollen. Wer eine echte eingescannte Unterschrift hat: als SVG/WebP
  einsetzen und den Wipe-Effekt beibehalten.
- **Foto-Band:** `public/kiez.svg` durch echtes Kiez-Foto (WebP, ~1600px,
  100–200 KB) ersetzen; wird per CSS in S/W gesetzt.
- **Footer:** absichtlich ohne Scroll-Animation – die 15vw-Wortmarke wird
  nie zur Compositor-Ebene promotet und kann daher nicht laggen.

## Update: Redesign mit Hell/Dunkel-Rhythmus (v3)

**Neuer Seitenaufbau:** Hero (hell) → Manifest (schwarz) → Statement mit
Wort-für-Wort-Reveal (hell) → randloses Parallax-Bild-Band → Zur Person
(Karte überlappt das Band) → Ziele (schwarz) → Werdegang (hell) →
Programa-Break → Wahlkreis-Karte (schwarz, volle Breite) → Brief-Auszug +
Signatur (hell, asymmetrisch) → CTA Wahlaufruf (Türkis) → Curtain-Footer.

- **Curtain-Footer:** `position: fixed` hinter der Seite (`.site` hat
  `z-index: 1` + `margin-bottom: var(--footer-h)`). Er wird rein durchs
  Scrollen freigelegt – null Animationskosten, kann nicht laggen.
  Höhe über `--footer-h` in den Tokens.
- **Wort-Reveal (Sunny-Bonnell-Stil):** Jedes Wort steckt in einer
  overflow-clip-Maske und steigt von unten auf. Stagger über den
  Wort-Index `--wi` im `animation-range` (scroll-getrieben) bzw. über
  `transition-delay` im IO-Fallback.
- **CTA-Sektion (#wahl):** Letzte scrollende Sektion, verlinkt auf
  https://www.berlin.de/wahlen/ (Wahllokal & Briefwahl).
- **Karte:** volle Viewportbreite auf Schwarz, Punktraster angepasst.
- **Neue Platzhalter:** `public/kiez2.svg`, `public/portrait2.svg`.
- **Topbar-Anker "Kontakt"** zeigt auf einen 1px-Anker am Seitenende
  (fixe Elemente sind keine Scroll-Ziele) und legt so den Footer frei.

## Update v4: Flow-Redesign

- **Deck-Stacking:** Hero und Zahlen-Sektion bleiben sticky stehen,
  Manifest bzw. Bento schieben sich als Ebene darüber (`.deck`).
- **Growing Slabs:** Ziele, Karte und CTA docken beim Reinscrollen an –
  die Hintergrund-Ebene (`.slab::before`) wächst per scale auf volle
  Breite (compositor-only), der Radius verschwindet dabei aus dem Bild.
- **#kiezfüralle-Band:** riesiges Anton-Band zwischen Zielen und
  Werdegang, fährt scroll-getrieben nach links – kein Endlos-Loop.
- **Werdegang = Going-Journey:** getönte Karten (eine in Türkis) versetzt
  an einem dicken, weichen Weg, der sich beim Scrollen zeichnet.
  Mobil: Karten stapeln sich, der Weg wird ausgeblendet.
- **Galerie (Nite-Riot-Stil):** verstreute, gedrehte Fotos mit
  individueller Parallax-Stärke (`--d` je Foto). Mobil: 2er-Raster.
  Nutzt vorhandene Platzhalter – echte Fotos einfach ersetzen.
- **Hintergrund-Morph:** die Werdegang-Sektion färbt sich beim
  Durchscrollen mint (reine Opacity-Ebene).
- **Fullscreen-Menü:** mobil ersetzt ein Burger die Topbar-Links;
  Overlay mit gestaffelten Anton-Links (1 Toggle-Listener, Rest CSS).
- Mehr Parallaxe: stärkere Bild-Band-Drift, Pfeil im Statement,
  kippender Koffer im Bento.
