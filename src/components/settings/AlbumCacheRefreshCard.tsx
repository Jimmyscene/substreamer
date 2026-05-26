import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../hooks/useTheme';
import { settingsStyles } from '../../styles/settingsStyles';
import {
  playbackSettingsStore,
  type MetadataRefreshThreshold,
} from '../../store/playbackSettingsStore';
import { DropdownRow, type DropdownOption } from './DropdownRow';
import { SettingsSectionTitle } from './SettingsSectionTitle';

const OPTION_KEYS: { value: MetadataRefreshThreshold; labelKey: string }[] = [
  { value: 'always', labelKey: 'albumCacheRefreshAlways' },
  { value: '1day', labelKey: 'albumCacheRefresh1day' },
  { value: '1week', labelKey: 'albumCacheRefresh1week' },
  { value: '1month', labelKey: 'albumCacheRefresh1month' },
  { value: 'never', labelKey: 'albumCacheRefreshNever' },
];

export function AlbumCacheRefreshCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const value = playbackSettingsStore((s) => s.metadataRefreshThreshold);
  const setValue = playbackSettingsStore((s) => s.setMetadataRefreshThreshold);

  // Normalise any pre-existing '1hour' value (option removed) to '1day'.
  useEffect(() => {
    if (value === '1hour') {
      setValue('1day');
    }
  }, [value, setValue]);

  const options: DropdownOption<MetadataRefreshThreshold>[] = useMemo(
    () => OPTION_KEYS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t],
  );

  return (
    <View style={settingsStyles.section}>
      <SettingsSectionTitle>{t('albumCacheRefresh')}</SettingsSectionTitle>
      <View style={[settingsStyles.card, { backgroundColor: colors.card }]}>
        <DropdownRow value={value} options={options} onChange={setValue} isLast />
      </View>
      <Text style={[settingsStyles.sectionHint, { color: colors.textSecondary }]}>
        {t('albumCacheRefreshDescription')}
      </Text>
    </View>
  );
}
