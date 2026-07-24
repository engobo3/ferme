import type { Material, PriceBenchmark, MaterialCategory } from './types/construction';

/** Maximum acceptable variance from regional average (%) */
const MAX_PRICE_VARIANCE_PERCENT = 30;

export interface PriceValidationResult {
    isValid: boolean;
    variancePercent: number;
    flags: PriceFlag[];
    recommendation: 'approve' | 'review' | 'reject';
    message: string;
}

export type PriceFlag =
    | 'price-above-threshold'
    | 'price-below-market'
    | 'quantity-anomaly'
    | 'duplicate-purchase'
    | 'supplier-not-approved'
    | 'category-mismatch';

/**
 * Validate a material price submission against regional benchmarks.
 */
export function validatePrice(
    submittedPrice: number,
    benchmark: PriceBenchmark,
    options?: { maxVariancePercent?: number }
): PriceValidationResult {
    const maxVariance = options?.maxVariancePercent ?? MAX_PRICE_VARIANCE_PERCENT;
    const variancePercent = ((submittedPrice - benchmark.avgPrice) / benchmark.avgPrice) * 100;
    const flags: PriceFlag[] = [];

    if (variancePercent > maxVariance) {
        flags.push('price-above-threshold');
    }
    if (variancePercent < -20) {
        flags.push('price-below-market');
    }
    if (submittedPrice > benchmark.maxPrice * 1.1) {
        flags.push('price-above-threshold');
    }

    // Deduplicate flags
    const uniqueFlags = [...new Set(flags)];

    let recommendation: 'approve' | 'review' | 'reject';
    if (uniqueFlags.length === 0) {
        recommendation = 'approve';
    } else if (uniqueFlags.includes('price-above-threshold') && variancePercent > maxVariance * 1.5) {
        recommendation = 'reject';
    } else {
        recommendation = 'review';
    }

    return {
        isValid: uniqueFlags.length === 0,
        variancePercent: Math.round(variancePercent * 100) / 100,
        flags: uniqueFlags,
        recommendation,
        message: uniqueFlags.length === 0
            ? `Price is within ${maxVariance}% of regional average (${benchmark.avgPrice} ${benchmark.currency})`
            : `Price variance of ${variancePercent.toFixed(1)}% detected. ${uniqueFlags.join(', ')}`,
    };
}

/**
 * Detect potential duplicate purchases (same material, same quantity, within short time window).
 */
export function detectDuplicatePurchase(
    newMaterial: Pick<Material, 'name' | 'category' | 'quantity' | 'unitPriceSubmitted'>,
    recentMaterials: Material[],
    timeWindowMs: number = 7 * 24 * 60 * 60 * 1000
): { isDuplicate: boolean; matchedMaterial?: Material } {
    const now = Date.now();
    const match = recentMaterials.find(m =>
        m.category === newMaterial.category &&
        m.quantity === newMaterial.quantity &&
        Math.abs(m.unitPriceSubmitted - newMaterial.unitPriceSubmitted) < 0.01 &&
        m.purchaseDate && (now - m.purchaseDate) < timeWindowMs
    );

    return { isDuplicate: !!match, matchedMaterial: match };
}

/**
 * Calculate total project cost with variance tracking.
 */
export function calculateProjectCostSummary(
    materials: Material[],
    benchmarks: Map<MaterialCategory, PriceBenchmark>
): {
    totalSubmitted: number;
    totalBenchmark: number;
    overallVariancePercent: number;
    flaggedItems: Material[];
    savingsOpportunity: number;
} {
    let totalSubmitted = 0;
    let totalBenchmark = 0;
    const flaggedItems: Material[] = [];

    for (const material of materials) {
        const cost = material.unitPriceSubmitted * material.quantity;
        totalSubmitted += cost;

        const bm = benchmarks.get(material.category);
        if (bm) {
            totalBenchmark += bm.avgPrice * material.quantity;
            const result = validatePrice(material.unitPriceSubmitted, bm);
            if (!result.isValid) flaggedItems.push(material);
        }
    }

    return {
        totalSubmitted,
        totalBenchmark,
        overallVariancePercent: totalBenchmark > 0
            ? Math.round(((totalSubmitted - totalBenchmark) / totalBenchmark) * 100 * 100) / 100
            : 0,
        flaggedItems,
        savingsOpportunity: Math.max(0, totalSubmitted - totalBenchmark),
    };
}

/**
 * Validate a quantity makes sense for the material category.
 * Flags unusually large orders that could indicate theft/diversion.
 */
export function validateQuantity(
    category: MaterialCategory,
    quantity: number,
    projectSizeHectares: number
): { valid: boolean; flag?: PriceFlag; message: string } {
    // Rough maximum quantities per hectare of construction
    const maxPerHectare: Partial<Record<MaterialCategory, number>> = {
        'cement': 200,    // 200 bags per hectare
        'blocks': 5000,   // 5000 blocks per hectare
        'rebar': 500,     // 500 pieces per hectare
        'roofing': 100,   // 100 sheets per hectare
    };

    const maxForCategory = maxPerHectare[category];
    if (!maxForCategory) return { valid: true, message: 'No quantity benchmark for this category' };

    const maxAllowed = maxForCategory * Math.max(projectSizeHectares, 0.1);
    if (quantity > maxAllowed) {
        return {
            valid: false,
            flag: 'quantity-anomaly',
            message: `Quantity ${quantity} exceeds expected maximum of ${maxAllowed} for ${category} on a ${projectSizeHectares}ha project`,
        };
    }

    return { valid: true, message: 'Quantity within expected range' };
}
