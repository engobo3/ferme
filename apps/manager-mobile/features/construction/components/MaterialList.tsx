import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import type { Material } from '@diaspora-trust/core-logic';
import { validateMaterialChainOfCustody } from '@diaspora-trust/core-logic';
import { colors, palette, spacing, radius, typeScale, t } from '@diaspora-trust/shared-ui';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    'quoted': { bg: colors.surfaceMuted, text: colors.textMuted, label: 'Devis' },
    'approved': { bg: palette.blue100, text: palette.blue700, label: 'Approuvé' },
    'purchased': { bg: palette.amber100, text: palette.amber700, label: t('construction.purchased') },
    'delivered': { bg: palette.green100, text: palette.green700, label: 'Livré' },
    'installed': { bg: palette.emerald100, text: palette.emerald700, label: t('construction.installed') },
};

/** French labels for chain-of-custody alerts coming from core-logic. */
const ALERT_LABELS: Record<string, string> = {
    'ALERT: Material flagged as missing': 'ALERTE : matériau signalé manquant',
    'ALERT: Material flagged as damaged': 'ALERTE : matériau signalé endommagé',
};

interface MaterialListProps {
    materials: Material[];
    onSelect: (material: Material) => void;
}

export function MaterialList({ materials, onSelect }: MaterialListProps) {
    return (
        <FlatList
            data={materials}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
                const custody = validateMaterialChainOfCustody(item);
                const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES['quoted'];
                const hasIssue = custody.missingSteps.some(s => s.startsWith('ALERT'));

                return (
                    <TouchableOpacity
                        style={[styles.card, hasIssue && styles.cardAlert]}
                        onPress={() => onSelect(item)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.materialName}>{item.name}</Text>
                                <Text style={styles.materialQty}>{item.quantity} {item.unit}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                            </View>
                        </View>

                        {/* Progress bar */}
                        <View style={styles.progressBar}>
                            {['purchased', 'in-transit', 'delivered-site', 'installed'].map((step, i) => {
                                const done = (item.trackingEvents ?? []).some(e => e.event === step);
                                return (
                                    <View key={step} style={[styles.progressStep, done ? styles.progressDone : styles.progressPending]}>
                                        <Text style={[styles.progressLabel, done && styles.progressLabelDone]}>
                                            {['Achat', 'Transit', 'Livré', 'Posé'][i]}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {hasIssue && (
                            <View style={styles.alertBanner}>
                                <Text style={styles.alertText}>
                                    {custody.missingSteps
                                        .filter(s => s.startsWith('ALERT'))
                                        .map(s => ALERT_LABELS[s] ?? s)
                                        .join(' | ')}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            }}
        />
    );
}

const styles = StyleSheet.create({
    list: { padding: spacing.lg, gap: spacing.md },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardAlert: { borderColor: colors.danger, backgroundColor: palette.red100 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    materialName: { fontSize: typeScale.body, fontWeight: '600', color: colors.text },
    materialQty: { fontSize: typeScale.caption, color: colors.textFaint, marginTop: 2 },
    statusBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.md,
    },
    statusText: { fontSize: typeScale.caption, fontWeight: '600' },
    progressBar: { flexDirection: 'row', gap: spacing.xs },
    progressStep: { flex: 1, height: 6, borderRadius: 3 },
    progressDone: { backgroundColor: colors.success },
    progressPending: { backgroundColor: colors.border },
    progressLabel: { fontSize: 9, color: colors.textFaint, textAlign: 'center', marginTop: 3 },
    progressLabelDone: { color: colors.success, fontWeight: '600' },
    alertBanner: {
        backgroundColor: palette.red100,
        borderRadius: radius.sm,
        padding: spacing.sm,
        marginTop: spacing.sm,
    },
    alertText: { fontSize: typeScale.caption, color: colors.danger, fontWeight: '600' },
});
