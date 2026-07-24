import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { Task, formatMoney, getRegion, isOverdue, formatDateFR, CurrencyCode } from '@diaspora-trust/core-logic';
import { colors, palette, spacing, radius, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';
import { StatusBadge } from '@diaspora-trust/shared-ui/src/components/StatusBadge';
import { mediaQueue, MediaJob } from '../../services/MediaQueueService';
import { ClockInButton } from '../../features/clock-in/components/ClockInButton';
import { useGeofence } from '../../features/clock-in/hooks/useGeofence';

export default function TaskDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [localJobs, setLocalJobs] = useState<MediaJob[]>([]);
    const [userRole, setUserRole] = useState<string>('operator');

    // Geofenced clock-in (only shown when the task carries a target boundary)
    const targetBoundary = task?.targetBoundary ?? [];
    const { isOnSite, isChecking, currentLocation, error: geofenceError, checkLocation } = useGeofence(targetBoundary);

    // Fetch real role from Firestore user doc
    useEffect(() => {
        const currentUser = auth().currentUser;
        if (!currentUser) return;
        const unsubRole = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot((snap) => {
                if (snap.exists()) {
                    const role = snap.data()?.role;
                    setUserRole(role === 'admin' ? 'funder' : (role || 'operator'));
                }
            });
        return () => unsubRole();
    }, []);

    useEffect(() => {
        if (!id) return;

        // 1. Local Queue Subscription
        const unsubscribeQueue = mediaQueue.subscribe((queue) => {
            const relevant = queue.filter(j => j.firestoreId === (id as string));
            setLocalJobs(relevant);
        });

        // 2. Real-time Firestore listener
        const unsubscribeFirestore = firestore()
            .collection('tasks')
            .doc(id as string)
            .onSnapshot(
                (doc) => {
                    if (doc.exists()) {
                        setTask({ id: doc.id, ...doc.data() } as Task);
                    } else {
                        Alert.alert(t('common.error'), 'Tâche introuvable');
                        router.back();
                    }
                    setLoading(false);
                },
                (err) => {
                    console.error(err);
                    Alert.alert(t('common.error'), 'Échec du chargement de la tâche');
                    setLoading(false);
                }
            );

        return () => {
            unsubscribeQueue();
            unsubscribeFirestore();
        };
    }, [id]);

    const submitTask = async () => {
        if (!task) return;

        // Basic validation: ensure some evidence exists
        if ((!task.evidence || task.evidence.length === 0)) {
            Alert.alert('Preuve manquante', 'Ajoutez au moins une photo ou une mesure avant de soumettre.');
            return;
        }

        setSubmitting(true);
        try {
            await firestore().collection('tasks').doc(task.id).update({
                status: 'in_review',
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });
            Alert.alert('Succès', 'Tâche soumise pour validation !');
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), 'Échec de l’envoi de la tâche');
        } finally {
            setSubmitting(false);
        }
    };

    const approveAndPay = async () => {
        if (!task) return;
        setSubmitting(true);
        try {
            const fn = functions().httpsCallable('approveAndPayTask');
            // Mock result for now if local emulator not running
            const result = await fn({ taskId: task.id });

            Alert.alert('Succès', `Paiement effectué ! Réf : ${(result.data as any)?.payoutId}`);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Échec du paiement', error.message || 'Erreur inconnue');
        } finally {
            setSubmitting(false);
        }
    };

    const generateDeed = async () => {
        if (!task) return;
        setSubmitting(true);
        try {
            const fn = functions().httpsCallable('generateDigitalDeed');
            const result = await fn({ taskId: task.id });
            console.log("Deed:", JSON.stringify(result.data, null, 2));
            Alert.alert('Acte généré', 'Consultez la console pour le GeoJSON.');
        } catch (error: any) {
            console.error(error);
            Alert.alert(t('common.error'), error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClockIn = async () => {
        if (!task) return;
        if (!isOnSite) {
            await checkLocation();
            return;
        }
        try {
            await firestore().collection('clock_ins').add({
                taskId: task.id,
                farmId: task.farmId,
                userId: auth().currentUser?.uid ?? null,
                location: currentLocation,
                clockedInAt: firestore.FieldValue.serverTimestamp(),
            });
            Alert.alert('Pointage enregistré', 'Votre présence sur site a été enregistrée.');
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), 'Échec de l’enregistrement du pointage');
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    if (!task) {
        return <View style={styles.center}><Text style={styles.emptyText}>Tâche introuvable</Text></View>;
    }

    const currency = ((task.payoutCurrency as CurrencyCode) ?? getRegion(undefined).currency);
    const overdue = task.status !== 'completed' && !!task.dueDate && isOverdue(task.dueDate);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.reward}>{formatMoney(task.payoutAmount, currency)}</Text>
                <StatusBadge status={task.status} size="lg" />
                {task.dueDate ? (
                    <Text style={[styles.dueDate, overdue && styles.dueDateOverdue]}>
                        {t('task.due')} : {formatDateFR(task.dueDate)}{overdue ? ` — ${t('task.overdue')}` : ''}
                    </Text>
                ) : null}
                {task.isPaid && <Text style={styles.paidText}>Payé ✅</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.description}>{task.description}</Text>
            </View>

            {/* GEOFENCED CLOCK-IN — only when the task has a site boundary */}
            {userRole === 'operator' && targetBoundary.length >= 3 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pointage sur site</Text>
                    <ClockInButton isOnSite={isOnSite} isChecking={isChecking} onPress={handleClockIn} />
                    {geofenceError ? (
                        <Text style={styles.geofenceError}>{geofenceError}</Text>
                    ) : (
                        <Text style={styles.geofenceHint}>
                            {isOnSite
                                ? 'Position confirmée — appuyez pour pointer.'
                                : 'Vérifiez votre position pour pointer sur le site.'}
                        </Text>
                    )}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('task.evidence')}</Text>

                {/* OPERATOR ACTIONS */}
                {userRole === 'operator' && task.status === 'pending' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => router.push({ pathname: '/walk-measure', params: { taskId: task.id } })}
                        >
                            <Ionicons name="footsteps" size={20} color={colors.onPrimary} />
                            <Text style={styles.actionBtnText}>Terrain</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                            onPress={() => router.push({ pathname: '/crop-scan', params: { taskId: task.id } })}
                        >
                            <Ionicons name="camera" size={20} color={colors.onDark} />
                            <Text style={styles.actionBtnText}>Cultures</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                            onPress={() => router.push({ pathname: '/record-witness', params: { taskId: task.id } })}
                        >
                            <Ionicons name="videocam" size={20} color={colors.onDark} />
                            <Text style={styles.actionBtnText}>Témoin</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Evidence List */}
                <View style={styles.evidenceList}>
                    {/* 1. Offline/Queued Items */}
                    {localJobs.map((job) => (
                        <View key={job.id} style={styles.evidenceItem}>
                            <View style={styles.evidenceRow}>
                                {job.status === 'uploading' ? (
                                    <ActivityIndicator size="small" color={colors.info} />
                                ) : (
                                    <Ionicons name="cloud-offline" size={20} color={colors.textFaint} />
                                )}
                                <View>
                                    <Text style={styles.evidenceText}>
                                        {job.metadata?.type === 'video_witness' ? 'Vidéo témoin' : 'Photo de culture'}
                                    </Text>
                                    <Text style={styles.evidenceSubText}>
                                        {job.status === 'uploading' ? 'Envoi en cours…' : t('task.evidenceQueued')}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="time" size={16} color={colors.textFaint} />
                        </View>
                    ))}

                    {/* 2. Synced/Online Items */}
                    {task.evidence?.map((item, index) => (
                        <View key={index} style={styles.evidenceItem}>
                            {item.photoUrl ? (
                                <View style={styles.evidenceRow}>
                                    <Ionicons name="image" size={20} color={colors.textMuted} />
                                    <Text style={styles.evidenceText}>Photo (preuve)</Text>
                                </View>
                            ) : item.gpsLocation ? (
                                <View style={styles.evidenceRow}>
                                    <Ionicons name="map" size={20} color={colors.primary} />
                                    <Text style={styles.evidenceText}>Terrain vérifié : {item.notes}</Text>
                                </View>
                            ) : (item as any).videoUrl ? (
                                <View style={styles.evidenceRow}>
                                    <Ionicons name="videocam" size={20} color={colors.danger} />
                                    <Text style={styles.evidenceText}>Témoin : {(item as any).witnessName}</Text>
                                </View>
                            ) : null}
                            <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString('fr-FR')}</Text>
                        </View>
                    ))}
                    {(!task.evidence || task.evidence.length === 0) && (
                        <Text style={styles.emptyText}>Aucune preuve pour le moment.</Text>
                    )}
                </View>
            </View>

            {/* OPERATOR SUBMIT */}
            {userRole === 'operator' && task.status === 'pending' && (
                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.disabledBtn]}
                    onPress={submitTask}
                    disabled={submitting}
                >
                    <Text style={styles.submitBtnText}>{submitting ? 'Envoi…' : t('task.submitReview')}</Text>
                </TouchableOpacity>
            )}

            {/* FUNDER APPROVE */}
            {userRole === 'funder' && task.status === 'in_review' && (
                <View>
                    <Text style={styles.reviewNote}>Vérifiez les preuves ci-dessus. Si tout est correct, libérez les fonds.</Text>
                    <TouchableOpacity
                        style={[styles.submitBtn, styles.approveBtn, submitting && styles.disabledBtn]}
                        onPress={approveAndPay}
                        disabled={submitting}
                    >
                        <Text style={styles.submitBtnText}>{submitting ? 'Traitement…' : t('task.approvePay')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* COMPLETED ACTIONS */}
            {task.status === 'completed' && (
                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.textMuted }]}
                    onPress={generateDeed}
                    disabled={submitting}
                >
                    <Text style={styles.submitBtnText}>{submitting ? 'Génération…' : t('task.downloadDeed')}</Text>
                </TouchableOpacity>
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
    header: {
        padding: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        alignItems: 'center',
        gap: spacing.xs,
    },
    title: {
        fontSize: typeScale.title,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
    },
    reward: {
        fontSize: typeScale.display,
        fontWeight: 'bold',
        color: colors.primary,
    },
    dueDate: {
        fontSize: typeScale.label,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    dueDateOverdue: {
        color: colors.danger,
        fontWeight: '700',
    },
    paidText: {
        color: colors.success,
        fontWeight: 'bold',
        marginTop: spacing.xs,
    },
    section: {
        padding: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceMuted,
    },
    sectionTitle: {
        fontSize: typeScale.heading,
        fontWeight: 'bold',
        marginBottom: spacing.md,
        color: colors.text,
    },
    description: {
        fontSize: typeScale.body,
        color: colors.textMuted,
        lineHeight: 24,
    },
    geofenceHint: {
        marginTop: spacing.sm,
        fontSize: typeScale.caption,
        color: colors.textMuted,
        textAlign: 'center',
    },
    geofenceError: {
        marginTop: spacing.sm,
        fontSize: typeScale.caption,
        color: colors.danger,
        textAlign: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        minHeight: MIN_TOUCH_TARGET,
    },
    actionBtnText: {
        color: colors.onPrimary,
        fontWeight: 'bold',
    },
    evidenceList: {
        backgroundColor: colors.background,
        borderRadius: radius.sm,
        padding: spacing.md,
    },
    evidenceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    evidenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flexShrink: 1,
    },
    evidenceText: {
        fontSize: typeScale.label,
        color: colors.text,
    },
    evidenceSubText: {
        fontSize: typeScale.caption,
        color: colors.textMuted,
    },
    timestamp: {
        fontSize: typeScale.caption,
        color: colors.textFaint,
    },
    emptyText: {
        fontStyle: 'italic',
        color: colors.textFaint,
        textAlign: 'center',
        padding: spacing.md,
    },
    submitBtn: {
        margin: spacing.xl,
        backgroundColor: colors.primary,
        padding: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: MIN_TOUCH_TARGET + spacing.sm,
        elevation: 3,
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    approveBtn: {
        backgroundColor: colors.construction,
    },
    reviewNote: {
        textAlign: 'center',
        color: colors.textMuted,
        marginTop: spacing.md,
        fontStyle: 'italic',
    },
    disabledBtn: {
        backgroundColor: colors.textFaint,
    },
    submitBtnText: {
        color: colors.onPrimary,
        fontSize: typeScale.body,
        fontWeight: 'bold',
    },
});
