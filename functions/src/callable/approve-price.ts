import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * approveSupplierPrice
 *
 * Admin/Funder approves or rejects a supplier's price submission.
 * When approved, dynamically recalculates the regional benchmark
 * using a weighted moving average so the system learns real market prices.
 */
export const approveSupplierPrice = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const { priceId, action } = data;
    if (!priceId || !['approved', 'rejected'].includes(action)) {
        throw new functions.https.HttpsError("invalid-argument", "priceId and action ('approved' | 'rejected') required.");
    }

    const db = admin.firestore();
    const userId = context.auth.uid;

    // Only admin or funder can approve
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
    }
    const userRole = userDoc.data()?.role;
    if (userRole !== 'admin' && userRole !== 'funder') {
        throw new functions.https.HttpsError("permission-denied", "Only admins and funders can approve prices.");
    }

    // Fetch the price submission
    const priceRef = db.collection("supplier_prices").doc(priceId);
    const priceDoc = await priceRef.get();
    if (!priceDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Price submission not found.");
    }

    const priceData = priceDoc.data()!;

    // Update submission status
    await priceRef.update({
        status: action,
        reviewedBy: userId,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If approved → dynamically adjust the regional benchmark
    if (action === 'approved') {
        await updateBenchmarkWithNewPrice(
            db,
            priceData.category,
            priceData.region,
            priceData.unitPrice
        );
    }

    // Audit log
    await db.collection("audit_logs").add({
        action: `price_${action}`,
        targetDocId: priceId,
        targetUserId: priceData.supplierId,
        reviewedBy: userId,
        category: priceData.category,
        unitPrice: priceData.unitPrice,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        message: `Price submission ${action}.`,
    };
});

/**
 * Dynamically recalculate regional benchmark using a
 * weighted moving average. New approved prices shift the
 * benchmark toward real market conditions.
 *
 * Formula: newAvg = (oldAvg * sampleSize + newPrice) / (sampleSize + 1)
 */
async function updateBenchmarkWithNewPrice(
    db: admin.firestore.Firestore,
    category: string,
    region: string,
    newPrice: number
): Promise<void> {
    const benchmarkSnap = await db.collection("price_benchmarks")
        .where("materialCategory", "==", category)
        .where("region", "==", region)
        .limit(1)
        .get();

    if (benchmarkSnap.empty) {
        // No benchmark exists yet — create one from this price
        await db.collection("price_benchmarks").add({
            materialCategory: category,
            region,
            avgPrice: newPrice,
            minPrice: newPrice,
            maxPrice: newPrice,
            currency: 'CDF',
            sampleSize: 1,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
    }

    const benchmarkRef = benchmarkSnap.docs[0].ref;
    const benchmark = benchmarkSnap.docs[0].data();

    const oldAvg = benchmark.avgPrice;
    const sampleSize = benchmark.sampleSize || 1;

    // Weighted moving average
    const newAvg = Math.round((oldAvg * sampleSize + newPrice) / (sampleSize + 1));
    const newMin = Math.min(benchmark.minPrice, newPrice);
    const newMax = Math.max(benchmark.maxPrice, newPrice);

    await benchmarkRef.update({
        avgPrice: newAvg,
        minPrice: newMin,
        maxPrice: newMax,
        sampleSize: sampleSize + 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
}
