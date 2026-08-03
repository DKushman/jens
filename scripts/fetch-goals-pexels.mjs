/*
 * Lädt 7 Ziele-Bilder einmalig von Pexels nach public/goals/ und schreibt goals.json.
 *
 *   PEXELS_API_KEY=… node scripts/fetch-goals-pexels.mjs
 *
 * Schlüssel nie committen. Nach Weitergabe rotieren: https://www.pexels.com/api/
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error('Fehlt: PEXELS_API_KEY als Umgebungsvariable setzen.');
  process.exit(1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public/goals');

const GOALS = [
  { id: '01', query: 'apartment building construction urban housing', alt: 'Wohnraum schaffen' },
  { id: '02', query: 'local market street shops neighborhood', alt: 'Wirtschaft im Kiez' },
  { id: '03', query: 'public transport bus train city mobility', alt: 'Mobilität ohne Ideologie' },
  { id: '04', query: 'hospital medical research science laboratory', alt: 'Gesundheit und Wissenschaft' },
  { id: '05', query: 'clean safe city street neighborhood', alt: 'Sauber und sicher' },
  { id: '06', query: 'school children sports playground education', alt: 'Bildung und Sport' },
  { id: '07', query: 'theater culture art performance concert', alt: 'Kultur fördern' },
];

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const manifest = [];

for (const goal of GOALS) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(goal.query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: KEY } }
  );
  if (!res.ok) {
    console.error(`✗ Ziel ${goal.id}: API-Fehler ${res.status}`);
    continue;
  }

  const data = await res.json();
  const photo = data.photos?.[0];
  if (!photo) {
    console.error(`✗ Ziel ${goal.id}: kein Treffer für "${goal.query}"`);
    continue;
  }

  const cardFile = `goals/goal-${goal.id}-card.jpg`;
  const hoverFile = `goals/goal-${goal.id}.jpg`;

  const cardBuf = await download(photo.src.medium || photo.src.large);
  const hoverBuf = await download(photo.src.large2x || photo.src.large);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(ROOT, 'public', cardFile), cardBuf);
  await writeFile(join(ROOT, 'public', hoverFile), hoverBuf);

  manifest.push({
    alt: goal.alt,
    cardSrc: `/${cardFile}`,
    hoverSrc: `/${hoverFile}`,
    width: photo.width,
    height: photo.height,
    credit: `${photo.photographer} / Pexels`,
  });

  console.log(`✓ Ziel ${goal.id}  (${photo.photographer}, pexels.com)`);
}

await writeFile(join(ROOT, 'src/data/goals.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('\nFertig → public/goals/ + src/data/goals.json');
