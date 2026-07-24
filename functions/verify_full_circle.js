const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Admin SDK
// Assumes GOOGLE_APPLICATION_CREDENTIALS is set or running in an environment that allows it.
// If not, we might fail here. But let's try standard init.
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'ferme-9b64f',
    });
}

const db = getFirestore();

async function runVerification() {
    console.log("🚀 Starting Full-Circle Verification (JS Mode)...");

    const taskId = `verify-auto-${Date.now()}`;
    const funderId = 'funder-test-123';
    const operatorId = 'michel-operator-123';

    try {
        // 1. Setup Data (Simulate Web Import)
        console.log(`\n1. Creating Task: ${taskId}`);
        await db.collection('users').doc(funderId).set({
            role: 'funder',
            availableBalance: 10000,
            totalInvested: 50000,
            phoneNumber: '1555000000'
        });

        await db.collection('users').doc(operatorId).set({
            role: 'operator',
            phoneNumber: '2439999999'
        });

        const targetBoundary = [
            { latitude: 6.366, longitude: 2.418 },
            { latitude: 6.367, longitude: 2.418 },
            { latitude: 6.367, longitude: 2.419 },
            { latitude: 6.366, longitude: 2.418 } // Closed
        ];

        await db.collection('tasks').doc(taskId).set({
            title: "Automated Verification Task",
            description: "Task for automated script",
            assignedTo: operatorId,
            status: 'pending',
            payoutAmount: 500,
            payoutCurrency: 'XOF',
            targetBoundary: targetBoundary, // The "Legal" Blue Line
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("✅ Task Created with Target Boundary.");

        // 2. Simulate Mobile Data Sync (Offline -> Online)
        // This simulates what walk-measure.tsx does when it saves.
        console.log("\n2. Simulating Mobile Sync (The 'Red Line')...");

        // Mocking a slight deviation (Truth Gap)
        const realityGeoJSON = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [2.418, 6.366],
                    [2.418, 6.3672], // Slight deviation north
                    [2.419, 6.367],
                    [2.418, 6.366]
                ]]
            },
            properties: {
                verifiedAt: new Date().toISOString(),
                areaHa: 1.2
            }
        };

        // Note: In JS script, we use plain objects.
        await db.collection('tasks').doc(taskId).update({
            status: 'in_review',
            geojson: realityGeoJSON,
            evidence: admin.firestore.FieldValue.arrayUnion({
                type: 'gps_trace',
                url: 'http://mock-url.com/path.json',
                networkType: 'wifi',
                uploadedAt: Date.now()
            })
        });
        console.log("✅ Mobile Evidence Injected (GeoJSON + NetworkType).");

        // 3. Verify 'Truth Gap' Logic (Read back)
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        if (taskDoc.data()?.geojson && taskDoc.data()?.targetBoundary) {
            console.log("✅ Data exists for Truth Gap visualization (Red vs Blue).");
        } else {
            console.error("❌ Missing boundary data!");
            return;
        }

        // 4. Simulate Payout (Funder Approval)
        console.log("\n3. Simulating Funder Payout...");

        // Check Balance
        const funderBefore = (await db.collection('users').doc(funderId).get()).data();
        if (funderBefore?.availableBalance < 500) {
            console.error("❌ Insufficient Funds for test.");
            return;
        }

        // Execute Transaction (Atomic)
        const payoutId = `txn-${Date.now()}`;
        await db.runTransaction(async (t) => {
            const tRef = db.collection('tasks').doc(taskId);
            const uRef = db.collection('users').doc(funderId);

            // Re-read inside transaction for safety
            const tDoc = await t.get(tRef);
            const uDoc = await t.get(uRef);

            const currentBalance = uDoc.data().availableBalance;

            t.update(tRef, {
                status: 'completed',
                isPaid: true,
                payoutId: payoutId
            });

            t.update(uRef, {
                availableBalance: currentBalance - 500
            });

            const txnRef = db.collection('transactions').doc(payoutId);
            t.set(txnRef, {
                amount: 500,
                status: 'success',
                relatedId: taskId
            });
        });

        console.log("✅ Payout Transaction Committed.");

        // 5. Final State Check
        const finalTask = (await db.collection('tasks').doc(taskId).get()).data();
        if (finalTask?.status === 'completed' && finalTask?.isPaid) {
            console.log("\n🎉 SUCCESS: Full-Circle Verification Passed!");
            console.log(`Task ${taskId} is PAID and CLOSED.`);
        } else {
            console.error("\n❌ Verification Failed: Task state incorrect.");
        }

    } catch (error) {
        console.error("\n❌ Error during verification:", error);
    }
}

runVerification();
