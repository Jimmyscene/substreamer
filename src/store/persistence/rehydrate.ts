import { albumDetailStore } from '../albumDetailStore';
import { completedScrobbleStore } from '../completedScrobbleStore';
import { imageCacheStore } from '../imageCacheStore';
import { imageDownloadQueueStore } from '../imageDownloadQueueStore';
import { musicCacheStore } from '../musicCacheStore';
import { pendingScrobbleStore } from '../pendingScrobbleStore';
import { songIndexStore } from '../songIndexStore';

export interface RehydrationResult {
  succeeded: string[];
  failed: Array<{ store: string; error: string }>;
}

/**
 * Single entry point for rehydrating every per-row SQLite-backed Zustand
 * store. Each store hydrates in its own try/catch so a corrupt row in one
 * store cannot block the others from loading; the caller receives a
 * structured result describing which succeeded and which failed.
 *
 * Called from exactly two sites: the `rehydrated && isLoggedIn` useEffect
 * in `src/app/_layout.tsx` and the splash post-migration callback in
 * `src/components/AnimatedSplashScreen.tsx`. Both calls are idempotent —
 * each store's `hydrateFromDb()` re-reads the current SQL state and
 * replaces its in-memory mirror, safe under our write-through semantics.
 *
 * Each store hydrates independently — no FK-style dependency between them —
 * so they run **concurrently** via `Promise.all`. The per-store SQLite reads
 * (`getAllAsync`/`getFirstAsync`) execute on expo-sqlite's background IO
 * thread, and the JS-side JSON.parse / row-mapping is chunked with
 * `setTimeout(0)` yields inside each `hydrateFromDbAsync`, so boot hydration
 * never blocks the JS thread for long even on a large library. Concurrent
 * reads queue on the native IO dispatcher; correctness is unaffected because
 * each store writes only its own slice of state.
 *
 * Each store hydrates in its own try/catch so a corrupt row in one store
 * cannot block the others; the caller receives a structured result.
 *
 * **Not exported from `./index.ts`.** This module imports stores; stores
 * import from `./index.ts` for table helpers. Re-exporting here would
 * create a cycle. Consumers import directly from
 * `'../store/persistence/rehydrate'`.
 *
 * kvStorage-backed stores (favorites, ratings, theme, etc.) aren't covered
 * by this helper — Zustand's `persist` middleware auto-rehydrates them on
 * store creation.
 */
export async function rehydrateAllStores(): Promise<RehydrationResult> {
  const result: RehydrationResult = { succeeded: [], failed: [] };
  const stores: Array<[string, () => Promise<void>]> = [
    ['albumDetail', () => albumDetailStore.getState().hydrateFromDbAsync()],
    ['songIndex', () => songIndexStore.getState().hydrateFromDbAsync()],
    ['completedScrobble', () => completedScrobbleStore.getState().hydrateFromDbAsync()],
    ['pendingScrobble', () => pendingScrobbleStore.getState().hydrateFromDbAsync()],
    ['musicCache', () => musicCacheStore.getState().hydrateFromDbAsync()],
    ['imageCache', () => imageCacheStore.getState().hydrateFromDbAsync()],
    ['imageDownloadQueue', () => imageDownloadQueueStore.getState().hydrateFromDbAsync()],
  ];
  await Promise.all(
    stores.map(async ([name, hydrate]) => {
      try {
        await hydrate();
        result.succeeded.push(name);
      } catch (e) {
        result.failed.push({
          store: name,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }),
  );
  if (result.failed.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('[rehydrateAllStores] partial failure', result.failed);
  }
  // The songs-library list is built by `initSongLibrary` (called from the
  // deferred-startup chain, after the data-load/refresh tasks settle) and then
  // kept current by optimistic in-memory patches from `songIndexStore` writes —
  // no full rebuild on every album-detail sync.
  return result;
}
