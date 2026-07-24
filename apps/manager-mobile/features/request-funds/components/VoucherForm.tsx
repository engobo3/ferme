import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { SupplierCategory, RegionId } from '@diaspora-trust/core-logic';
import { getRegion, DEFAULT_REGION_ID } from '@diaspora-trust/core-logic';
import { colors, palette, spacing, radius, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';

const CATEGORIES: { value: SupplierCategory; label: string }[] = [
    { value: 'feed-supplier', label: 'Aliments animaux' },
    { value: 'veterinary', label: 'Vétérinaire' },
    { value: 'agricultural-inputs', label: 'Intrants agricoles' },
    { value: 'building-materials', label: 'Matériaux construction' },
    { value: 'hardware-store', label: 'Quincaillerie' },
    { value: 'general', label: 'Général' },
];

interface VoucherFormProps {
    onSubmit: (data: {
        amount: number;
        currency: string;
        purpose: string;
        restrictedTo: SupplierCategory[];
    }) => void;
    isSubmitting: boolean;
    /** Home market of the operator — drives the voucher currency (CDF or XOF). */
    region?: RegionId;
}

export function VoucherForm({ onSubmit, isSubmitting, region = DEFAULT_REGION_ID }: VoucherFormProps) {
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<SupplierCategory[]>([]);

    const currency = getRegion(region).currency;

    const toggleCategory = (cat: SupplierCategory) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleSubmit = () => {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) return;
        if (!purpose.trim()) return;

        onSubmit({
            amount: parsedAmount,
            currency,
            purpose: purpose.trim(),
            restrictedTo: selectedCategories,
        });
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>{t('voucher.amount')} ({currency})</Text>
            <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Ex : 50000"
                placeholderTextColor={colors.textFaint}
            />

            <Text style={styles.label}>{t('voucher.purpose')}</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={purpose}
                onChangeText={setPurpose}
                placeholder="Ex : Achat aliments semaine 3"
                placeholderTextColor={colors.textFaint}
                multiline
                numberOfLines={3}
            />

            <Text style={styles.label}>Restreindre aux fournisseurs</Text>
            <View style={styles.categories}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat.value}
                        style={[styles.chip, selectedCategories.includes(cat.value) && styles.chipSelected]}
                        onPress={() => toggleCategory(cat.value)}
                    >
                        <Text style={[styles.chipText, selectedCategories.includes(cat.value) && styles.chipTextSelected]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.disabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
            >
                <Text style={styles.submitText}>
                    {isSubmitting ? 'Envoi…' : 'Demander le bon'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: spacing.lg },
    label: {
        fontSize: typeScale.label,
        fontWeight: '600',
        color: colors.textMuted,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        padding: spacing.md,
        fontSize: typeScale.body,
        color: colors.text,
        backgroundColor: colors.surface,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipSelected: { backgroundColor: palette.blue100, borderColor: colors.info },
    chipText: { fontSize: typeScale.label, color: colors.textMuted },
    chipTextSelected: { color: colors.info, fontWeight: '600' },
    submitButton: {
        backgroundColor: colors.primary,
        padding: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
        minHeight: MIN_TOUCH_TARGET,
    },
    disabled: { opacity: 0.6 },
    submitText: { color: colors.onPrimary, fontSize: typeScale.body, fontWeight: '700' },
});
