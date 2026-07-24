import type { PoultryBatch } from './types/livestock';
import type { Material, MaterialTrackingEvent } from './types/construction';

/**
 * Validate material tracking chain of custody.
 * Flags gaps in the tracking chain that could indicate theft.
 */
export function validateMaterialChainOfCustody(material: Material): {
    complete: boolean;
    missingSteps: string[];
    lastKnownLocation?: string;
} {
    const expectedChain: MaterialTrackingEvent['event'][] = [
        'purchased', 'in-transit', 'delivered-site', 'installed',
    ];

    const events = material.trackingEvents ?? [];
    const actualEvents = events.map(e => e.event);
    const missingSteps: string[] = [];

    const latestIdx = Math.max(...actualEvents.map(e => expectedChain.indexOf(e)).filter(i => i >= 0), -1);
    for (let i = 0; i <= latestIdx; i++) {
        if (!actualEvents.includes(expectedChain[i])) {
            missingSteps.push(expectedChain[i]);
        }
    }

    if (actualEvents.includes('missing')) {
        missingSteps.push('ALERT: Material flagged as missing');
    }
    if (actualEvents.includes('damaged')) {
        missingSteps.push('ALERT: Material flagged as damaged');
    }

    const lastEvent = events[events.length - 1];

    return {
        complete: missingSteps.length === 0 && actualEvents.includes('installed'),
        missingSteps,
        lastKnownLocation: lastEvent?.gpsLocation
            ? `${lastEvent.gpsLocation.latitude}, ${lastEvent.gpsLocation.longitude}`
            : undefined,
    };
}

/**
 * Summarize material tracking status for a project.
 */
export function summarizeProjectMaterials(materials: Material[]): {
    total: number;
    installed: number;
    inTransit: number;
    missing: number;
    completionPercent: number;
} {
    let installed = 0;
    let inTransit = 0;
    let missing = 0;

    for (const m of materials) {
        const events = (m.trackingEvents ?? []).map(e => e.event);
        if (events.includes('installed')) installed++;
        else if (events.includes('missing')) missing++;
        else if (events.includes('in-transit')) inTransit++;
    }

    return {
        total: materials.length,
        installed,
        inTransit,
        missing,
        completionPercent: materials.length > 0
            ? Math.round((installed / materials.length) * 100)
            : 0,
    };
}

/**
 * Generate a poultry batch report with financial projections.
 */
export function generateBatchReport(batch: PoultryBatch): {
    batchId: string;
    daysActive: number;
    currentCount: number;
    mortalityRate: string;
    totalFeedKg: number;
    fcr: string;
    estimatedRevenueXOF: number;
    profitMargin: string;
} {
    const daysActive = Math.floor((Date.now() - batch.startDate) / (1000 * 60 * 60 * 24));
    const mortalityRate = ((batch.mortalityCount / batch.initialCount) * 100).toFixed(1);

    const lastRecord = batch.weeklyRecords.length > 0
        ? batch.weeklyRecords[batch.weeklyRecords.length - 1]
        : null;
    const totalWeightGainKg = lastRecord
        ? (lastRecord.avgWeightGrams - 42) * batch.currentCount / 1000
        : 0;
    const fcr = totalWeightGainKg > 0
        ? (batch.feedTotalKg / totalWeightGainKg).toFixed(2)
        : 'N/A';

    const PRICE_PER_KG_XOF = 1500;
    const totalWeightKg = lastRecord ? (lastRecord.avgWeightGrams / 1000) * batch.currentCount : 0;
    const estimatedRevenueXOF = totalWeightKg * PRICE_PER_KG_XOF;

    const FEED_COST_PER_KG_XOF = 350;
    const totalCost = batch.feedTotalKg * FEED_COST_PER_KG_XOF;
    const profit = estimatedRevenueXOF - totalCost;
    const profitMargin = estimatedRevenueXOF > 0
        ? ((profit / estimatedRevenueXOF) * 100).toFixed(1)
        : '0';

    return {
        batchId: batch.batchNumber,
        daysActive,
        currentCount: batch.currentCount,
        mortalityRate: mortalityRate + '%',
        totalFeedKg: batch.feedTotalKg,
        fcr,
        estimatedRevenueXOF,
        profitMargin: profitMargin + '%',
    };
}
