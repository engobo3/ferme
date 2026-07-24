import { useState, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import type { MaterialTrackingEvent } from '@diaspora-trust/core-logic';

interface TrackingState {
    isSubmitting: boolean;
    error: string | null;
    success: boolean;
}

/**
 * Hook for operators to log material tracking events on-site.
 * Supports: delivery confirmation, installation logging, damage/missing reports.
 */
export function useMaterialTracking(materialId: string) {
    const [state, setState] = useState<TrackingState>({
        isSubmitting: false,
        error: null,
        success: false,
    });

    const logEvent = useCallback(async (event: {
        type: MaterialTrackingEvent['event'];
        verifiedBy: string;
        photoUrl?: string;
        gpsLocation?: { latitude: number; longitude: number };
        notes?: string;
    }) => {
        setState({ isSubmitting: true, error: null, success: false });

        try {
            const trackingEvent: MaterialTrackingEvent = {
                date: Date.now(),
                event: event.type,
                verifiedBy: event.verifiedBy,
                photoUrl: event.photoUrl,
                gpsLocation: event.gpsLocation,
                notes: event.notes,
            };

            await firestore().collection('materials').doc(materialId).update({
                trackingEvents: firestore.FieldValue.arrayUnion(trackingEvent),
                status: event.type === 'installed' ? 'installed'
                    : event.type === 'delivered-site' ? 'delivered'
                    : event.type === 'missing' ? 'missing'
                    : undefined,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });

            setState({ isSubmitting: false, error: null, success: true });
        } catch (err) {
            setState({
                isSubmitting: false,
                error: err instanceof Error ? err.message : 'Failed to log event',
                success: false,
            });
        }
    }, [materialId]);

    return { ...state, logEvent };
}
