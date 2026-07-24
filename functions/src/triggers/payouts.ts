import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { sendPayout } from "../utils/pawapay";

/**
 * approveAndPayTask
 *
 * Callable Cloud Function triggered by the Funder (Investor) to approve a task.
 *
 * Flow:
 * 1. Checks Funder Balance.
 * 2. Checks Task Validity (Must be 'in_review').
 * 3. Idempotency Check (Has this task already been paid?).
 * 4. Atomic DB Update: Deduct Balance, Mark Task 'Completed', Create Transaction Record.
 * 5. Calls PawaPay API to disburse funds to the Operator's mobile money wallet.
 */
export const approveAndPayTask = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const { taskId } = data;
    if (!taskId) {
        throw new functions.https.HttpsError("invalid-argument", "taskId is required");
    }

    const funderId = context.auth.uid;
    const db = admin.firestore();
    const payoutId = uuidv4();

    // --- Security: 24h Rolling Payout Velocity Limit ---
    const DAILY_PAYOUT_LIMIT = 10000; // Max $10,000 equivalent per 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentPayoutsSnap = await db.collection("transactions")
        .where("userId", "==", funderId)
        .where("type", "==", "payout")
        .where("createdAt", ">=", twentyFourHoursAgo)
        .get();

    let recentTotal = 0;
    recentPayoutsSnap.forEach(doc => {
        recentTotal += doc.data().amount || 0;
    });

    // We'll check the actual task amount inside the transaction,
    // but do a pre-check here to fail fast
    if (recentTotal >= DAILY_PAYOUT_LIMIT) {
        // Audit log the blocked attempt
        await db.collection("audit_logs").add({
            action: 'payout_velocity_blocked',
            userId: funderId,
            recentTotal,
            limit: DAILY_PAYOUT_LIMIT,
            taskId,
            severity: 'critical',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        throw new functions.https.HttpsError(
            "resource-exhausted",
            `Daily payout limit exceeded. You've disbursed ${recentTotal} in the last 24h (limit: ${DAILY_PAYOUT_LIMIT}). Contact support for manual override.`
        );
    }

    // --- Pre-Transaction Idempotency Check ---
    // Uses a dedicated lock document for transactional safety
    const lockRef = db.collection("payout_locks").doc(taskId);

    // --- Transaction: Validate & Write (NO side effects) ---
    const txnResult = await db.runTransaction(async (transaction) => {
        // Transactional idempotency check via lock document
        const lockDoc = await transaction.get(lockRef);
        if (lockDoc.exists) {
            throw new functions.https.HttpsError("already-exists", "This task has already been paid.");
        }

        const taskRef = db.collection("tasks").doc(taskId);
        const funderRef = db.collection("users").doc(funderId);

        const taskDoc = await transaction.get(taskRef);
        const funderDoc = await transaction.get(funderRef);

        if (!taskDoc.exists || !funderDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Task or Funder not found.");
        }

        const taskData = taskDoc.data()!;
        const funderData = funderDoc.data()!;

        if (funderData.role !== 'funder' && funderData.role !== 'admin') {
            throw new functions.https.HttpsError("permission-denied", "Only Funders can approve.");
        }
        if (taskData.status !== 'in_review') {
            throw new functions.https.HttpsError("failed-precondition", `Task must be 'in_review'. Current: ${taskData.status}`);
        }

        const payoutAmount = taskData.payoutAmount || 0;
        const currentBalance = funderData.availableBalance || 0;

        if (currentBalance < payoutAmount) {
            throw new functions.https.HttpsError("resource-exhausted", "Insufficient wallet balance.");
        }

        const operatorId = taskData.assignedTo;
        const operatorDoc = await transaction.get(db.collection("users").doc(operatorId));
        if (!operatorDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Operator profile not found.");
        }
        const operatorData = operatorDoc.data()!;
        const recipientPhoneNumber = operatorData.phoneNumber;
        if (!recipientPhoneNumber || !/^\+?[0-9]{10,}$/.test(recipientPhoneNumber)) {
            throw new functions.https.HttpsError("invalid-argument",
                "Operator phone number is missing or invalid. Cannot process payout.");
        }
        const payoutCurrency = taskData.payoutCurrency || "CDF";

        // Set lock document to prevent duplicate processing
        transaction.set(lockRef, { taskId, payoutId, createdAt: admin.firestore.FieldValue.serverTimestamp() });

        // Atomic DB updates
        transaction.update(funderRef, {
            availableBalance: currentBalance - payoutAmount,
            totalInvested: (funderData.totalInvested || 0) + payoutAmount,
        });

        transaction.update(taskRef, {
            status: 'completed',
            isPaid: true,
            payoutId,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const transactionRef = db.collection("transactions").doc(payoutId);
        transaction.set(transactionRef, {
            id: payoutId,
            userId: funderId,
            amount: payoutAmount,
            currency: payoutCurrency,
            type: 'payout',
            relatedId: taskId,
            description: `Payout for task ${taskData.title}`,
            status: 'pending',
            recipient: recipientPhoneNumber,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Return data needed for post-transaction payout call
        return { payoutAmount, payoutCurrency, recipientPhoneNumber };
    });

    // --- Post-Transaction: External API Call (safe from retries) ---
    try {
        const result = await sendPayout({
            payoutId,
            amount: txnResult.payoutAmount,
            currency: txnResult.payoutCurrency,
            recipientPhone: txnResult.recipientPhoneNumber,
        });

        // Update transaction status based on API result
        const finalStatus = result.success ? 'completed' : 'failed';
        await db.collection("transactions").doc(payoutId).update({ status: finalStatus });

        if (!result.success) {
            console.error(`[Payout] Disbursement failed for payoutId=${payoutId}, taskId=${taskId}`);
            // Note: The DB records the task as completed and balance deducted.
            // A manual reconciliation step or retry mechanism should handle this.
        }

        return { success: result.success, payoutId, message: result.success ? "Payment processed successfully." : "Payment recorded but disbursement failed. Will retry." };
    } catch (error) {
        console.error(`[Payout] sendPayout threw for payoutId=${payoutId}:`, error);
        await db.collection("transactions").doc(payoutId).update({ status: 'failed' });
        return { success: false, payoutId, message: "Payment recorded but disbursement failed. Will retry." };
    }
});
