export interface Material {
    id: string;
    projectId: string;
    name: string;
    category: MaterialCategory;
    quantity: number;
    unit: string;
    unitPriceSubmitted: number;
    unitPriceBenchmark?: number;
    priceVariancePercent?: number;
    purchaseDate?: number;
    supplierId?: string;
    status: 'quoted' | 'approved' | 'purchased' | 'delivered' | 'installed';
    trackingEvents: MaterialTrackingEvent[];
}

export type MaterialCategory =
    | 'cement' | 'blocks' | 'sand' | 'gravel'
    | 'rebar' | 'roofing' | 'timber' | 'plumbing'
    | 'electrical' | 'paint' | 'other';

export interface MaterialTrackingEvent {
    date: number;
    event: 'purchased' | 'in-transit' | 'delivered-site' | 'installed' | 'damaged' | 'missing';
    verifiedBy: string;
    photoUrl?: string;
    gpsLocation?: { latitude: number; longitude: number };
    notes?: string;
}

export interface PriceBenchmark {
    materialCategory: MaterialCategory;
    region: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    currency: string;
    lastUpdated: number;
    sampleSize: number;
}
