import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { isWorkerOnSite, type Coordinate } from '@diaspora-trust/core-logic';

interface GeofenceState {
    isOnSite: boolean;
    isChecking: boolean;
    currentLocation: Coordinate | null;
    distance: number | null;
    error: string | null;
}

/**
 * Hook to verify worker is within farm geofence.
 * Checks GPS location against farm boundary polygon.
 */
export function useGeofence(farmBoundary: Coordinate[], bufferMeters: number = 50) {
    const [state, setState] = useState<GeofenceState>({
        isOnSite: false,
        isChecking: false,
        currentLocation: null,
        distance: null,
        error: null,
    });

    const checkLocation = useCallback(async () => {
        setState(prev => ({ ...prev, isChecking: true, error: null }));

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setState(prev => ({ ...prev, isChecking: false, error: 'Autorisation de localisation refusée' }));
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const workerLocation: Coordinate = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            const result = isWorkerOnSite(workerLocation, farmBoundary, bufferMeters);

            setState({
                isOnSite: result.onSite,
                isChecking: false,
                currentLocation: workerLocation,
                distance: result.nearestBoundaryDistance,
                error: null,
            });
        } catch (err) {
            setState(prev => ({
                ...prev,
                isChecking: false,
                error: err instanceof Error ? err.message : 'Échec de la vérification de la position',
            }));
        }
    }, [farmBoundary, bufferMeters]);

    return { ...state, checkLocation };
}
