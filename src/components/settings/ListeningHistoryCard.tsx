import Ionicons from '@react-native-vector-icons/ionicons/static';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../hooks/useTheme';
import { settingsStyles } from '../../styles/settingsStyles';
import { completedScrobbleStore } from '../../store/completedScrobbleStore';
import { pendingScrobbleStore } from '../../store/pendingScrobbleStore';
import { scrobbleExclusionStore } from '../../store/scrobbleExclusionStore';
import { SettingsSectionTitle } from './SettingsSectionTitle';

export function ListeningHistoryCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const pendingScrobbleCount = pendingScrobbleStore((s) => s.pendingScrobbles.length);
  const completedScrobbleCount = completedScrobbleStore((s) => s.completedScrobbles.length);
  const scrobbleExclusionCount = scrobbleExclusionStore((s) =>
    Object.keys(s.excludedAlbums).length +
    Object.keys(s.excludedArtists).length +
    Object.keys(s.excludedPlaylists).length,
  );

  return (
    <View style={settingsStyles.section}>
      <SettingsSectionTitle>{t('listeningHistory')}</SettingsSectionTitle>
      <View style={[settingsStyles.card, settingsStyles.cardPadded, { backgroundColor: colors.card }]}>
        <View style={[settingsStyles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[settingsStyles.infoLabel, { color: colors.textPrimary }]}>{t('pendingScrobbles')}</Text>
          <Text style={[settingsStyles.infoValue, { color: colors.textSecondary }]}>
            {pendingScrobbleCount}
          </Text>
        </View>
        <View style={[settingsStyles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[settingsStyles.infoLabel, { color: colors.textPrimary }]}>{t('completedScrobbles')}</Text>
          <Text style={[settingsStyles.infoValue, { color: colors.textSecondary }]}>
            {completedScrobbleCount}
          </Text>
        </View>
        <View style={[settingsStyles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[settingsStyles.infoLabel, { color: colors.textPrimary }]}>{t('scrobbleExclusions')}</Text>
          <Text style={[settingsStyles.infoValue, { color: colors.textSecondary }]}>
            {scrobbleExclusionCount}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/scrobble-browser')}
          style={({ pressed }) => [
            settingsStyles.navRow,
            { borderTopColor: colors.border },
            pressed && settingsStyles.pressed,
          ]}
        >
          <View style={settingsStyles.navRowLeft}>
            <Ionicons name="list-outline" size={18} color={colors.textPrimary} />
            <Text style={[settingsStyles.navRowText, { color: colors.textPrimary }]}>
              {t('browseScrobbles')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/scrobble-exclusion-browser')}
          style={({ pressed }) => [
            settingsStyles.navRow,
            { borderTopColor: colors.border },
            pressed && settingsStyles.pressed,
          ]}
        >
          <View style={settingsStyles.navRowLeft}>
            <Ionicons name="eye-off-outline" size={18} color={colors.textPrimary} />
            <Text style={[settingsStyles.navRowText, { color: colors.textPrimary }]}>
              {t('manageExclusions')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
