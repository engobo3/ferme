// Design tokens (platform-agnostic)
export {
    palette,
    colors,
    statusColors,
    spacing,
    radius,
    typeScale,
    MIN_TOUCH_TARGET,
} from './theme/tokens';

// i18n (French-first; English secondary for diaspora investors)
export { t, DEFAULT_LOCALE } from './i18n/strings';
export type { Locale, StringKey } from './i18n/strings';
export { I18nProvider, useI18n } from './i18n/I18nProvider';
export type { I18nContextValue } from './i18n/I18nProvider';

// Hooks (platform-agnostic)
export { getTaskStatusDisplay, canSubmitEvidence, canApproveTask } from './hooks/useTaskStatus';
export type { TaskStatusDisplay } from './hooks/useTaskStatus';
export { getEvidenceItems, countEvidence } from './hooks/useEvidenceList';
export type { EvidenceItem } from './hooks/useEvidenceList';

// React Native components - import directly:
//   import { StatusBadge } from '@diaspora-trust/shared-ui/src/components/StatusBadge'
//   import { TaskChat } from '@diaspora-trust/shared-ui/src/components/TaskChat'
//   import { PhotoUpload } from '@diaspora-trust/shared-ui/src/components/PhotoUpload'

// Web (DOM) components - import directly:
//   import { StatusBadge } from '@diaspora-trust/shared-ui/src/web/StatusBadge'
//   import { TaskChat } from '@diaspora-trust/shared-ui/src/web/TaskChat'
