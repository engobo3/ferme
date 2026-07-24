import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * generateDigitalDeed
 *
 * Generates a standard GeoJSON "Pre-Cadastral Claim" file for a completed task.
 * Output: GeoJSON FeatureCollection downloadable by the Funder.
 */
export const generateDigitalDeed = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const { taskId } = data;
    if (!taskId) {
        throw new functions.https.HttpsError("invalid-argument", "taskId is required");
    }

    const db = admin.firestore();
    const taskDoc = await db.collection("tasks").doc(taskId).get();

    if (!taskDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Task not found.");
    }

    const taskData = taskDoc.data()!;
    // Evidence may have videoUrl (from offline queue upload) or type 'video_witness'
    const witnessEvidence = taskData.evidence?.find(
        (e: any) => e.videoUrl || e.url?.includes('video') || e.type === 'video_witness'
    );

    const measurementQuery = await db.collection("farm_measurements")
        .where("taskId", "==", taskId)
        .limit(1)
        .get();

    let coordinates: number[][][] = [];
    let calculatedArea = 0;

    if (!measurementQuery.empty) {
        const mData = measurementQuery.docs[0].data();
        calculatedArea = mData.areaHectares;
        const ring = mData.coordinates.map((c: any) => [c.longitude, c.latitude]);
        if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
            ring.push(ring[0]);
        }
        coordinates = [ring];
    } else {
        throw new functions.https.HttpsError("failed-precondition", "No land measurement found for this task.");
    }

    const digitalDeed = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates,
                },
                properties: {
                    claimId: taskId,
                    claimantId: taskData.farmId,
                    surveyorId: taskData.assignedTo,
                    surveyedAt: new Date().toISOString(),
                    accuracyLevel: "Mobile-GPS",
                    calculatedAreaHa: calculatedArea,
                    witness: {
                        name: witnessEvidence?.witnessName || witnessEvidence?.notes || "Unknown",
                        videoProof: witnessEvidence?.videoUrl || witnessEvidence?.url || "Pending",
                    },
                    disclaimer: "PRE-CADASTRAL CLAIM - REVENDICATION PRE-CADASTRALE. NOT A TITLE DEED.",
                    generatedBy: "FarmTrust Platform",
                },
            },
        ],
    };

    return digitalDeed;
});
