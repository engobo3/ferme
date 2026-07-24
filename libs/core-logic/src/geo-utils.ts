/**
 * Geofencing and GPS utilities.
 * Zero external dependencies - uses Haversine formula and ray-casting.
 */

export interface Coordinate {
    latitude: number;
    longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Haversine distance between two GPS coordinates in meters.
 */
export function haversineDistance(a: Coordinate, b: Coordinate): number {
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);

    const h = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * Check if a point is inside a polygon (ray-casting algorithm).
 * Used for geofencing: is the worker within the farm boundary?
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].latitude, yi = polygon[i].longitude;
        const xj = polygon[j].latitude, yj = polygon[j].longitude;

        const intersect = ((yi > point.longitude) !== (yj > point.longitude)) &&
            (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Check if a worker is within the farm boundary with a tolerance buffer.
 */
export function isWorkerOnSite(
    workerLocation: Coordinate,
    farmBoundary: Coordinate[],
    bufferMeters: number = 50
): { onSite: boolean; nearestBoundaryDistance: number } {
    const onSite = isPointInPolygon(workerLocation, farmBoundary);

    let nearest = Infinity;
    for (const bp of farmBoundary) {
        const dist = haversineDistance(workerLocation, bp);
        if (dist < nearest) nearest = dist;
    }

    if (!onSite && nearest <= bufferMeters) {
        return { onSite: true, nearestBoundaryDistance: nearest };
    }

    return { onSite, nearestBoundaryDistance: nearest };
}

/**
 * Calculate the area of a polygon in hectares using the Shoelace formula
 * with latitude correction. Accurate for small-area polygons (farms).
 */
export function calculateAreaHectares(polygon: Coordinate[]): number {
    if (polygon.length < 3) return 0;

    const coords = [...polygon];
    if (coords[0].latitude !== coords[coords.length - 1].latitude ||
        coords[0].longitude !== coords[coords.length - 1].longitude) {
        coords.push(coords[0]);
    }

    const avgLat = coords.reduce((s, c) => s + c.latitude, 0) / coords.length;
    const latMetersPerDeg = 111_320;
    const lonMetersPerDeg = 111_320 * Math.cos(toRadians(avgLat));

    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const x1 = coords[i].longitude * lonMetersPerDeg;
        const y1 = coords[i].latitude * latMetersPerDeg;
        const x2 = coords[i + 1].longitude * lonMetersPerDeg;
        const y2 = coords[i + 1].latitude * latMetersPerDeg;
        area += x1 * y2 - x2 * y1;
    }
    area = Math.abs(area) / 2;

    return area / 10_000;
}

/**
 * Generate a random point within a polygon boundary for "Challenge Check" location.
 * Used by the trust layer to send random GPS verification challenges.
 */
export function generateChallengePoint(farmBoundary: Coordinate[]): Coordinate {
    const minLat = Math.min(...farmBoundary.map(c => c.latitude));
    const maxLat = Math.max(...farmBoundary.map(c => c.latitude));
    const minLon = Math.min(...farmBoundary.map(c => c.longitude));
    const maxLon = Math.max(...farmBoundary.map(c => c.longitude));

    let attempts = 0;
    while (attempts < 100) {
        const point: Coordinate = {
            latitude: minLat + Math.random() * (maxLat - minLat),
            longitude: minLon + Math.random() * (maxLon - minLon),
        };
        if (isPointInPolygon(point, farmBoundary)) return point;
        attempts++;
    }

    return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
    };
}
