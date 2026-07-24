import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import type { Material } from '@diaspora-trust/core-logic';
import { colors, spacing, typeScale, t } from '@diaspora-trust/shared-ui';
import { MaterialList } from '../../features/construction/components/MaterialList';

export default function MaterialsScreen() {
    const router = useRouter();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('materials')
            .orderBy('updatedAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    if (snapshot) {
                        const items = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                        })) as Material[];
                        setMaterials(items);
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error('Erreur de chargement des matériaux :', error);
                    setLoading(false);
                }
            );

        return () => unsubscribe();
    }, []);

    const handleSelect = (material: Material) => {
        router.push({ pathname: '/material/[id]', params: { id: material.id } });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('construction.materials')}</Text>
                <Text style={styles.headerSubtitle}>{t('construction.siteTracking')}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.construction} />
                </View>
            ) : materials.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>🏗️</Text>
                    <Text style={styles.emptyText}>{t('construction.noMaterials')}</Text>
                    <Text style={styles.emptyHint}>Les matériaux apparaîtront ici une fois ajoutés par l’investisseur</Text>
                </View>
            ) : (
                <MaterialList materials={materials} onSelect={handleSelect} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: typeScale.display,
        fontWeight: 'bold',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: typeScale.label,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typeScale.body,
        color: colors.textMuted,
        fontWeight: '600',
    },
    emptyHint: {
        fontSize: typeScale.label,
        color: colors.textFaint,
        textAlign: 'center',
        marginTop: spacing.sm,
        paddingHorizontal: 40,
    },
});
