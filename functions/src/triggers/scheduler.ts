import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Daily scheduled function to generate farm tasks based on livestock cycles.
 * Runs every day at 6 AM Africa/Lagos time.
 */
export const dailyFarmTaskScheduler = functions.pubsub
    .schedule("0 6 * * *")
    .timeZone("Africa/Lagos")
    .onRun(async () => {
        const db = admin.firestore();
        const now = Date.now();

        // Find active poultry batches and generate weekly tasks
        const batchesSnap = await db.collection("poultry_batches")
            .where("status", "==", "active")
            .get();

        for (const doc of batchesSnap.docs) {
            const batch = doc.data();
            // Handle both Firestore Timestamp and epoch number
            const startMs = typeof batch.startDate === 'number' ? batch.startDate : batch.startDate?.toMillis?.() ?? batch.startDate;
            const daysSinceStart = Math.floor((now - startMs) / (1000 * 60 * 60 * 24));
            const currentWeek = Math.max(1, Math.ceil(daysSinceStart / 7));

            // Generate weekly weigh-in task on day 1 of each week
            if (daysSinceStart % 7 === 0 && currentWeek <= 6) {
                const existingTask = await db.collection("tasks")
                    .where("farmId", "==", batch.farmId)
                    .where("title", "==", `Poultry Week ${currentWeek} Weigh-in`)
                    .limit(1)
                    .get();

                if (existingTask.empty) {
                    try {
                        await db.collection("tasks").add({
                            farmId: batch.farmId,
                            assignedTo: batch.managerId || "",
                            title: `Poultry Week ${currentWeek} Weigh-in`,
                            description: `Record average bird weight, feed consumed, water usage, mortality count, and temperature readings for week ${currentWeek}.`,
                            dueDate: now + 2 * 24 * 60 * 60 * 1000, // 2 days to complete
                            status: "pending",
                            payoutAmount: 0,
                            isPaid: false,
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    } catch (err) {
                        console.error(`[Scheduler] Failed to create task for batch ${doc.id}:`, err);
                    }
                }
            }
        }

        // Flag overdue tasks
        const overdueSnap = await db.collection("tasks")
            .where("status", "==", "pending")
            .where("dueDate", "<", now)
            .get();

        for (const doc of overdueSnap.docs) {
            await doc.ref.update({
                overdue: true,
                updatedAt: now,
            });
        }

        console.log(`[Scheduler] Processed ${batchesSnap.size} batches, flagged ${overdueSnap.size} overdue tasks.`);
    });

/**
 * Clean up stale tasks that have been in_review for more than 7 days.
 * Runs weekly on Sunday at midnight.
 */
export const staleTaskCleanup = functions.pubsub
    .schedule("0 0 * * 0")
    .timeZone("Africa/Lagos")
    .onRun(async () => {
        const db = admin.firestore();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        const staleSnap = await db.collection("tasks")
            .where("status", "==", "in_review")
            .where("updatedAt", "<", sevenDaysAgo)
            .get();

        for (const doc of staleSnap.docs) {
            await doc.ref.update({
                staleWarning: true,
                updatedAt: Date.now(),
            });
        }

        console.log(`[StaleCleanup] Flagged ${staleSnap.size} stale tasks.`);
    });
