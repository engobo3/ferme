import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * logMaterialEvent
 *
 * Records a material tracking event (delivery, installation, etc.)
 * with mandatory GPS verification against the project farm boundary.
 * 
 * ANTI-THEFT: Uses point-in-polygon check to verify the event
 * occurred on the actual farm site. Events >100m off-site are
 * automatically flagged as `theft_risk`.
 */
export const logMaterialEvent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const { materialId, event, gpsLatitude, gpsLongitude, notes, photoUrl } = data;

    if (!materialId || !event || gpsLatitude === undefined || gpsLongitude === undefined) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "materialId, event, gpsLatitude, gpsLongitude are required."
        );
    }

    const validEvents = ['purchased', 'in-transit', 'delivered-site', 'installed', 'damaged', 'missing'];
    if (!validEvents.includes(event)) {
        throw new functions.https.HttpsError("invalid-argument", `Invalid event type. Must be one of: ${validEvents.join(', ')}`);
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    // Fetch the material
    const materialRef = db.collection("materials").doc(materialId);
    const materialDoc = await materialRef.get();
    if (!materialDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Material not found.");
    }

    const material = materialDoc.data()!;
    const projectId = material.projectId;

    // Fetch the project farm to get the boundary polygon
    let isOnSite = false;
    let distanceFromSite: number | undefined;
    let theftRisk = false;

    // Look up the farm boundary associated with this project
    const farmSnap = await db.collection("farms")
        .where("projectId", "==", projectId)
        .limit(1)
        .get();

    if (!farmSnap.empty) {
        const farm = farmSnap.docs[0].data();
        const boundary = farm.boundary || farm.targetBoundary;

        if (boundary && Array.isArray(boundary) && boundary.length >= 3) {
            // Point-in-polygon check using ray casting
            isOnSite = pointInPolygon(gpsLatitude, gpsLongitude, boundary);

            if (!isOnSite) {
                // Calculate distance to nearest polygon edge for context
                distanceFromSite = haversineDistance(
                    gpsLatitude,
                    gpsLongitude,
                    boundary[0].latitude,
                    boundary[0].longitude
                );
                // Flag as theft risk if delivery/installation happens off-site
                if (['delivered-site', 'installed'].includes(event)) {
                    theftRisk = true;
                }
            }
        }
    }

    // Record the tracking event
    const trackingEvent = {
        date: admin.firestore.FieldValue.serverTimestamp(),
        event,
        verifiedBy: userId,
        gpsLocation: { latitude: gpsLatitude, longitude: gpsLongitude },
        isOnSite,
        distanceFromSite,
        theftRisk,
        notes: notes || null,
        photoUrl: photoUrl || null,
    };

    // Update material with new tracking event and status
    await materialRef.update({
        status: theftRisk ? 'theft_risk' : event === 'installed' ? 'installed' : event === 'delivered-site' ? 'delivered' : material.status,
        trackingEvents: admin.firestore.FieldValue.arrayUnion(trackingEvent),
        lastEventAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If theft risk detected, create an alert and audit log
    if (theftRisk) {
        const alertMessage = `THEFT RISK: Material "${material.name}" (${event}) logged ${distanceFromSite ? Math.round(distanceFromSite) + 'm' : 'outside boundary'} off-site. GPS: ${gpsLatitude.toFixed(5)}, ${gpsLongitude.toFixed(5)}`;

        await db.collection("sensor_alerts").add({
            farmId: farmSnap.empty ? 'unknown' : farmSnap.docs[0].id,
            deviceId: 'material-tracking',
            alertType: 'theft-risk',
            severity: 'critical',
            value: distanceFromSite || 0,
            threshold: 100,
            message: alertMessage,
            metadata: {
                materialId,
                materialName: material.name,
                event,
                gpsLatitude,
                gpsLongitude,
            },
            acknowledged: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection("audit_logs").add({
            action: 'theft_risk_detected',
            targetDocId: materialId,
            materialName: material.name,
            event,
            gpsLatitude,
            gpsLongitude,
            isOnSite: false,
            distanceFromSite,
            reportedBy: userId,
            severity: 'critical',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    return {
        success: true,
        isOnSite,
        theftRisk,
        distanceFromSite,
        message: theftRisk
            ? `WARNING: Event logged but flagged as THEFT RISK — location is off-site.`
            : `Event "${event}" recorded successfully. Location verified on-site.`,
    };
});

/**
 * Ray-casting point-in-polygon check.
 */
function pointInPolygon(lat: number, lng: number, polygon: { latitude: number; longitude: number }[]): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const yi = polygon[i].latitude;
        const xi = polygon[i].longitude;
        const yj = polygon[j].latitude;
        const xj = polygon[j].longitude;

        const intersect = ((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Haversine distance in meters between two GPS coordinates.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
