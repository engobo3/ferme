import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
// Lazy-loaded: requires native rebuild after install
const getImagePicker = () => require('expo-image-picker') as typeof import('expo-image-picker');
import type { Material } from '@diaspora-trust/core-logic';
import { validateMaterialChainOfCustody } from '@diaspora-trust/core-logic';
import { colors, palette, spacing, radius, typeScale, t } from '@diaspora-trust/shared-ui';
import { MaterialEventLogger } from '../../features/construction/components/MaterialEventLogger';
import { useMaterialTracking } from '../../features/construction/hooks/useMaterialTracking';

/** French labels for chain-of-custody steps coming from core-logic. */
function custodyStepLabel(step: string): string {
    switch (step) {
        case 'purchased': return t('construction.purchased');
        case 'in-transit': return t('construction.inTransit');
        case 'delivered-site': return t('construction.delivered');
        case 'installed': return t('construction.installed');
        case 'ALERT: Material flagged as missing': return 'ALERTE : matériau signalé manquant';
        case 'ALERT: Material flagged as damaged': return 'ALERTE : matériau signalé endommagé';
        default: return step;
    }
}

export default function MaterialDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [material, setMaterial] = useState<Material | null>(null);
    const [loading, setLoading] = useState(true);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const { isSubmitting, error, success, logEvent } = useMaterialTracking(id);

    useEffect(() => {
        if (!id) return;
        const unsubscribe = firestore()
            .collection('materials')
            .doc(id)
            .onSnapshot(
                (doc) => {
                    if (doc.exists()) {
                        setMaterial({ id: doc.id, ...doc.data() } as Material);
                    }
                    setLoading(false);
                },
                (err) => {
                    console.error('Error fetching material:', err);
                    setLoading(false);
                }
            );
        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (success) {
            Alert.alert('Succès', 'Événement enregistré avec succès', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
        if (error) {
            Alert.alert('Erreur', error);
        }
    }, [success, error]);

    const handleTakePhoto = async () => {
        try {
            const ImagePicker = getImagePicker();
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Accès caméra requis pour prendre une photo preuve');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: false,
            });
            if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch {
            Alert.alert('Module manquant', 'Relancez « npx expo run:android » pour installer le module caméra');
        }
    };

    const handleSubmit = async (event: {
        type: string;
        verifiedBy: string;
        gpsLocation?: { latitude: number; longitude: number };
        notes?: string;
    }) => {
        await logEvent({
            ...event,
            type: event.type as any,
            photoUrl: photoUri ?? undefined,
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={colors.construction} />
            </SafeAreaView>
        );
    }

    if (!material) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.errorText}>Matériau introuvable</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>{t('common.back')}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const custody = validateMaterialChainOfCustody(material);

    return (
        <>
            <Stack.Screen
                options={{
                    title: material.name,
                    headerBackTitle: t('construction.materials'),
                }}
            />
            <SafeAreaView style={styles.container}>
                {/* Chain of Custody Summary */}
                {custody.missingSteps.length > 0 && (
                    <View style={styles.custodyBanner}>
                        <Text style={styles.custodyTitle}>{t('construction.missingSteps')} :</Text>
                        {custody.missingSteps.map((step, i) => (
                            <Text key={i} style={styles.custodyStep}>• {custodyStepLabel(step)}</Text>
                        ))}
                    </View>
                )}

                {/* Photo Preview */}
                {photoUri && (
                    <View style={styles.photoPreview}>
                        <Text style={styles.photoPreviewText}>Photo capturée</Text>
                        <TouchableOpacity onPress={() => setPhotoUri(null)}>
                            <Text style={styles.photoRemove}>Supprimer</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Event Logger */}
                <MaterialEventLogger
                    materialName={material.name}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    onTakePhoto={handleTakePhoto}
                />
            </SafeAreaView>
        </>
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
    errorText: {
        fontSize: typeScale.body,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    backLink: {
        fontSize: typeScale.label,
        color: colors.info,
        fontWeight: '600',
    },
    custodyBanner: {
        margin: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.constructionSoft,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.warning,
    },
    custodyTitle: {
        fontSize: typeScale.label,
        fontWeight: '700',
        color: colors.construction,
        marginBottom: spacing.xs,
    },
    custodyStep: {
        fontSize: typeScale.caption,
        color: colors.construction,
        marginTop: 2,
    },
    photoPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: palette.emerald100,
        borderRadius: radius.sm,
    },
    photoPreviewText: {
        fontSize: typeScale.label,
        color: palette.emerald700,
        fontWeight: '600',
    },
    photoRemove: {
        fontSize: typeScale.caption,
        color: colors.danger,
        fontWeight: '600',
    },
});
