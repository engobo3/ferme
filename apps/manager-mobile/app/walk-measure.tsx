import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Polyline, Polygon, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import * as turf from '@turf/turf';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '@diaspora-trust/core-logic';
import { colors, palette, spacing, radius, typeScale, MIN_TOUCH_TARGET } from '@diaspora-trust/shared-ui';

const { width } = Dimensions.get('window');

interface Coordinate {
    latitude: number;
    longitude: number;
}

type Mode = 'tracking' | 'pinning' | 'hybrid';

export default function WalkToMeasureScreen() {
    const { taskId } = useLocalSearchParams();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
    const [currentArea, setCurrentArea] = useState<number | null>(null); // In Hectares
    const [saving, setSaving] = useState(false);
    const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
    const [mode, setMode] = useState<Mode>('tracking');
    const [targetBoundary, setTargetBoundary] = useState<Coordinate[]>([]);

    const mapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const isMeasuringRef = useRef(isMeasuring);
    isMeasuringRef.current = isMeasuring;
    const modeRef = useRef(mode);
    modeRef.current = mode;

    // Load Task Data for Hybrid Mode
    useEffect(() => {
        if (!taskId) return;
        firestore().collection('tasks').doc(taskId as string).get().then(doc => {
            if (doc.exists()) {
                const data = doc.data() as Task;
                if (data.targetBoundary && data.targetBoundary.length > 2) {
                    setTargetBoundary(data.targetBoundary);
                    setMode('hybrid'); // Auto-switch if ghost polygon exists
                    Alert.alert('Mode hybride', 'Une limite a été prédéfinie. Marchez jusqu’à un coin pour la vérifier.');
                }
            }
        });
    }, [taskId]);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setHasPermission(status === 'granted');
            if (status !== 'granted') {
                Alert.alert('L’accès à la position a été refusé');
                return;
            }

            // Get initial location
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            // Start watching regardless of measuring state, just to show blue dot
            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    distanceInterval: 2,
                },
                (loc) => {
                    const newCoord = {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                    };
                    setUserLocation(newCoord);

                    if (isMeasuringRef.current && modeRef.current === 'tracking') {
                        setCoordinates((prev) => [...prev, newCoord]);
                    }
                }
            );
        })();

        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, []); // Stable — uses refs for mutable state

    const startMeasuring = async () => {
        if (!hasPermission) return;
        setIsMeasuring(true);
        setCoordinates([]);
        setCurrentArea(null);
    };

    const stopMeasuring = () => {
        setIsMeasuring(false);
        if (coordinates.length < 3) {
            Alert.alert('Erreur', 'Pas assez de points. Il en faut au moins 3.');
            return;
        }
        calculateArea();
    };

    const dropPin = () => {
        if (!userLocation) return;
        setCoordinates(prev => [...prev, userLocation]);
    };

    const undoLastPin = () => {
        setCoordinates(prev => prev.slice(0, -1));
    };

    const verifyLocationMatch = () => {
        if (!userLocation || targetBoundary.length === 0) return;

        // Simple verification: Check if user is within 20m of ANY target corner
        const userPoint = turf.point([userLocation.longitude, userLocation.latitude]);
        let matched = false;

        for (const target of targetBoundary) {
            const targetPoint = turf.point([target.longitude, target.latitude]);
            const distance = turf.distance(userPoint, targetPoint, { units: 'meters' });
            if (distance <= 20) {
                matched = true;
                break;
            }
        }

        if (matched) {
            // Mock success
            // In real app, we might calculate overlapping area or more complex check
            Alert.alert('Succès', 'Position vérifiée ! Vous êtes à un coin valide.');
            // Calculate area of target boundary to save
            setCoordinates(targetBoundary); // Adopt the target as the measured result
            calculateArea(targetBoundary);
            saveMeasurement(true); // Auto-save
        } else {
            Alert.alert('Vérification échouée', 'Vous n’êtes pas assez proche d’un coin de la limite désignée.');
        }
    };

    const calculateArea = (coordsToUse = coordinates) => {
        // Close the polygon
        const closedCoords = [...coordsToUse];
        if (
            closedCoords.length > 0 &&
            (closedCoords[0].latitude !== closedCoords[closedCoords.length - 1].latitude ||
                closedCoords[0].longitude !== closedCoords[closedCoords.length - 1].longitude)
        ) {
            closedCoords.push(closedCoords[0]);
        }

        const turfCoords = closedCoords.map(c => [c.longitude, c.latitude]);
        const polygon = turf.polygon([turfCoords]);
        const areaSqMeters = turf.area(polygon);
        const areaHectares = areaSqMeters / 10000;

        setCurrentArea(areaHectares);
    };

    // const { } = useLocalSearchParams(); // Already destructured above

    const saveMeasurement = async (instant = false) => {
        if (!instant && (currentArea === null || coordinates.length === 0)) return;

        setSaving(true);
        try {
            const measurementData = {
                measuredAt: new Date().toISOString(),
                areaHectares: currentArea,
                coordinates: coordinates,
                type: mode === 'hybrid' ? 'hybrid-verification' : 'walk-verification',
                verifiedBy: auth().currentUser?.displayName || auth().currentUser?.uid || 'inconnu',
                devicePlatform: 'mobile',
                timestamp: Date.now(),
                notes: `${currentArea?.toFixed(4)} ha vérifiés (mode ${mode})`
            };

            if (taskId) {
                // Construct GeoJSON Polygon
                const turfCoords = coordinates.map(c => [c.longitude, c.latitude]);
                // Close ring
                if (turfCoords.length > 0 && (turfCoords[0][0] !== turfCoords[turfCoords.length - 1][0] || turfCoords[0][1] !== turfCoords[turfCoords.length - 1][1])) {
                    turfCoords.push([...turfCoords[0]]);
                }

                await firestore().collection('tasks').doc(taskId as string).update({
                    // 1. Evidence Array (Legacy/List)
                    evidence: firestore.FieldValue.arrayUnion({
                        gpsLocation: {
                            latitude: coordinates[0].latitude,
                            longitude: coordinates[0].longitude
                        },
                        timestamp: Date.now(),
                        notes: measurementData.notes,
                    }),
                    // 2. Truth Gap Data (For Web Dashboard)
                    geojson: {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [turfCoords]
                        },
                        properties: {
                            areaHa: currentArea,
                            verifiedAt: new Date().toISOString()
                        }
                    }
                });

                const mRef = await firestore().collection('farm_measurements').add({
                    ...measurementData,
                    taskId: taskId
                });

                if (!instant) Alert.alert('Enregistré', `Surface vérifiée : ${currentArea?.toFixed(4)} ha`);
                router.back();
            } else {
                await firestore().collection('farm_measurements').add({
                    ...measurementData,
                    measuredAt: firestore.FieldValue.serverTimestamp()
                });
                if (!instant) Alert.alert('Succès', `Mesure enregistrée : ${currentArea?.toFixed(4)} ha`);
                setCoordinates([]);
                setCurrentArea(null);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Échec de l’enregistrement.');
        } finally {
            setSaving(false);
        }
    };

    if (hasPermission === null) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    if (hasPermission === false) {
        return <View style={styles.center}><Text>Accès à la position refusé</Text></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.modeSelector}>
                <TouchableOpacity onPress={() => setMode('tracking')} style={[styles.modeBtn, mode === 'tracking' && styles.activeMode]}>
                    <Text style={[styles.modeText, mode === 'tracking' && styles.activeModeText]}>Marche</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('pinning')} style={[styles.modeBtn, mode === 'pinning' && styles.activeMode]}>
                    <Text style={[styles.modeText, mode === 'pinning' && styles.activeModeText]}>Repères</Text>
                </TouchableOpacity>
                {targetBoundary.length > 0 && (
                    <TouchableOpacity onPress={() => setMode('hybrid')} style={[styles.modeBtn, mode === 'hybrid' && styles.activeMode]}>
                        <Text style={[styles.modeText, mode === 'hybrid' && styles.activeModeText]}>Hybride</Text>
                    </TouchableOpacity>
                )}
            </View>

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                showsUserLocation={true}
                initialRegion={userLocation ? {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                } : undefined}
            >
                {/* User Path / Pins */}
                {coordinates.length > 0 && (
                    <>
                        <Polyline
                            coordinates={coordinates}
                            strokeColor={palette.black}
                            strokeWidth={3}
                        />
                        {/* Show markers for pins in pinning mode */}
                        {mode === 'pinning' && coordinates.map((c, i) => (
                            <Marker key={i} coordinate={c} title={`Coin ${i + 1}`} />
                        ))}
                    </>
                )}

                {/* Completed Polygon */}
                {!isMeasuring && coordinates.length > 2 && (
                    <Polygon
                        coordinates={coordinates}
                        fillColor="rgba(0, 200, 0, 0.5)"
                        strokeColor="rgba(0, 200, 0, 0.8)"
                        strokeWidth={2}
                    />
                )}

                {/* Ghost Polygon for Hybrid Mode */}
                {mode === 'hybrid' && targetBoundary.length > 0 && (
                    <Polygon
                        coordinates={targetBoundary}
                        fillColor="rgba(0, 0, 255, 0.1)" // Light Blue transparent
                        strokeColor="rgba(0, 0, 255, 0.5)" // Blue dashed
                        strokeWidth={2}
                        lineDashPattern={[5, 5]}
                    />
                )}

                {/* Ghost Pins */}
                {mode === 'hybrid' && targetBoundary.map((c, i) => (
                    <Marker key={`target-${i}`} coordinate={c} pinColor="blue" title={`Coin cible ${i + 1}`} />
                ))}
            </MapView>

            <View style={styles.overlay}>
                {mode !== 'hybrid' && (
                    <View style={styles.statsContainer}>
                        <Text style={styles.statsLabel}>Points : {coordinates.length}</Text>
                        {currentArea !== null && (
                            <Text style={styles.areaText}>
                                {currentArea.toFixed(4)} hectares
                            </Text>
                        )}
                    </View>
                )}

                {mode === 'hybrid' && (
                    <View style={styles.statsContainer}>
                        <Text style={styles.statsLabel}>Vérification hybride</Text>
                        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
                            Marchez jusqu’à un repère bleu puis appuyez sur « Je suis ici ».
                        </Text>
                    </View>
                )}

                <View style={styles.controls}>
                    {/* START / STOP LOGIC */}
                    {mode !== 'hybrid' && !isMeasuring && currentArea === null && (
                        <TouchableOpacity style={[styles.btn, styles.btnStart]} onPress={startMeasuring}>
                            <Text style={styles.btnText}>{mode === 'tracking' ? 'Commencer la marche' : 'Commencer le marquage'}</Text>
                        </TouchableOpacity>
                    )}

                    {/* TRACKING MODE STOP */}
                    {mode === 'tracking' && isMeasuring && (
                        <TouchableOpacity style={[styles.btn, styles.btnStop]} onPress={stopMeasuring}>
                            <Text style={styles.btnText}>Terminer le tour</Text>
                        </TouchableOpacity>
                    )}

                    {/* PINNING MODE CONTROLS */}
                    {mode === 'pinning' && isMeasuring && (
                        <View style={styles.pinControls}>
                            <TouchableOpacity style={[styles.btn, styles.btnSecondary, { flex: 1 }]} onPress={undoLastPin}>
                                <Text style={styles.btnTextSecondary}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnStart, { flex: 2, marginHorizontal: 5 }]} onPress={dropPin}>
                                <Text style={styles.btnText}>Poser un repère</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnStop, { flex: 1 }]} onPress={stopMeasuring}>
                                <Text style={styles.btnText}>Terminer</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* HYBRID MODE CONTROLS */}
                    {mode === 'hybrid' && (
                        <TouchableOpacity style={[styles.btn, styles.btnStart]} onPress={verifyLocationMatch}>
                            <Text style={styles.btnText}>Je suis ici (Vérifier)</Text>
                        </TouchableOpacity>
                    )}

                    {!isMeasuring && currentArea !== null && (
                        <View style={styles.resultActions}>
                            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={startMeasuring}>
                                <Text style={styles.btnTextSecondary}>Recommencer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={() => saveMeasurement(false)} disabled={saving}>
                                <Text style={styles.btnText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                    <Ionicons name="close" size={20} color={colors.onDark} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    modeSelector: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.full,
        padding: spacing.xs,
        zIndex: 10,
        elevation: 5,
        shadowColor: palette.black,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 }
    },
    modeBtn: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: radius.full,
    },
    activeMode: {
        backgroundColor: colors.primary,
    },
    modeText: {
        fontWeight: 'bold',
        color: colors.textMuted,
    },
    activeModeText: {
        color: colors.onPrimary,
    },
    overlay: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statsContainer: {
        marginBottom: spacing.lg,
        alignItems: 'center',
    },
    statsLabel: {
        fontSize: typeScale.label,
        color: colors.textMuted,
    },
    areaText: {
        fontSize: typeScale.title,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: spacing.xs,
    },
    controls: {
        alignItems: 'center',
    },
    pinControls: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    btn: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.full,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: MIN_TOUCH_TARGET,
    },
    btnStart: {
        backgroundColor: colors.info,
    },
    btnStop: {
        backgroundColor: colors.danger,
    },
    btnSave: {
        backgroundColor: colors.primary,
        flex: 1,
        marginLeft: 10,
    },
    btnSecondary: {
        backgroundColor: colors.surfaceMuted,
        flex: 1,
        marginRight: 10,
    },
    resultActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    btnText: {
        color: colors.onDark,
        fontSize: typeScale.body,
        fontWeight: 'bold',
    },
    btnTextSecondary: {
        color: colors.text,
        fontSize: typeScale.body,
        fontWeight: 'bold',
    },
    closeBtn: {
        position: 'absolute',
        top: -50,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 36,
        height: 36,
        borderRadius: radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
