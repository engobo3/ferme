import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing, typeScale, MIN_TOUCH_TARGET, t } from '@diaspora-trust/shared-ui';

interface ClockInButtonProps {
    isOnSite: boolean;
    isChecking: boolean;
    onPress: () => void;
}

export function ClockInButton({ isOnSite, isChecking, onPress }: ClockInButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.button, isOnSite ? styles.onSite : styles.offSite]}
            onPress={onPress}
            disabled={isChecking}
        >
            {isChecking ? (
                <ActivityIndicator color={colors.onDark} />
            ) : (
                <Text style={styles.text}>
                    {isOnSite ? `${t('tools.clockIn')} (${t('tools.onSite').toLowerCase()})` : 'Vérifier ma position'}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: MIN_TOUCH_TARGET + spacing.sm,
    },
    onSite: { backgroundColor: colors.success },
    offSite: { backgroundColor: colors.warning },
    text: { color: colors.onDark, fontSize: typeScale.body, fontWeight: '700' },
});
