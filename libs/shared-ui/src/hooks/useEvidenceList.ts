import type { Task } from '@diaspora-trust/core-logic';

export interface EvidenceItem {
    photoUrl: string;
    gpsLocation?: { latitude: number; longitude: number };
    timestamp: number;
    notes?: string;
    formattedDate: string;
    hasGps: boolean;
}

/**
 * Transform raw task evidence into display-ready items.
 */
export function getEvidenceItems(task: Task): EvidenceItem[] {
    if (!task.evidence || task.evidence.length === 0) return [];

    return task.evidence
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(e => ({
            ...e,
            formattedDate: new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(e.timestamp)),
            hasGps: !!e.gpsLocation,
        }));
}

/**
 * Count evidence items by type.
 */
export function countEvidence(task: Task): {
    total: number;
    withGps: number;
    withNotes: number;
} {
    const items = task.evidence ?? [];
    return {
        total: items.length,
        withGps: items.filter(e => e.gpsLocation).length,
        withNotes: items.filter(e => e.notes).length,
    };
}
