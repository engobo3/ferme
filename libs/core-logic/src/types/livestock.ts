/** Poultry Batch (1-Acre Model: 500 chicks, 6-week cycle) */
export interface PoultryBatch {
    id: string;
    farmId: string;
    batchNumber: string;
    initialCount: number;
    currentCount: number;
    startDate: number;
    targetEndDate: number;
    weeklyRecords: PoultryWeeklyRecord[];
    status: 'active' | 'harvested' | 'lost';
    feedTotalKg: number;
    mortalityCount: number;
    mortalityRate: number;
}

export interface PoultryWeeklyRecord {
    week: number;
    date: number;
    avgWeightGrams: number;
    feedConsumedKg: number;
    mortalityThisWeek: number;
    waterLiters: number;
    temperature: { min: number; max: number; avg: number };
    notes?: string;
}

/** Individual Pig (1-Acre Model: 10-20 pigs) */
export interface Pig {
    id: string;
    farmId: string;
    earTag: string;
    breed: string;
    sex: 'male' | 'female';
    dateOfBirth: number;
    purchaseDate?: number;
    purchaseWeightKg?: number;
    currentWeightKg: number;
    targetMarketWeightKg: number;
    status: 'growing' | 'market-ready' | 'sold' | 'deceased' | 'breeding';
    weightHistory: PigWeightRecord[];
    healthRecords: PigHealthRecord[];
    feedConversionRatio?: number;
    estimatedMarketDate?: number;
}

export interface PigWeightRecord {
    date: number;
    weightKg: number;
    ageWeeks: number;
    notes?: string;
}

export interface PigHealthRecord {
    date: number;
    type: 'vaccination' | 'treatment' | 'observation' | 'deworming';
    description: string;
    administeredBy: string;
    cost?: number;
}
