export type UserRole = 'funder' | 'operator' | 'admin' | 'supplier';

export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    createdAt: number;
    updatedAt: number;
    // For Funders (Diaspora):
    totalInvested?: number;
    availableBalance?: number;
    // For Operators (Farmers):
    farmIds?: string[];
    phoneNumber?: string;
    /** Home market — drives currency, locale, and mobile-money options. */
    region?: import('../region').RegionId;
    // For Suppliers:
    supplierCategory?: import('./voucher').SupplierCategory;
    approvedByAdmin?: boolean;
    businessName?: string;
    businessLocation?: { latitude: number; longitude: number; address?: string };
}

export interface Farm {
    id: string;
    name: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    /** Market the site operates in (Kinshasa or Cotonou). */
    region?: import('../region').RegionId;
    sizeHectares: number;
    cropType: string;
    ownerId: string;
    managerId: string;
    status: 'active' | 'harvested' | 'fallow';
    createdAt: number;
}

export type TaskStatus = 'pending' | 'in_review' | 'completed' | 'rejected';

export interface Task {
    id: string;
    farmId: string;
    assignedTo: string;
    title: string;
    description: string;
    dueDate: number;
    status: TaskStatus;
    evidence?: {
        photoUrl: string;
        gpsLocation?: {
            latitude: number;
            longitude: number;
        };
        timestamp: number;
        notes?: string;
    }[];
    payoutAmount: number;
    payoutCurrency?: string;
    isPaid: boolean;
    targetBoundary?: {
        latitude: number;
        longitude: number;
    }[];
    createdAt: number;
    updatedAt: number;
}

export type TransactionType = 'deposit' | 'investment' | 'payout' | 'withdrawal';

export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    relatedId?: string;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: number;
}

export interface FarmMeasurement {
    id?: string;
    farmId?: string;
    measuredAt: any;
    areaHectares: number;
    coordinates: {
        latitude: number;
        longitude: number;
    }[];
    type: 'walk-verification' | 'hybrid-verification';
    verifiedBy: string;
    devicePlatform: string;
    geojson?: GeoJSONFeature;
}

export interface GeoJSONFeature {
    type: "Feature";
    geometry: {
        type: "Polygon";
        coordinates: number[][][];
    };
    properties: {
        measuredAt: string;
        surveyorId: string;
        accuracyLevel: "Mobile-GPS" | "RTK";
        witnessVideoUrl?: string;
        witnessName?: string;
        calculatedAreaHa: number;
        disclaimer: "PRE-CADASTRAL CLAIM - NOT A TITLE DEED";
        [key: string]: any;
    };
}

/** Challenge check for trust verification */
export interface ChallengeCheck {
    id: string;
    farmId: string;
    assignedTo: string;
    challengeType: 'photo' | 'video' | 'gps-verify';
    targetLocation?: { latitude: number; longitude: number };
    issuedAt: number;
    expiresAt: number;
    respondedAt?: number;
    response?: {
        photoUrl?: string;
        gpsLocation?: { latitude: number; longitude: number };
        withinGeofence: boolean;
    };
    status: 'pending' | 'completed' | 'expired' | 'failed';
}
