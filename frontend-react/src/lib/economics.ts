import { haversineKm } from "./geo";
import type { CatchRecord } from "@/types/api";

// Indicative Indian wholesale/retail market rates (₹/kg) — not a live feed.
// Update for your local market; used only to turn logged catch weight into
// a rough trip-value estimate, never presented as a real-time price.
export const SPECIES_PRICE_INR_PER_KG: Record<string, number> = {
  "Indian Mackerel": 150,
  "Oil Sardine": 90,
  "Silver Pomfret": 500,
  "Pomfret": 500,
  "Seer Fish": 650,
  "Indo-Pacific Seer Fish": 650,
  "Yellowfin Tuna": 220,
  "Skipjack Tuna": 180,
  "Giant Tiger Prawn": 450,
  "Tiger Prawn": 450,
  "Hilsa Shad": 600,
};
export const DEFAULT_SPECIES_PRICE_INR_PER_KG = 200;

export function priceForSpecies(name: string | null): number {
  if (!name) return DEFAULT_SPECIES_PRICE_INR_PER_KG;
  return SPECIES_PRICE_INR_PER_KG[name] ?? DEFAULT_SPECIES_PRICE_INR_PER_KG;
}

// Indicative diesel price + consumption for a small mechanized fishing boat.
// Consumption rises with speed (drag); both are editable ballparks, not telemetry.
export const FUEL_PRICE_INR_PER_L = 96;
export const FUEL_RATE_L_PER_KM: Record<number, number> = { 5: 0.14, 8: 0.20, 12: 0.30 };

export function estimateFuelCostInr(oneWayKm: number, speedKn: number): number {
  const rate = FUEL_RATE_L_PER_KM[speedKn] ?? 0.20;
  const roundTripKm = oneWayKm * 2;
  return Math.round(roundTripKm * rate * FUEL_PRICE_INR_PER_L);
}

export interface ZoneYieldStats {
  count: number;
  totalKg: number;
  avgKg: number;
  topSpecies: string | null;
  sinceDays: number;
  radiusKm: number;
}

// Aggregates real logged catches (the blockchain ledger) near a zone — turns a
// fisher's own reporting into decision support for the next trip. Empty when
// nobody has logged nearby yet; never backfilled with synthetic numbers.
export function computeZoneYield(
  records: CatchRecord[],
  center: { lat: number; lon: number },
  radiusKm = 25,
  sinceDays = 60
): ZoneYieldStats {
  const cutoff = Date.now() - sinceDays * 86_400_000;
  const nearby = records.filter((r) => {
    const t = new Date(r.event_timestamp).getTime();
    if (Number.isNaN(t) || t < cutoff) return false;
    return haversineKm(center.lat, center.lon, r.latitude, r.longitude) <= radiusKm;
  });

  const totalKg = nearby.reduce((s, r) => s + r.quantity_kg, 0);
  const bySpecies = new Map<string, number>();
  for (const r of nearby) bySpecies.set(r.species_name, (bySpecies.get(r.species_name) ?? 0) + r.quantity_kg);
  let topSpecies: string | null = null;
  let topKg = -1;
  for (const [name, kg] of bySpecies) {
    if (kg > topKg) { topKg = kg; topSpecies = name; }
  }

  return {
    count: nearby.length,
    totalKg: Math.round(totalKg),
    avgKg: nearby.length > 0 ? Math.round(totalKg / nearby.length) : 0,
    topSpecies,
    sinceDays,
    radiusKm,
  };
}
