/**
 * Date utilities for the agricultural platform.
 */

/**
 * Get the current week number of a poultry batch (capped at 6).
 */
export function getBatchWeek(startDate: number): number {
    const daysSinceStart = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24));
    return Math.min(Math.ceil(daysSinceStart / 7), 6);
}

/**
 * Get the age in weeks of a pig from birth date.
 */
export function getAgeWeeks(birthDate: number): number {
    return Math.floor((Date.now() - birthDate) / (1000 * 60 * 60 * 24 * 7));
}

/**
 * Format a timestamp to a human-readable date in French
 * (common in West/Central Africa).
 */
export function formatDateFR(timestamp: number): string {
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(timestamp));
}

/**
 * Format a timestamp to a short date string (DD/MM/YYYY).
 */
export function formatDateShort(timestamp: number): string {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(timestamp));
}

/**
 * Check if a due date has passed.
 */
export function isOverdue(dueDate: number): boolean {
    return Date.now() > dueDate;
}

/**
 * Calculate days until a target date. Negative if past.
 */
export function daysUntil(targetDate: number): number {
    return Math.ceil((targetDate - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Generate a challenge window: random time within the next N hours.
 * Used for the Trust Layer's random verification checks.
 * Worker has 15 minutes to respond.
 */
export function generateChallengeWindow(maxHoursFromNow: number = 4): {
    challengeAt: number;
    expiresAt: number;
    windowMinutes: number;
} {
    const windowMinutes = 15;
    const randomOffset = Math.random() * maxHoursFromNow * 60 * 60 * 1000;
    const challengeAt = Date.now() + randomOffset;
    return {
        challengeAt,
        expiresAt: challengeAt + windowMinutes * 60 * 1000,
        windowMinutes,
    };
}

/**
 * Get the day number within a poultry batch cycle (1-42).
 */
export function getBatchDay(startDate: number): number {
    return Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24)) + 1;
}
