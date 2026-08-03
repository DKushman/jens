#!/usr/bin/env python3
"""Baut public/kiez-map.svg aus OpenStreetMap-Daten (ODbL).

Die Karte zeigt den Wahlkreis 3 (Lichterfelde West / Zehlendorf Süd) minimalistisch:
Grünflächen, Wasser, Bahn und Hauptstraßen. Die Marker liegen als HTML über der
Karte – die Prozentwerte dafür gibt das Skript am Ende aus.

    python3 scripts/build-kiez-map.py [--refresh]

Ohne --refresh wird die Overpass-Antwort aus scripts/.cache/ wiederverwendet.
"""
from __future__ import annotations

import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request

# --- Kartenfenster: Nord-oben, Seitenverhältnis exakt 1000:700 --------------
LON0, LON1 = 13.239015, 13.327985
LAT1, LAT0 = 52.451035, 52.413035
W, H = 1000.0, 700.0

BBOX = '52.406,13.228,52.452,13.328'

# Marker: Namen und echte Koordinaten (OSM / Wikidata)
MARKERS = [
    ('S-Bahnhof Lichterfelde West', 52.4433056, 13.2935862),
    ('Ludwig-Beck-Platz', 52.4426820, 13.3120359),
    ('Schweizer Viertel', 52.4257147, 13.2967283),
    ('Platz des 4. Juli', 52.4207569, 13.2878185),
    ('Zehlendorf Süd', 52.4222000, 13.2600000),
]

ENDPOINTS = (
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
)

QUERY = f"""
[out:json][timeout:180];
(
  way["waterway"~"^(canal|river)$"]({BBOX});
  way["natural"="water"]({BBOX});
  rel["natural"="water"]({BBOX});
  way["railway"="rail"]["service"!~"."]({BBOX});
  way["highway"~"^(motorway|trunk|primary|secondary)$"]({BBOX});
  way["highway"~"^(tertiary|residential|unclassified|living_street|pedestrian)$"]({BBOX});
  way["leisure"="park"]({BBOX});
  way["landuse"~"^(cemetery|forest|allotments)$"]({BBOX});
  way["natural"="wood"]({BBOX});
  rel["leisure"="park"]({BBOX});
  rel["landuse"~"^(cemetery|forest)$"]({BBOX});
);
out geom tags;
"""

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'scripts', '.cache', 'kiez-osm.json')
TARGET = os.path.join(ROOT, 'public', 'kiez-map.svg')


def fetch() -> dict:
    if '--refresh' not in sys.argv and os.path.exists(CACHE):
        return json.load(open(CACHE, encoding='utf-8'))
    body = urllib.parse.urlencode({'data': QUERY}).encode()
    error = None
    for endpoint in ENDPOINTS:
        try:
            request = urllib.request.Request(
                endpoint, data=body, headers={'User-Agent': 'jens-hoffmann-site/kiez-map'})
            with urllib.request.urlopen(request, timeout=240) as response:
                payload = json.load(response)
            os.makedirs(os.path.dirname(CACHE), exist_ok=True)
            json.dump(payload, open(CACHE, 'w', encoding='utf-8'))
            return payload
        except Exception as exc:  # noqa: BLE001 – Mirror durchprobieren
            error = f'{endpoint}: {exc}'
            print(error, file=sys.stderr)
            time.sleep(3)
    raise SystemExit(f'Overpass nicht erreichbar – {error}')


def project(lon: float, lat: float) -> tuple[float, float]:
    return ((lon - LON0) / (LON1 - LON0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H)


def simplify(points, epsilon):
    """Ramer-Douglas-Peucker – hält die Pfaddaten klein."""
    if len(points) < 3:
        return points
    (ax, ay), (bx, by) = points[0], points[-1]
    dx, dy = bx - ax, by - ay
    norm = math.hypot(dx, dy)
    index, furthest = 0, -1.0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        distance = (math.hypot(px - ax, py - ay) if norm == 0
                    else abs(dy * (px - ax) - dx * (py - ay)) / norm)
        if distance > furthest:
            index, furthest = i, distance
    if furthest > epsilon:
        return simplify(points[:index + 1], epsilon)[:-1] + simplify(points[index:], epsilon)
    return [points[0], points[-1]]


PAD = 60.0


def to_path(points, close: bool) -> str:
    """Ganzzahlige Relativkoordinaten – 1 Einheit ≈ 6 m, das genügt für die Anzeige
    und halbiert die Dateigröße gegenüber Dezimalwerten."""
    x, y = round(points[0][0]), round(points[0][1])
    parts = [f'M{x} {y}']
    for px, py in points[1:]:
        dx, dy = round(px) - x, round(py) - y
        if dx == 0 and dy == 0:
            continue
        parts.append(f'l{dx} {dy}')
        x, y = x + dx, y + dy
    if len(parts) == 1:
        return ''
    if close:
        parts.append('z')
    return ''.join(parts)


def rings(element):
    if element['type'] == 'way':
        geometry = element.get('geometry') or []
        return [[project(p['lon'], p['lat']) for p in geometry if p]]
    out = []
    for member in element.get('members', []):
        if member.get('role') not in ('outer', '', None):
            continue
        geometry = member.get('geometry')
        if geometry:
            out.append([project(p['lon'], p['lat']) for p in geometry if p])
    return out


def layer(elements, match, epsilon, close, min_span=0.0) -> str:
    paths = []
    for element in elements:
        tags = element.get('tags', {})
        if not match(tags):
            continue
        for points in rings(element):
            if len(points) < 2:
                continue
            if not any(-PAD <= x <= W + PAD and -PAD <= y <= H + PAD for x, y in points):
                continue
            points = simplify(points, epsilon)
            if len(points) < 2:
                continue
            xs = [p[0] for p in points]
            ys = [p[1] for p in points]
            if max(xs) - min(xs) < min_span and max(ys) - min(ys) < min_span:
                continue
            path = to_path(points, close)
            if path:
                paths.append(path)
    return ''.join(paths)


INK = '#e9e7e2'
ACCENT = '#52B7C1'


def build(elements) -> str:
    plots = layer(elements, lambda t: t.get('landuse') == 'allotments', 5.0, True, 34)
    green = layer(elements, lambda t: (
        t.get('leisure') == 'park' or t.get('landuse') in ('forest', 'cemetery')
        or t.get('natural') == 'wood'), 4.5, True, 30)
    lakes = layer(elements, lambda t: t.get('natural') == 'water', 3.0, True, 16)
    canals = layer(elements, lambda t: t.get('waterway') in ('canal', 'river'), 2.2, False)
    rail = layer(elements, lambda t: t.get('railway') == 'rail', 2.0, False, 10)
    streets = layer(elements, lambda t: t.get('highway') in
                    ('tertiary', 'residential', 'unclassified', 'living_street',
                     'pedestrian'), 3.0, False, 4)
    roads = layer(elements, lambda t: t.get('highway') == 'secondary', 2.4, False, 6)
    trunks = layer(elements, lambda t: t.get('highway') in
                   ('primary', 'trunk', 'motorway'), 2.4, False, 6)

    for name, data in (('Kleingärten', plots), ('Grün', green), ('Seen', lakes),
                       ('Kanäle', canals), ('Bahn', rail), ('Nebenstraßen', streets),
                       ('Straßen', roads), ('Hauptstraßen', trunks)):
        print(f'  {name:14s} {len(data) / 1024:5.1f} KB')

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {int(W)} {int(H)}" width="{int(W)}" height="{int(H)}">
<defs>
<clipPath id="frame"><rect x="1" y="1" width="{int(W) - 2}" height="{int(H) - 2}" rx="26"/></clipPath>
<pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="{INK}" fill-opacity=".05"/></pattern>
</defs>
<g clip-path="url(#frame)">
<rect width="{int(W)}" height="{int(H)}" fill="#141413"/>
<rect width="{int(W)}" height="{int(H)}" fill="url(#grid)"/>
<path d="{plots}" fill="{INK}" fill-opacity=".03"/>
<path d="{green}" fill="{INK}" fill-opacity=".07"/>
<path d="{lakes}" fill="{ACCENT}" fill-opacity=".28"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="{streets}" stroke="{INK}" stroke-opacity=".1" stroke-width="1"/>
<path d="{roads}" stroke="{INK}" stroke-opacity=".2" stroke-width="1.6"/>
<path d="{trunks}" stroke="{INK}" stroke-opacity=".32" stroke-width="2.4"/>
<path d="{canals}" stroke="{ACCENT}" stroke-opacity=".45" stroke-width="3.6"/>
<path d="{rail}" stroke="{INK}" stroke-opacity=".34" stroke-width="1.4" stroke-dasharray="9 7"/>
</g>
</g>
<rect x="1" y="1" width="{int(W) - 2}" height="{int(H) - 2}" rx="26" fill="none" stroke="{INK}" stroke-opacity=".12" stroke-width="1.5"/>
</svg>
'''


def main() -> None:
    elements = fetch()['elements']
    print(f'OSM-Elemente: {len(elements)}')
    svg = build(elements)
    os.makedirs(os.path.dirname(TARGET), exist_ok=True)
    open(TARGET, 'w', encoding='utf-8').write(svg)
    print(f'\n{os.path.relpath(TARGET, ROOT)} – {len(svg.encode()) / 1024:.1f} KB\n')

    metres = (LON1 - LON0) * 111320 * math.cos(math.radians((LAT0 + LAT1) / 2))
    print(f'Kartenbreite ≈ {metres:.0f} m · 500 m ≈ {500 / metres * 100:.2f}%')
    for name, lat, lon in MARKERS:
        x, y = project(lon, lat)
        print(f'  {name:30s} --x: {x / W * 100:.2f}%; --y: {y / H * 100:.2f}%')


if __name__ == '__main__':
    main()
