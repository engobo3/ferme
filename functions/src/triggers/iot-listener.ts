import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Firestore trigger: listens for new sensor readings from ESP32 devices.
 * Checks environmental thresholds and creates alerts if out of range.
 */
export const onSensorReading = functions.firestore
    .document("sensor_readings/{readingId}")
    .onCreate(async (snap, context) => {
        const reading = snap.data();
        const db = admin.firestore();

        // Fetch the active poultry batch for this farm to determine week
        const batchSnap = await db.collection("poultry_batches")
            .where("farmId", "==", reading.farmId)
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (batchSnap.empty) {
            // No active batch - just log the reading
            console.log(`[IoT] Reading from ${reading.deviceId} - no active batch for farm ${reading.farmId}`);
            return;
        }

        const batch = batchSnap.docs[0].data();
        // Handle both Firestore Timestamp and epoch number
        const startMs = typeof batch.startDate === 'number' ? batch.startDate : batch.startDate?.toMillis?.() ?? batch.startDate;
        const daysSinceStart = Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.min(Math.max(1, Math.ceil(daysSinceStart / 7)), 6);

        // Temperature thresholds by week (broiler standards)
        const tempThresholds: Record<number, { min: number; max: number }> = {
            1: { min: 32, max: 35 },
            2: { min: 29, max: 32 },
            3: { min: 27, max: 29 },
            4: { min: 24, max: 27 },
            5: { min: 21, max: 24 },
            6: { min: 21, max: 24 },
        };

        const threshold = tempThresholds[currentWeek];
        if (!threshold) return;

        let alertType: string | null = null;
        let severity: string = 'warning';

        if (reading.sensorType === 'temperature') {
            if (reading.value > threshold.max) {
                alertType = 'high-temp';
                severity = reading.value > threshold.max + 3 ? 'critical' : 'warning';
            } else if (reading.value < threshold.min) {
                alertType = 'low-temp';
                severity = reading.value < threshold.min - 3 ? 'critical' : 'warning';
            }
        }

        if (reading.sensorType === 'humidity') {
            if (reading.value > 70) {
                alertType = 'high-humidity';
            } else if (reading.value < 60) {
                alertType = 'low-humidity';
            }
        }

        // Battery check
        if (reading.batteryPercent !== undefined && reading.batteryPercent < 20) {
            await db.collection("sensor_alerts").add({
                farmId: reading.farmId,
                deviceId: reading.deviceId,
                alertType: 'battery-low',
                severity: reading.batteryPercent < 10 ? 'critical' : 'info',
                value: reading.batteryPercent,
                threshold: 20,
                message: `Device ${reading.deviceId} battery at ${reading.batteryPercent}%`,
                acknowledged: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        if (alertType) {
            await db.collection("sensor_alerts").add({
                farmId: reading.farmId,
                deviceId: reading.deviceId,
                alertType,
                severity,
                value: reading.value,
                threshold: reading.sensorType === 'temperature'
                    ? (alertType.includes('high') ? threshold.max : threshold.min)
                    : (alertType.includes('high') ? 70 : 60),
                message: `${reading.sensorType} ${alertType}: ${reading.value}${reading.unit} (Week ${currentWeek})`,
                acknowledged: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[IoT ALERT] ${alertType} - ${reading.value}${reading.unit} from ${reading.deviceId}`);
        }
    });
