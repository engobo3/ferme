import type { TaskStatus } from '@diaspora-trust/core-logic';
import { statusColors } from '../theme/tokens';
import { t, DEFAULT_LOCALE, type Locale, type StringKey } from '../i18n/strings';

export interface TaskStatusDisplay {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
}

const STATUS_LABEL_KEY: Record<TaskStatus, StringKey> = {
    pending: 'status.pending',
    in_review: 'status.inReview',
    completed: 'status.completed',
    rejected: 'status.rejected',
};

const STATUS_ICON: Record<TaskStatus, string> = {
    pending: 'clock',
    in_review: 'eye',
    completed: 'check-circle',
    rejected: 'x-circle',
};

/**
 * Get display properties for a task status.
 * Colors come from the shared design tokens; labels from the i18n catalog.
 */
export function getTaskStatusDisplay(
    status: TaskStatus,
    locale: Locale = DEFAULT_LOCALE,
): TaskStatusDisplay {
    const safe: TaskStatus = statusColors[status] ? status : 'pending';
    return {
        label: t(STATUS_LABEL_KEY[safe], locale),
        color: statusColors[safe].fg,
        bgColor: statusColors[safe].bg,
        icon: STATUS_ICON[safe],
    };
}

/**
 * Check if a task status allows submission of evidence.
 */
export function canSubmitEvidence(status: TaskStatus): boolean {
    return status === 'pending' || status === 'rejected';
}

/**
 * Check if a task can be approved by a funder.
 */
export function canApproveTask(status: TaskStatus): boolean {
    return status === 'in_review';
}
