import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * validateVoucher
 *
 * Callable function for suppliers to validate and redeem a voucher.
 * Checks: status, expiry, supplier eligibility, balance.
 */
export const validateVoucher = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const { voucherId, amount, items } = data;
    if (!voucherId || !amount) {
        throw new functions.https.HttpsError("invalid-argument", "voucherId and amount are required");
    }

    const supplierId = context.auth.uid;
    const db = admin.firestore();

    return db.runTransaction(async (transaction) => {
        const voucherRef = db.collection("vouchers").doc(voucherId);
        const supplierRef = db.collection("users").doc(supplierId);

        const voucherDoc = await transaction.get(voucherRef);
        const supplierDoc = await transaction.get(supplierRef);

        if (!voucherDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Voucher not found.");
        }
        if (!supplierDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Supplier profile not found.");
        }

        const voucher = voucherDoc.data()!;
        const supplier = supplierDoc.data()!;

        // Status check
        if (voucher.status === 'fully-redeemed' || voucher.status === 'expired' || voucher.status === 'cancelled') {
            throw new functions.https.HttpsError("failed-precondition", `Voucher is ${voucher.status}`);
        }

        // Expiry check (handle both Firestore Timestamp and epoch number)
        const expiresAtMs = typeof voucher.expiresAt === 'number' ? voucher.expiresAt : voucher.expiresAt?.toMillis?.() ?? voucher.expiresAt;
        if (Date.now() > expiresAtMs) {
            transaction.update(voucherRef, { status: 'expired' });
            throw new functions.https.HttpsError("failed-precondition", "Voucher has expired");
        }

        // Supplier approval check
        if (!supplier.approvedByAdmin) {
            throw new functions.https.HttpsError("permission-denied", "Supplier is not approved");
        }

        // Supplier category check
        if (voucher.restrictedTo && voucher.restrictedTo.length > 0) {
            if (!supplier.supplierCategory || !voucher.restrictedTo.includes(supplier.supplierCategory)) {
                throw new functions.https.HttpsError("permission-denied",
                    `Voucher restricted to: ${voucher.restrictedTo.join(', ')}`);
            }
        }

        // Supplier ID restriction check
        if (voucher.restrictedSupplierIds && voucher.restrictedSupplierIds.length > 0) {
            if (!voucher.restrictedSupplierIds.includes(supplierId)) {
                throw new functions.https.HttpsError("permission-denied",
                    "This voucher is restricted to specific approved suppliers");
            }
        }

        // Balance check
        const remaining = voucher.amount - (voucher.amountRedeemed || 0);
        if (amount > remaining) {
            throw new functions.https.HttpsError("resource-exhausted",
                `Insufficient balance. Remaining: ${remaining} ${voucher.currency}`);
        }

        // Process redemption
        const redemptionId = db.collection("voucher_redemptions").doc().id;
        const newAmountRedeemed = (voucher.amountRedeemed || 0) + amount;
        const newStatus = newAmountRedeemed >= voucher.amount ? 'fully-redeemed' : 'partially-redeemed';

        transaction.update(voucherRef, {
            amountRedeemed: newAmountRedeemed,
            status: newStatus,
            redemptions: admin.firestore.FieldValue.arrayUnion({
                id: redemptionId,
                supplierId,
                supplierName: supplier.businessName || supplier.displayName,
                amount,
                items: items || [],
                timestamp: Date.now(),
            }),
        });

        // Log transaction — track against the funder who issued the voucher
        // as a withdrawal from their investment pool
        transaction.set(db.collection("transactions").doc(redemptionId), {
            id: redemptionId,
            userId: voucher.issuedBy,
            amount,
            currency: voucher.currency,
            type: 'withdrawal',
            relatedId: voucherId,
            description: `Voucher redeemed by ${supplier.businessName || supplierId} for: ${(items || []).join(', ') || 'supplies'}`,
            status: 'completed',
            supplierId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            redemptionId,
            remaining: remaining - amount,
            message: `Bon utilise: ${amount} ${voucher.currency}`,
        };
    });
});
