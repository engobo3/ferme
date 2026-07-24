import React from 'react';
import type { TaskStatus } from '@diaspora-trust/core-logic';
import { getTaskStatusDisplay } from '../hooks/useTaskStatus';

interface StatusBadgeProps {
    status: TaskStatus;
    size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const display = getTaskStatusDisplay(status);
    const fontSize = size === 'sm' ? '0.7rem' : size === 'lg' ? '1rem' : '0.8rem';
    const padding = size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 16px' : '4px 12px';

    return (
        <span
            style={{
                backgroundColor: display.bgColor,
                color: display.color,
                fontSize,
                padding,
                borderRadius: '12px',
                fontWeight: 600,
                display: 'inline-block',
            }}
        >
            {display.label}
        </span>
    );
}
