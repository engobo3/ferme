import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location';
import auth from '@react-native-firebase/auth';
import type { MaterialTrackingEvent } from '@diaspora-trust/core-logic';
import { colors, palette, spacing, radius, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';

const EVENT_TYPES: { value: MaterialTrackingEvent['event']; label: string; icon: string; color: string }[] = [
    { value: 'delivered-site', label: t('construction.delivered'), icon: '📦', color: colors.info },
    { value: 'installed', label: t('construction.installed'), icon: '🔧', color: colors.success },
    { value: 'damaged', label: t('construction.damaged'), icon: '⚠️', color: colors.warning },
    { value: 'missing', label: t('construction.missing'), icon: '🚨', color: colors.danger },
];

interface MaterialEventLoggerProps {
    materialName: string;
    onSubmit: (event: {
        type: MaterialTrackingEvent['event'];
        verifiedBy: string;
        gpsLocation?: { latitude: number; longitude: number };
        notes?: string;
    }) => void;
    isSubmitting: boolean;
    onTakePhoto: () => void;
}

export function MaterialEventLogger({ materialName, onSubmit, isSubmitting, onTakePhoto }: MaterialEventLoggerProps) {
    const [selectedType, setSelectedType] = useState<MaterialTrackingEvent['event'] | null>(null);
    const [notes, setNotes] = useState('');
    const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const captureLocation = async () => {
        setIsGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Accès GPS requis pour le suivi');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setGpsLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch {
            Alert.alert('Erreur', 'Impossible de lire la position GPS');
        } finally {
            setIsGettingLocation(false);
        }
    };

    const handleSubmit = () => {
        if (!selectedType) return;
        onSubmit({
            type: selectedType,
            verifiedBy: auth().currentUser?.uid || 'inconnu',
            gpsLocation: gpsLocation ?? undefined,
            notes: notes.trim() || undefined,
        });
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Suivi : {materialName}</Text>

            {/* Event Type Selection */}
            <Text style={styles.label}>Type d’événement</Text>
            <View style={styles.eventGrid}>
                {EVENT_TYPES.map(evt => (
                    <TouchableOpacity
                        key={evt.value}
                        style={[
                            styles.eventCard,
                            selectedType === evt.value && { borderColor: evt.color, borderWidth: 2, backgroundColor: evt.color + '15' },
                        ]}
                        onPress={() => setSelectedType(evt.value)}
                    >
                        <Text style={styles.eventIcon}>{evt.icon}</Text>
                        <Text style={[styles.eventLabel, selectedType === evt.value && { color: evt.color, fontWeight: '700' }]}>
                            {evt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* GPS Capture */}
            <Text style={styles.label}>Position GPS</Text>
            <TouchableOpacity
                style={[styles.gpsButton, gpsLocation && styles.gpsButtonCaptured]}
                onPress={captureLocation}
                disabled={isGettingLocation}
            >
                <Text style={styles.gpsButtonText}>
                    {isGettingLocation ? 'Lecture GPS…' :
                     gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` :
                     'Capturer la position'}
                </Text>
            </TouchableOpacity>

            {/* Photo */}
            <Text style={styles.label}>Photo preuve</Text>
            <TouchableOpacity style={styles.photoButton} onPress={onTakePhoto}>
                <Text style={styles.photoButtonIcon}>📷</Text>
                <Text style={styles.photoButtonText}>{t('task.addPhoto')}</Text>
            </TouchableOpacity>

            {/* Notes */}
            <Text style={styles.label}>Notes (optionnel)</Text>
            <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex : 5 sacs endommagés par la pluie"
                placeholderTextColor={colors.textFaint}
                multiline
                numberOfLines={3}
            />

            {/* Submit */}
            <TouchableOpacity
                style={[styles.submitButton, (!selectedType || isSubmitting) && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={!selectedType || isSubmitting}
            >
                <Text style={styles.submitText}>
                    {isSubmitting ? 'Envoi…' : t('common.save')}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: spacing.lg },
    title: {
        fontSize: typeScale.heading,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: typeScale.label,
        fontWeight: '600',
        color: colors.textMuted,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    eventCard: {
        width: '47%',
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        minHeight: MIN_TOUCH_TARGET,
    },
    eventIcon: { fontSize: 24, marginBottom: spacing.xs },
    eventLabel: { fontSize: typeScale.caption, color: colors.textMuted, textAlign: 'center' },
    gpsButton: {
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: MIN_TOUCH_TARGET,
    },
    gpsButtonCaptured: { borderColor: colors.success, backgroundColor: palette.emerald100 },
    gpsButtonText: { fontSize: typeScale.label, color: colors.textMuted },
    photoButton: {
        padding: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceMuted,
        minHeight: MIN_TOUCH_TARGET,
    },
    photoButtonIcon: { fontSize: 28 },
    photoButtonText: { fontSize: typeScale.label, color: colors.textMuted, marginTop: spacing.xs },
    notesInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        fontSize: typeScale.label,
        color: colors.text,
        height: 80,
        textAlignVertical: 'top',
        backgroundColor: colors.surface,
    },
    submitButton: {
        backgroundColor: colors.construction,
        padding: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xxl + spacing.sm,
        minHeight: MIN_TOUCH_TARGET,
    },
    submitDisabled: { opacity: 0.5 },
    submitText: { color: colors.onDark, fontSize: typeScale.body, fontWeight: '700' },
});
