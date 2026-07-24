/**
 * FarmTrust design tokens — the single source of truth for all three apps.
 *
 * Tuned for the Kinshasa/Cotonou context:
 *   - Bright-sunlight readability: dark text on light surfaces, every
 *     text/surface pair passes WCAG AA at its intended size.
 *   - 48dp minimum touch targets (outdoor, one-handed, sometimes gloved use).
 *   - Two product verticals share one system: farm = green, chantier = amber.
 *
 * Pure TS, zero dependencies — usable from React Native StyleSheets,
 * inline web styles, and Tailwind @theme mappings alike.
 */
import type { TaskStatus } from '@diaspora-trust/core-logic';

export const palette = {
    white: '#FFFFFF',
    black: '#000000',

    // Farm vertical (legacy FarmTrust brand green preserved)
    green50: '#F0FDF4',
    green100: '#DCFCE7',
    green600: '#16A34A',
    green700: '#2E7D32',
    green900: '#14532D',

    // Construction vertical ("chantier")
    amber50: '#FFFBEB',
    amber100: '#FEF3C7',
    amber600: '#D97706',
    amber700: '#B45309',

    emerald100: '#D1FAE5',
    emerald700: '#047857',

    blue100: '#DBEAFE',
    blue700: '#1D4ED8',

    red100: '#FEE2E2',
    red700: '#B91C1C',

    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate800: '#1E293B',
    slate900: '#0F172A',
} as const;

export const colors = {
    // Brand & verticals
    primary: palette.green700,
    primaryPressed: palette.green900,
    onPrimary: palette.white,
    farm: palette.green700,
    farmSoft: palette.green100,
    construction: palette.amber700,
    constructionSoft: palette.amber100,

    // Surfaces
    background: palette.slate50,
    surface: palette.white,
    surfaceMuted: palette.slate100,
    border: palette.slate200,

    // Text (AA on background/surface at body sizes)
    text: palette.slate900,
    textMuted: palette.slate600,
    textFaint: palette.slate500,
    onDark: palette.white,

    // Semantic
    success: palette.emerald700,
    warning: palette.amber600,
    danger: palette.red700,
    info: palette.blue700,
} as const;

/**
 * Status colors: dark foreground on a soft background — legible outdoors,
 * and consistent with the pre-redesign badge hues so users aren't retrained.
 */
export const statusColors: Record<TaskStatus, { fg: string; bg: string }> = {
    pending: { fg: palette.amber700, bg: palette.amber100 },
    in_review: { fg: palette.blue700, bg: palette.blue100 },
    completed: { fg: palette.emerald700, bg: palette.emerald100 },
    rejected: { fg: palette.red700, bg: palette.red100 },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, full: 999 } as const;

/** Type scale in dp/px — 16 body floor for small, dense, sunlit screens. */
export const typeScale = {
    display: 28,
    title: 22,
    heading: 18,
    body: 16,
    label: 14,
    caption: 12,
} as const;

/** Minimum touch target size (Android accessibility, outdoor use). */
export const MIN_TOUCH_TARGET = 48;
