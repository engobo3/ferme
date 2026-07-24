import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface PhotoUploadProps {
    photoUri?: string;
    onCapture: () => void;
    onRemove?: () => void;
    label?: string;
    required?: boolean;
}

export function PhotoUpload({ photoUri, onCapture, onRemove, label = 'Photo preuve', required = false }: PhotoUploadProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {label}{required && <Text style={styles.required}> *</Text>}
            </Text>
            {photoUri ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: photoUri }} style={styles.preview} />
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.retakeButton} onPress={onCapture}>
                            <Text style={styles.retakeText}>Reprendre</Text>
                        </TouchableOpacity>
                        {onRemove && (
                            <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
                                <Text style={styles.removeText}>Supprimer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ) : (
                <TouchableOpacity style={styles.captureButton} onPress={onCapture}>
                    <Text style={styles.captureIcon}>+</Text>
                    <Text style={styles.captureText}>Prendre une photo</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginVertical: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    required: { color: '#EF4444' },
    captureButton: {
        borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 12,
        padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB',
    },
    captureIcon: { fontSize: 32, color: '#9CA3AF' },
    captureText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    previewContainer: { borderRadius: 12, overflow: 'hidden' },
    preview: { width: '100%', height: 200, borderRadius: 12 },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    retakeButton: { padding: 8 },
    retakeText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
    removeButton: { padding: 8 },
    removeText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
});
