import { KNOWN_LOCALITIES, type Locality } from "./localities";

export type CityGeoRow = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
};

export type GeoPoint = { lat: number; lng: number };

export type LocalityMatch = {
  name: string;
  lat: number;
  lng: number;
  index: number;
  matchedLength: number;
};

function localityToken(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Odległość w km (Haversine). */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function findNearestCityId(point: GeoPoint, cities: CityGeoRow[]): string | undefined {
  if (cities.length === 0) return undefined;

  let best: { id: string; dist: number } | undefined;
  for (const city of cities) {
    const dist = haversineKm(point, { lat: city.lat, lng: city.lng });
    if (!best || dist < best.dist) {
      best = { id: city.id, dist };
    }
  }
  return best?.id;
}

/** Szuka znanej miejscowości w tekście (najdłuższe dopasowanie tokenu). */
export function findLocalityInText(text: string): LocalityMatch | undefined {
  let best: LocalityMatch | undefined;

  for (const loc of KNOWN_LOCALITIES) {
    for (const token of loc.tokens) {
      const re = new RegExp(escapeRegex(token), "i");
      const m = text.match(re);
      if (!m || m.index === undefined) continue;
      const len = m[0].length;
      if (!best || len > best.matchedLength) {
        best = {
          name: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          index: m.index,
          matchedLength: len,
        };
      }
    }
  }

  return best;
}

/** Dopasowanie miejscowości po surowej nazwie (np. pole city z TM). */
export function matchLocalityByName(name: string): Locality | undefined {
  const token = localityToken(name.trim());
  if (!token) return undefined;

  let best: Locality | undefined;
  for (const loc of KNOWN_LOCALITIES) {
    for (const t of loc.tokens) {
      const lt = localityToken(t);
      if (token === lt || token.includes(lt) || lt.includes(token)) {
        if (!best || lt.length > localityToken(best.name).length) {
          best = loc;
        }
      }
    }
  }
  return best;
}

export function coordsFromText(text: string): GeoPoint | undefined {
  const hit = findLocalityInText(text);
  if (hit) return { lat: hit.lat, lng: hit.lng };
  return undefined;
}
