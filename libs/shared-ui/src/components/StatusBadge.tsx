import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TaskStatus } from '@diaspora-trust/core-logic';
import { getTaskStatusDisplay } from '../hooks/useTaskStatus';

interface StatusBadgeProps {
    status: TaskStatus;
    size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const display = getTaskStatusDisplay(status);
    const fontSize = size === 'sm' ? 10 : size === 'lg' ? 16 : 12;
    const padding = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;

    return (
        <View style={[styles.badge, { backgroundColor: display.bgColor, paddingHorizontal: padding * 2, paddingVertical: padding }]}>
            <Text style={[styles.text, { color: display.color, fontSize }]}>
                {display.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '600',
    },
});
