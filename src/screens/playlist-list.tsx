import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PlaylistListView, type PlaylistLayout } from '../components/PlaylistListView';
import { useFetchOnHydrated } from '../hooks/useFetchOnHydrated';
import { onPullToRefresh } from '../services/dataSyncService';
import { musicCacheStore } from '../store/musicCacheStore';
import { offlineModeStore } from '../store/offlineModeStore';
import { playlistLibraryStore } from '../store/playlistLibraryStore';

export function PlaylistListScreen({
  layout = 'list',
  downloadedOnly = false,
  contentInsetTop = 0,
}: {
  layout?: PlaylistLayout;
  downloadedOnly?: boolean;
  contentInsetTop?: number;
}) {
  const { t } = useTranslation();
  const offlineMode = offlineModeStore((s) => s.offlineMode);
  const playlists = playlistLibraryStore((s) => s.playlists);
  const loading = playlistLibraryStore((s) => s.loading);
  const error = playlistLibraryStore((s) => s.error);

  const cachedItems = musicCacheStore((s) => s.cachedItems);

  // Fetch only after hydration so a cached library isn't re-fetched on mount.
  useFetchOnHydrated(playlistLibraryStore, () => {
    const s = playlistLibraryStore.getState();
    if (s.playlists.length === 0 && !s.loading) s.fetchAllPlaylists();
  });

  const filteredPlaylists = useMemo(() => {
    if (!downloadedOnly) return playlists;
    return playlists.filter((p) => p.id in cachedItems);
  }, [playlists, downloadedOnly, cachedItems]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onPullToRefresh('playlists');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const emptyProps = offlineMode
    ? {
        emptyIcon: 'cloud-offline-outline' as const,
        emptyMessage: t('noDownloadedPlaylists'),
        emptySubtitle: t('noDownloadedPlaylistsSubtitle'),
      }
    : {};

  return (
    <View style={styles.container}>
      <PlaylistListView
        playlists={filteredPlaylists}
        layout={layout}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        showAlphabetScroller
        scrollToTopTrigger={`${downloadedOnly}`}
        contentInsetTop={contentInsetTop}
        {...emptyProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
