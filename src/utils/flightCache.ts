// frontend/src/utils/flightCache.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { get, set } from 'idb-keyval';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type FlightSearchParams = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  tripType: 'one-way' | 'round-trip';
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
};

type CachedResult = {
  timestamp: number;
  result: any; // The API response
};

function makeCacheKey(params: FlightSearchParams) {
  return `flightsearch:${JSON.stringify(params)}`;
}

export async function getCachedFlightResults(params: FlightSearchParams): Promise<any | null> {
  const key = makeCacheKey(params);
  const cached: CachedResult | undefined = await get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
  return cached.result;
}

export async function setCachedFlightResults(params: FlightSearchParams, result: any) {
  const key = makeCacheKey(params);
  const cacheValue: CachedResult = {
    timestamp: Date.now(),
    result
  };
  await set(key, cacheValue);
}