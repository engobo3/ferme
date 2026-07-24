import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, radius, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';

type ToolItem = {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: '/walk-measure' | '/crop-scan' | '/record-witness' | '/request-funds';
  accent: string;
};

const TOOLS: ToolItem[] = [
  {
    key: 'walk-measure',
    title: t('tools.measureLand'),
    description: t('tools.measureLandDesc'),
    icon: 'footsteps',
    route: '/walk-measure',
    accent: colors.farm,
  },
  {
    key: 'crop-scan',
    title: t('tools.cropScan'),
    description: t('tools.cropScanDesc'),
    icon: 'camera',
    route: '/crop-scan',
    accent: colors.info,
  },
  {
    key: 'record-witness',
    title: t('tools.witness'),
    description: t('tools.witnessDesc'),
    icon: 'videocam',
    route: '/record-witness',
    accent: colors.danger,
  },
  {
    key: 'request-funds',
    title: t('tools.requestFunds'),
    description: t('tools.requestFundsDesc'),
    icon: 'wallet',
    route: '/request-funds',
    accent: colors.construction,
  },
];

export default function ToolsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('nav.tools')}</Text>
        <Text style={styles.headerSubtitle}>{t('tools.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.key}
            style={styles.card}
            onPress={() => router.push(tool.route)}
          >
            <View style={[styles.iconWrap, { backgroundColor: tool.accent }]}>
              <Ionicons name={tool.icon} size={24} color={colors.onDark} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardDesc}>{tool.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typeScale.display,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typeScale.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: MIN_TOUCH_TARGET + spacing.lg,
  },
  iconWrap: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typeScale.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardDesc: {
    fontSize: typeScale.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
