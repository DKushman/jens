/*
 * Lädt echte Platzhalter-Fotos von der Pexels-API in /public.
 * Lokal ausführen (Node 18+):
 *
 *   PEXELS_API_KEY=dein_schluessel node scripts/fetch-images.mjs
 *
 * WICHTIG: Den Schlüssel NIE ins Repo committen und NIE im Frontend
 * einbauen. Nach Weitergabe (z. B. im Chat) unbedingt rotieren:
 * https://www.pexels.com/api/
 */

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error('Fehlt: PEXELS_API_KEY als Umgebungsvariable setzen.');
  process.exit(1);
}

// Zieldatei -> Suchbegriff (bewusst generisch, Fotos sind Platzhalter)
const JOBS = [
  ['public/portrait.jpg', 'man portrait suit professional'],
  ['public/portrait2.jpg', 'man talking conversation street'],
  ['public/kiez.jpg', 'berlin street residential'],
  ['public/kiez2.jpg', 'berlin neighborhood houses'],
  ['public/spots/spot-1.jpg', 's-bahn station berlin'],
  ['public/spots/spot-2.jpg', 'berlin residential quarter'],
  ['public/spots/spot-3.jpg', 'city park meadow'],
  ['public/spots/spot-4.jpg', 'park path trees'],
  ['public/spots/spot-5.jpg', 'canal water city'],
  ['public/bento-1.jpg', 'walking neighborhood street candid'],
  ['public/bento-2.jpg', 'playing cards books table'],
];

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

for (const [file, query] of JOBS) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: KEY } }
  );
  if (!res.ok) {
    console.error(`✗ ${file}: API-Fehler ${res.status}`);
    continue;
  }
  const data = await res.json();
  const photo = data.photos?.[0];
  if (!photo) {
    console.error(`✗ ${file}: kein Treffer für "${query}"`);
    continue;
  }
  const img = await fetch(photo.src.large2x || photo.src.large);
  const buf = Buffer.from(await img.arrayBuffer());
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, buf);
  console.log(`✓ ${file}  (Foto: ${photo.photographer}, pexels.com)`);
}

console.log('\nFertig. Danach in index.html die .svg-Pfade auf .jpg umstellen.');
console.log('Tipp: Bilder anschließend zu WebP konvertieren (kleiner + schneller).');
