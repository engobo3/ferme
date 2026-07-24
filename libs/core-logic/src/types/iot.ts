export interface SensorReading {
    id: string;
    farmId: string;
    deviceId: string;
    sensorType: 'temperature' | 'humidity' | 'soil-moisture' | 'light';
    value: number;
    unit: string;
    timestamp: number;
    batteryPercent?: number;
}

export interface SensorAlert {
    id: string;
    farmId: string;
    deviceId: string;
    alertType: 'high-temp' | 'low-temp' | 'high-humidity' | 'low-humidity' | 'device-offline' | 'battery-low';
    severity: 'info' | 'warning' | 'critical';
    value: number;
    threshold: number;
    message: string;
    acknowledged: boolean;
    timestamp: number;
}

/** Thresholds for poultry house environmental monitoring by week */
export const POULTRY_ENVIRONMENT_THRESHOLDS: {
    week: number;
    tempMinC: number;
    tempMaxC: number;
    humidityMinPercent: number;
    humidityMaxPercent: number;
}[] = [
    { week: 1, tempMinC: 32, tempMaxC: 35, humidityMinPercent: 60, humidityMaxPercent: 70 },
    { week: 2, tempMinC: 29, tempMaxC: 32, humidityMinPercent: 60, humidityMaxPercent: 70 },
    { week: 3, tempMinC: 27, tempMaxC: 29, humidityMinPercent: 60, humidityMaxPercent: 70 },
    { week: 4, tempMinC: 24, tempMaxC: 27, humidityMinPercent: 60, humidityMaxPercent: 70 },
    { week: 5, tempMinC: 21, tempMaxC: 24, humidityMinPercent: 60, humidityMaxPercent: 70 },
    { week: 6, tempMinC: 21, tempMaxC: 24, humidityMinPercent: 60, humidityMaxPercent: 70 },
];

/**
 * Check if a sensor reading is within acceptable thresholds for a given poultry week.
 */
export function checkPoultryEnvironment(
    reading: SensorReading,
    batchWeek: number
): { inRange: boolean; alertType?: SensorAlert['alertType']; severity?: SensorAlert['severity'] } {
    const threshold = POULTRY_ENVIRONMENT_THRESHOLDS.find(t => t.week === batchWeek);
    if (!threshold) return { inRange: true };

    if (reading.sensorType === 'temperature') {
        if (reading.value > threshold.tempMaxC) {
            return { inRange: false, alertType: 'high-temp', severity: reading.value > threshold.tempMaxC + 3 ? 'critical' : 'warning' };
        }
        if (reading.value < threshold.tempMinC) {
            return { inRange: false, alertType: 'low-temp', severity: reading.value < threshold.tempMinC - 3 ? 'critical' : 'warning' };
        }
    }

    if (reading.sensorType === 'humidity') {
        if (reading.value > threshold.humidityMaxPercent) {
            return { inRange: false, alertType: 'high-humidity', severity: 'warning' };
        }
        if (reading.value < threshold.humidityMinPercent) {
            return { inRange: false, alertType: 'low-humidity', severity: 'warning' };
        }
    }

    return { inRange: true };
}
