import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Worklets } from 'react-native-worklets-core';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { colors, palette, spacing, radius, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';
import { mediaQueue } from '../services/MediaQueueService';

export default function CropScanScreen() {
    const { taskId } = useLocalSearchParams();
    const router = useRouter();
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const cameraRef = useRef<Camera>(null);

    const [model, setModel] = useState<TensorflowModel | null>(null);
    const [prediction, setPrediction] = useState<string | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Load the TFLite model
    const plugin = useTensorflowModel(require('../assets/crop_verification_metadata.tflite'));
    const { resize } = useResizePlugin();

    useEffect(() => {
        if (plugin.state === 'loaded' && plugin.model) {
            setModel(plugin.model);
        } else if (plugin.state === 'error') {
            console.error('Failed to load model:', plugin.error);
        }
    }, [plugin]);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    const updatePrediction = Worklets.createRunOnJS((resultString: string) => {
        setPrediction(resultString);
    });

    // Expected labels from the model (Order matters! Must match training)
    // French display names — order mirrors the model's training classes.
    const LABELS = ['Manioc', 'Maïs', 'Banane', 'Sain'];

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        if (!model) return;

        // Resize to 224x224 (Standard MobileNetV2 input)
        const resized = resize(frame, {
            scale: { width: 224, height: 224 },
            pixelFormat: 'rgb',
            dataType: 'uint8',
        });

        try {
            const result = model.runSync([resized]);
            if (result && result.length > 0) {
                const probabilities = result[0];
                let maxScore = -1;
                let maxIndex = -1;

                if (probabilities) {
                    for (let i = 0; i < (probabilities.length || 0); i++) {
                        const score = Number(probabilities[i]);
                        if (score > maxScore) {
                            maxScore = score;
                            maxIndex = i;
                        }
                    }
                }

                if (maxIndex !== -1) {
                    const label = LABELS[maxIndex] || `Classe ${maxIndex}`;
                    const confidence = (maxScore * 100).toFixed(1);
                    updatePrediction(`${label} (${confidence}%)`);
                }
            }
        } catch (e) {
            console.error('Inference error:', e);
        }
    }, [model]);

    const takePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePhoto({
                    flash: 'off'
                });
                setCapturedPhoto(photo);
            } catch (error) {
                console.error("Failed to take photo", error);
                Alert.alert(t('common.error'), 'Impossible de prendre la photo');
            }
        }
    };

    const saveEvidence = async () => {
        if (!capturedPhoto || !taskId) return;

        setSaving(true);
        try {
            // OUTBOX PATTERN: Offline Queue
            await mediaQueue.addJob({
                localPath: capturedPhoto.path,
                storagePath: `evidence/${taskId}/${Date.now()}.jpg`,
                firestoreCollection: 'tasks',
                firestoreId: taskId as string,
                fieldName: 'evidence',
                metadata: {
                    type: 'photo_ai_crop',
                    timestamp: Date.now(),
                    notes: `Vérifié par IA : ${prediction || 'Inconnu'}`,
                    aiLabel: prediction
                }
            });

            Alert.alert(
                'Enregistré dans la file ☁️',
                'Vérification en file d’attente. Gardez l’application OUVERTE jusqu’à ce que l’icône nuage devienne verte dans la liste des tâches.'
            );
            router.back();
        } catch (error: any) {
            console.error("Save error", error);
            Alert.alert(t('common.error'), `Échec de la mise en file : ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!hasPermission) return <View style={styles.center}><Text style={styles.infoText}>Autorisation caméra requise</Text></View>;
    if (!device) return <View style={styles.center}><Text style={styles.infoText}>Aucune caméra détectée</Text></View>;

    if (capturedPhoto) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: 'file://' + capturedPhoto.path }} style={styles.previewImage} />
                <View style={styles.previewOverlay}>
                    <Text style={styles.aiResult}>Détecté : {prediction}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setCapturedPhoto(null)}>
                            <Text style={styles.btnTextSec}>{t('task.retakePhoto')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={saveEvidence} disabled={saving}>
                            <Text style={styles.btnText}>{saving ? 'Enregistrement…' : 'Enregistrer la preuve'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {model ? (
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    frameProcessor={frameProcessor}
                    pixelFormat="yuv"
                    photo={true}
                />
            ) : (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.infoText}>Chargement du modèle IA…</Text>
                </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={colors.onDark} />
            </TouchableOpacity>

            <View style={styles.overlay}>
                <Text style={styles.text}>{prediction || 'Analyse…'}</Text>
                <TouchableOpacity style={styles.shutterBtn} onPress={takePhoto}>
                    <View style={styles.shutterInner} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.black,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    infoText: {
        color: colors.onDark,
        fontSize: typeScale.body,
    },
    overlay: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    text: {
        color: colors.onDark,
        fontSize: typeScale.heading,
        fontWeight: 'bold',
        marginBottom: spacing.xl,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: spacing.sm,
        borderRadius: radius.sm,
    },
    shutterBtn: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterInner: {
        width: 60,
        height: 60,
        borderRadius: radius.full,
        backgroundColor: palette.white,
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: MIN_TOUCH_TARGET,
        height: MIN_TOUCH_TARGET,
        borderRadius: radius.full,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    previewImage: {
        flex: 1,
        resizeMode: 'cover',
    },
    previewOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        padding: spacing.xxl,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
    },
    aiResult: {
        fontSize: typeScale.title,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.text,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.lg,
    },
    btn: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: MIN_TOUCH_TARGET,
    },
    btnPrimary: {
        backgroundColor: colors.primary,
    },
    btnSecondary: {
        backgroundColor: colors.surfaceMuted,
    },
    btnText: {
        color: colors.onPrimary,
        fontWeight: 'bold',
        fontSize: typeScale.body,
    },
    btnTextSec: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: typeScale.body,
    }
});
