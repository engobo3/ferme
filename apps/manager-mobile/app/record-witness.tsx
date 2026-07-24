// mobile/app/record-witness.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission, VideoFile } from 'react-native-vision-camera';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { colors, palette, spacing, radius, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';
import { mediaQueue } from '../services/MediaQueueService';

const { width } = Dimensions.get('window');

export default function RecordWitnessScreen() {
    const { taskId } = useLocalSearchParams();
    const router = useRouter();
    const cameraRef = useRef<Camera>(null);
    const device = useCameraDevice('back');

    // Permissions
    const { hasPermission: hasCamPermission, requestPermission: reqCam } = useCameraPermission();
    const { hasPermission: hasMicPermission, requestPermission: reqMic } = useMicrophonePermission();

    const [isRecording, setIsRecording] = useState(false);
    const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
    const [witnessName, setWitnessName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!hasCamPermission) reqCam();
        if (!hasMicPermission) reqMic();
    }, [hasCamPermission, hasMicPermission]);

    const startRecording = async () => {
        if (!cameraRef.current) return;
        setIsRecording(true);
        try {
            cameraRef.current.startRecording({
                onRecordingFinished: (video) => setVideoFile(video),
                onRecordingError: (error) => console.error("Rec Error", error)
            });
        } catch (e) {
            console.error("Failed to start recording", e);
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        if (!cameraRef.current) return;
        await cameraRef.current.stopRecording();
        setIsRecording(false);
    };

    const saveEvidence = async () => {
        if (!videoFile || !taskId || !witnessName) {
            Alert.alert('Informations manquantes', 'Veuillez enregistrer une vidéo et saisir le nom du témoin.');
            return;
        }

        setSaving(true);
        try {
            // OUTBOX PATTERN: Add to Offline Queue
            await mediaQueue.addJob({
                localPath: videoFile.path,
                storagePath: `evidence/${taskId}/${Date.now()}.mp4`,
                firestoreCollection: 'tasks',
                firestoreId: taskId as string,
                fieldName: 'evidence',
                metadata: {
                    witnessName: witnessName,
                    witnessRole: 'Chef du village / Autorité',
                    type: 'video_witness',
                    notes: `Témoin : ${witnessName}`
                }
            });

            Alert.alert(
                'Enregistré dans la file ☁️',
                'Preuve en file d’attente. Gardez l’application OUVERTE jusqu’à ce que l’icône nuage devienne verte dans la liste des tâches.'
            );
            router.back();
        } catch (error: any) {
            console.error(error);
            Alert.alert(t('common.error'), `Échec de la mise en file : ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!hasCamPermission || !hasMicPermission) return <View style={styles.center}><Text style={styles.infoText}>Autorisations requises</Text></View>;
    if (!device) return <View style={styles.center}><Text style={styles.infoText}>Aucune caméra détectée</Text></View>;

    if (videoFile) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.center}>
                    <Ionicons name="videocam" size={80} color={colors.onDark} />
                    <Text style={styles.successText}>Vidéo enregistrée !</Text>
                    <Text style={styles.durationText}>{(videoFile.duration).toFixed(1)} secondes</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Nom du témoin (ex : Chef Kossi)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Saisir le nom"
                        placeholderTextColor={colors.textFaint}
                        value={witnessName}
                        onChangeText={setWitnessName}
                    />

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setVideoFile(null)}>
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
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                video={true}
                audio={true}
            />

            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={colors.onDark} />
            </TouchableOpacity>

            <View style={styles.overlay}>
                <Text style={styles.instruction}>Maintenez pour enregistrer le témoignage</Text>
                <TouchableOpacity
                    style={[styles.recordBtn, isRecording && styles.recording]}
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                >
                    <View style={styles.recordInner} />
                </TouchableOpacity>
                {isRecording && <Text style={styles.recordingText}>Enregistrement…</Text>}
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
    instruction: {
        color: colors.onDark,
        marginBottom: spacing.xl,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: spacing.sm,
        borderRadius: radius.sm,
    },
    recordBtn: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        borderWidth: 5,
        borderColor: palette.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recording: {
        borderColor: colors.danger,
        transform: [{ scale: 1.1 }]
    },
    recordInner: {
        width: 60,
        height: 60,
        borderRadius: radius.full,
        backgroundColor: colors.danger,
    },
    recordingText: {
        color: colors.danger,
        marginTop: spacing.md,
        fontWeight: 'bold',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: MIN_TOUCH_TARGET,
        height: MIN_TOUCH_TARGET,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    successText: {
        color: colors.onDark,
        fontSize: typeScale.title,
        fontWeight: 'bold',
        marginTop: spacing.xl,
    },
    durationText: {
        color: colors.border,
    },
    form: {
        backgroundColor: colors.surface,
        padding: spacing.xxl,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: spacing.md,
        color: colors.text,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        borderRadius: radius.sm,
        marginBottom: spacing.xl,
        fontSize: typeScale.body,
        color: colors.text,
    },
    actionRow: {
        flexDirection: 'row',
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
    btnPrimary: { backgroundColor: colors.primary },
    btnSecondary: { backgroundColor: colors.surfaceMuted },
    btnText: { color: colors.onPrimary, fontWeight: 'bold' },
    btnTextSec: { color: colors.text, fontWeight: 'bold' }
});
