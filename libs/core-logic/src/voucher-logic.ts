import type { Voucher } from './types/voucher';
import type { User } from './types/schema';

export interface VoucherValidationResult {
    valid: boolean;
    reason?: string;
    remainingAmount?: number;
}

/**
 * Validate a voucher for redemption at a specific supplier.
 */
export function validateVoucherRedemption(
    voucher: Voucher,
    supplier: User,
    requestedAmount: number
): VoucherValidationResult {
    if (voucher.status === 'fully-redeemed') {
        return { valid: false, reason: 'Voucher has already been fully redeemed' };
    }
    if (voucher.status === 'expired' || voucher.status === 'cancelled') {
        return { valid: false, reason: `Voucher is ${voucher.status}` };
    }

    if (Date.now() > voucher.expiresAt) {
        return { valid: false, reason: 'Voucher has expired' };
    }

    if (voucher.restrictedTo.length > 0 && supplier.supplierCategory) {
        if (!voucher.restrictedTo.includes(supplier.supplierCategory)) {
            return {
                valid: false,
                reason: `This voucher can only be redeemed at ${voucher.restrictedTo.join(', ')} suppliers`,
            };
        }
    }

    if (voucher.restrictedSupplierIds && voucher.restrictedSupplierIds.length > 0) {
        if (!voucher.restrictedSupplierIds.includes(supplier.uid)) {
            return { valid: false, reason: 'This voucher is restricted to specific approved suppliers' };
        }
    }

    const remaining = voucher.amount - voucher.amountRedeemed;
    if (requestedAmount > remaining) {
        return {
            valid: false,
            reason: `Insufficient voucher balance. Remaining: ${remaining} ${voucher.currency}`,
            remainingAmount: remaining,
        };
    }

    if (!supplier.approvedByAdmin) {
        return { valid: false, reason: 'Supplier is not approved by admin' };
    }

    return { valid: true, remainingAmount: remaining - requestedAmount };
}

/**
 * Calculate the new voucher status after a redemption.
 */
export function getVoucherStatusAfterRedemption(
    voucher: Voucher,
    redemptionAmount: number
): Voucher['status'] {
    const newRedeemed = voucher.amountRedeemed + redemptionAmount;
    if (newRedeemed >= voucher.amount) return 'fully-redeemed';
    return 'partially-redeemed';
}

/**
 * Calculate total value of active vouchers for a farm.
 */
export function calculateActiveVoucherValue(vouchers: Voucher[]): {
    totalIssued: number;
    totalRedeemed: number;
    totalRemaining: number;
    activeCount: number;
} {
    const active = vouchers.filter(v => v.status === 'active' || v.status === 'partially-redeemed');
    return {
        totalIssued: active.reduce((sum, v) => sum + v.amount, 0),
        totalRedeemed: active.reduce((sum, v) => sum + v.amountRedeemed, 0),
        totalRemaining: active.reduce((sum, v) => sum + (v.amount - v.amountRedeemed), 0),
        activeCount: active.length,
    };
}
