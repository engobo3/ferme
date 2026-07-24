import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * submitSupplierPrice
 *
 * Callable function for suppliers to submit their current prices.
 * Prices are stored for benchmarking and validated against regional averages.
 * 
 * ANTI-GOUGING: Implements a 3-strikes system.
 *   - Strike 1-2: Price is flagged, supplier is warned
 *   - Strike 3: Supplier account is automatically suspended
 */
export const submitSupplierPrice = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const { entries } = data;
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "entries array is required");
    }

    const supplierId = context.auth.uid;
    const db = admin.firestore();

    // Verify supplier role and check suspension
    const supplierRef = db.collection("users").doc(supplierId);
    const supplierDoc = await supplierRef.get();
    if (!supplierDoc.exists || supplierDoc.data()?.role !== 'supplier') {
        throw new functions.https.HttpsError("permission-denied", "Only suppliers can submit prices.");
    }

    const supplier = supplierDoc.data()!;

    // Anti-Gouging: Block suspended suppliers
    if (supplier.accountStatus === 'suspended') {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Your account has been suspended due to repeated price gouging violations. Contact support to appeal."
        );
    }

    const region = supplier.businessLocation?.address || 'unknown';
    const results: { name: string; status: string; variancePercent?: number; strikesRemaining?: number }[] = [];
    let newStrikes = 0;

    for (const entry of entries) {
        const { category, name, unitPrice, unit } = entry;

        // Look up regional benchmark
        const benchmarkSnap = await db.collection("price_benchmarks")
            .where("materialCategory", "==", category)
            .where("region", "==", region)
            .limit(1)
            .get();

        let variancePercent: number | undefined;
        let status = 'recorded';

        if (!benchmarkSnap.empty) {
            const benchmark = benchmarkSnap.docs[0].data();
            variancePercent = ((unitPrice - benchmark.avgPrice) / benchmark.avgPrice) * 100;

            if (variancePercent > 30) {
                status = 'flagged';
                newStrikes++;
            } else if (variancePercent < -20) {
                status = 'flagged_low'; // suspiciously low — possible counterfeit
            }
        }

        // Store the price submission
        await db.collection("supplier_prices").add({
            supplierId,
            supplierName: supplier.businessName || supplier.displayName,
            category,
            name,
            unitPrice,
            unit,
            region,
            variancePercent,
            status,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const currentStrikes = (supplier.gougingStrikes || 0) + newStrikes;
        results.push({
            name,
            status,
            variancePercent,
            strikesRemaining: status === 'flagged' ? Math.max(0, 3 - currentStrikes) : undefined,
        });
    }

    // Anti-Gouging: Update strikes and potentially suspend
    if (newStrikes > 0) {
        const totalStrikes = (supplier.gougingStrikes || 0) + newStrikes;
        const updatePayload: Record<string, any> = {
            gougingStrikes: admin.firestore.FieldValue.increment(newStrikes),
            lastGougingAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (totalStrikes >= 3) {
            updatePayload.accountStatus = 'suspended';
            updatePayload.suspendedAt = admin.firestore.FieldValue.serverTimestamp();
            updatePayload.suspensionReason = `Auto-suspended: ${totalStrikes} price gouging violations detected.`;
        }

        await supplierRef.update(updatePayload);

        // Log the violation to audit trail
        await db.collection("audit_logs").add({
            action: totalStrikes >= 3 ? 'supplier_suspended' : 'gouging_strike',
            targetUserId: supplierId,
            strikesTotal: totalStrikes,
            flaggedEntries: results.filter(r => r.status === 'flagged').map(r => r.name),
            severity: totalStrikes >= 3 ? 'critical' : 'warning',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    const totalStrikes = (supplier.gougingStrikes || 0) + newStrikes;
    return {
        success: true,
        message: `${entries.length} prices submitted`,
        results,
        warnings: totalStrikes >= 3
            ? ["ACCOUNT SUSPENDED: You have exceeded the maximum number of price gouging violations."]
            : totalStrikes > 0
                ? [`Warning: ${totalStrikes}/3 price gouging strikes. ${3 - totalStrikes} remaining before suspension.`]
                : [],
    };
});
