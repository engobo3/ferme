export type SupplierCategory =
    | 'feed-supplier'
    | 'hardware-store'
    | 'building-materials'
    | 'veterinary'
    | 'agricultural-inputs'
    | 'general';

export interface Voucher {
    id: string;
    farmId: string;
    issuedTo: string;
    issuedBy: string;
    amount: number;
    currency: string;
    purpose: string;
    restrictedTo: SupplierCategory[];
    restrictedSupplierIds?: string[];
    status: 'active' | 'partially-redeemed' | 'fully-redeemed' | 'expired' | 'cancelled';
    amountRedeemed: number;
    redemptions: VoucherRedemption[];
    expiresAt: number;
    createdAt: number;
    qrCode?: string;
}

export interface VoucherRedemption {
    id: string;
    voucherId: string;
    supplierId: string;
    supplierName: string;
    amount: number;
    items: { name: string; quantity: number; unitPrice: number }[];
    timestamp: number;
    receiptPhotoUrl?: string;
    gpsLocation?: { latitude: number; longitude: number };
}
