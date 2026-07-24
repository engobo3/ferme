import type { PoultryBatch, Pig } from './types/livestock';

// ============================================================
// POULTRY MODULE -- 1-Acre Model: 500 Broiler Chicks, 6-Week Cycle
// ============================================================

/** Standard broiler weight targets (grams) by week */
export const BROILER_WEIGHT_TARGETS_GRAMS: Record<number, number> = {
    0: 42,      // Day-old chick
    1: 180,
    2: 450,
    3: 850,
    4: 1400,
    5: 2000,
    6: 2500,    // Market weight target
};

/** Feed consumption targets (grams per bird per day) by week */
export const BROILER_FEED_PER_BIRD_PER_DAY_GRAMS: Record<number, number> = {
    1: 17,      // Starter feed
    2: 30,
    3: 55,      // Grower feed begins
    4: 80,
    5: 110,     // Finisher feed begins
    6: 130,
};

/** Acceptable cumulative mortality rate (%) by week */
export const ACCEPTABLE_MORTALITY_BY_WEEK: Record<number, number> = {
    1: 2,
    2: 3,
    3: 3.5,
    4: 4,
    5: 4.5,
    6: 5,
};

/**
 * Calculate total feed required for a batch over its full cycle.
 * @returns Total feed in kilograms.
 */
export function calculateTotalFeedRequired(birdCount: number, weeks: number = 6): number {
    let totalGrams = 0;
    for (let week = 1; week <= weeks; week++) {
        const dailyPerBird = BROILER_FEED_PER_BIRD_PER_DAY_GRAMS[week] ?? 130;
        totalGrams += dailyPerBird * 7 * birdCount;
    }
    return totalGrams / 1000;
}

/**
 * Calculate Feed Conversion Ratio for a poultry batch.
 * FCR = Total feed consumed (kg) / Total weight gained (kg).
 * Good broiler FCR: 1.6-1.8.
 */
export function calculatePoultryFCR(batch: PoultryBatch): number | null {
    if (batch.weeklyRecords.length === 0) return null;
    const lastRecord = batch.weeklyRecords[batch.weeklyRecords.length - 1];
    const totalWeightGainKg = (lastRecord.avgWeightGrams - 42) * batch.currentCount / 1000;
    if (totalWeightGainKg <= 0) return null;
    return batch.feedTotalKg / totalWeightGainKg;
}

/**
 * Check if mortality rate is within acceptable bounds for the current week.
 */
export function isMortalityAcceptable(batch: PoultryBatch, currentWeek: number): {
    acceptable: boolean;
    rate: number;
    threshold: number;
    message: string;
} {
    const rate = (batch.mortalityCount / batch.initialCount) * 100;
    const threshold = ACCEPTABLE_MORTALITY_BY_WEEK[currentWeek] ?? 5;
    return {
        acceptable: rate <= threshold,
        rate: Math.round(rate * 100) / 100,
        threshold,
        message: rate <= threshold
            ? `Mortality at ${rate.toFixed(1)}% is within acceptable range (${threshold}%)`
            : `WARNING: Mortality at ${rate.toFixed(1)}% exceeds threshold (${threshold}%). Investigate immediately.`,
    };
}

/**
 * Assess bird weight performance vs targets.
 */
export function assessWeightPerformance(avgWeightGrams: number, week: number): {
    target: number;
    actual: number;
    percentOfTarget: number;
    status: 'excellent' | 'good' | 'below' | 'critical';
} {
    const target = BROILER_WEIGHT_TARGETS_GRAMS[week] ?? 2500;
    const pct = (avgWeightGrams / target) * 100;
    let status: 'excellent' | 'good' | 'below' | 'critical';
    if (pct >= 105) status = 'excellent';
    else if (pct >= 90) status = 'good';
    else if (pct >= 75) status = 'below';
    else status = 'critical';

    return { target, actual: avgWeightGrams, percentOfTarget: Math.round(pct), status };
}

/**
 * Calculate weekly feed cost for a given number of birds.
 * @param feedPricePerKg Local feed price per kilogram.
 */
export function calculateWeeklyFeedCost(birdCount: number, week: number, feedPricePerKg: number): number {
    const dailyPerBird = BROILER_FEED_PER_BIRD_PER_DAY_GRAMS[week] ?? 130;
    const weeklyKg = (dailyPerBird * 7 * birdCount) / 1000;
    return weeklyKg * feedPricePerKg;
}


// ============================================================
// PIG MODULE -- 1-Acre Model: 10-20 Pigs
// ============================================================

/** Pig weight curve targets (kg) by age in weeks.
 *  Birth (~1.5kg) to Market (~100kg) in ~22-24 weeks. */
export const PIG_WEIGHT_CURVE_KG: Record<number, number> = {
    0: 1.5,
    1: 2.5,
    2: 4,
    3: 5.5,
    4: 7,       // Weaning begins
    5: 9,
    6: 11,
    7: 14,
    8: 18,      // Nursery phase
    9: 22,
    10: 27,
    11: 32,
    12: 38,     // Grower phase begins
    13: 44,
    14: 50,
    15: 56,
    16: 62,     // Finisher phase begins
    17: 68,
    18: 74,
    19: 80,
    20: 86,
    21: 92,
    22: 97,
    23: 100,    // Target market weight
    24: 103,
};

/** Feed conversion ratios by growth phase */
export const PIG_FCR_BY_PHASE: Record<string, number> = {
    'nursery': 1.8,     // Weeks 4-8
    'grower': 2.5,      // Weeks 8-16
    'finisher': 3.5,    // Weeks 16-24
};

/**
 * Get the growth phase for a pig by age in weeks.
 */
export function getPigGrowthPhase(ageWeeks: number): 'suckling' | 'nursery' | 'grower' | 'finisher' {
    if (ageWeeks < 4) return 'suckling';
    if (ageWeeks < 8) return 'nursery';
    if (ageWeeks < 16) return 'grower';
    return 'finisher';
}

/**
 * Estimate when a pig will reach market weight based on its growth trajectory.
 */
export function estimateMarketDate(pig: Pig): Date | null {
    if (pig.weightHistory.length < 2) return null;

    const sorted = [...pig.weightHistory].sort((a, b) => a.date - b.date);
    const recent = sorted.slice(-2);
    const [prev, curr] = recent;

    const daysBetween = (curr.date - prev.date) / (1000 * 60 * 60 * 24);
    if (daysBetween <= 0) return null;

    const dailyGain = (curr.weightKg - prev.weightKg) / daysBetween;
    if (dailyGain <= 0) return null;

    const remaining = pig.targetMarketWeightKg - pig.currentWeightKg;
    const daysToMarket = remaining / dailyGain;

    return new Date(Date.now() + daysToMarket * 24 * 60 * 60 * 1000);
}

/**
 * Assess pig growth against the standard weight curve.
 */
export function assessPigGrowth(pig: Pig, ageWeeks: number): {
    expectedKg: number;
    actualKg: number;
    percentOfTarget: number;
    status: 'excellent' | 'good' | 'below' | 'critical';
    dailyGainKg: number | null;
} {
    const expectedKg = PIG_WEIGHT_CURVE_KG[ageWeeks] ?? 100;
    const pct = (pig.currentWeightKg / expectedKg) * 100;

    let status: 'excellent' | 'good' | 'below' | 'critical';
    if (pct >= 105) status = 'excellent';
    else if (pct >= 85) status = 'good';
    else if (pct >= 70) status = 'below';
    else status = 'critical';

    let dailyGainKg: number | null = null;
    if (pig.weightHistory.length >= 2) {
        const sorted = [...pig.weightHistory].sort((a, b) => a.date - b.date);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const days = (last.date - first.date) / (1000 * 60 * 60 * 24);
        if (days > 0) dailyGainKg = (last.weightKg - first.weightKg) / days;
    }

    return { expectedKg, actualKg: pig.currentWeightKg, percentOfTarget: Math.round(pct), status, dailyGainKg };
}

/**
 * Calculate daily feed requirement for a pig based on weight.
 * Rule of thumb: pigs eat ~3-5% of body weight per day.
 */
export function calculatePigDailyFeedKg(weightKg: number): number {
    if (weightKg < 20) return weightKg * 0.05;
    if (weightKg < 60) return weightKg * 0.04;
    return weightKg * 0.03;
}

/**
 * Calculate total daily feed cost for a group of pigs.
 */
export function calculateHerdDailyFeedCost(pigs: Pig[], feedPricePerKg: number): {
    totalKg: number;
    totalCost: number;
    perPig: { earTag: string; feedKg: number; cost: number }[];
} {
    const perPig = pigs.map(pig => {
        const feedKg = calculatePigDailyFeedKg(pig.currentWeightKg);
        return { earTag: pig.earTag, feedKg, cost: feedKg * feedPricePerKg };
    });
    const totalKg = perPig.reduce((sum, p) => sum + p.feedKg, 0);
    return { totalKg, totalCost: totalKg * feedPricePerKg, perPig };
}
