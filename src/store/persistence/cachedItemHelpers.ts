import {
  type CachedItemRow,
  type DownloadQueueRow,
} from './musicCacheTables';

/**
 * True when an album `cached_items` row represents a partial download —
 * fewer songs on disk than the album actually contains.
 *
 * `expectedSongCount` is authoritative: `ensurePartialAlbumEdge` now
 * fetches the album from the server when the album-detail store doesn't
 * yet have it, so the count always reflects the real album size. No
 * heuristic is needed to distinguish a real single-track album from a
 * fallback estimate — fixes #159.
 *
 * Songs and playlists never classify as partial — songs are 1/1 by
 * definition, playlists download atomically in v2.
 */
export function isPartialAlbum(item: CachedItemRow): boolean {
  if (item.type !== 'album') return false;
  return item.songIds.length < item.expectedSongCount;
}

/** Convenience inverse of `isPartialAlbum` for albums. */
export function isCompleteAlbum(item: CachedItemRow): boolean {
  return item.type === 'album' && !isPartialAlbum(item);
}

interface MinimalAlbum {
  id: string;
}

/**
 * Predicate shared by every screen that exposes a "Downloaded" album filter.
 * An album passes iff it has a `cached_items` entry, and — when
 * `includePartial` is false — is not a partial download. Centralizing this
 * keeps the filter behaviour consistent across home, library, favorites,
 * search, and the artist list.
 */
export function albumPassesDownloadedFilter(
  album: MinimalAlbum,
  cachedItems: Record<string, CachedItemRow>,
  includePartial: boolean,
): boolean {
  const item = cachedItems[album.id];
  if (!item) return false;
  if (!includePartial && isPartialAlbum(item)) return false;
  return true;
}

/**
 * Compute album-level progress `(completed, total)` for a download queue
 * item. When the item's target already has a `cached_items` entry (top-up
 * flow), the display should read as `(existing + delta) / expectedSongCount`
 * — e.g. a 5-of-10 partial album progresses 5/10 → 10/10 even though the
 * queue row itself only tracks the 0/5 delta. Fresh downloads collapse to
 * the queue row's raw `completedSongs / totalSongs`.
 */
export function computeQueueItemProgress(
  queueItem: DownloadQueueRow,
  cachedItems: Record<string, CachedItemRow>,
): { completed: number; total: number } {
  const existing = cachedItems[queueItem.itemId];
  if (existing) {
    return {
      completed: existing.songIds.length + queueItem.completedSongs,
      total: existing.expectedSongCount,
    };
  }
  return { completed: queueItem.completedSongs, total: queueItem.totalSongs };
}
