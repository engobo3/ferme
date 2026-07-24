import { useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import type { Voucher, SupplierCategory } from '@diaspora-trust/core-logic';

interface VoucherRequestState {
    isSubmitting: boolean;
    error: string | null;
    success: boolean;
}

/**
 * Hook for operators to request fund vouchers from investors.
 */
export function useVoucherRequest(farmId: string, operatorId: string) {
    const [state, setState] = useState<VoucherRequestState>({
        isSubmitting: false,
        error: null,
        success: false,
    });

    const requestVoucher = async (params: {
        amount: number;
        currency: string;
        purpose: string;
        restrictedTo: SupplierCategory[];
    }) => {
        setState({ isSubmitting: true, error: null, success: false });

        try {
            await firestore().collection('voucher_requests').add({
                farmId,
                requestedBy: operatorId,
                amount: params.amount,
                currency: params.currency,
                purpose: params.purpose,
                restrictedTo: params.restrictedTo,
                status: 'pending_approval',
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            setState({ isSubmitting: false, error: null, success: true });
        } catch (err) {
            setState({
                isSubmitting: false,
                error: err instanceof Error ? err.message : 'Request failed',
                success: false,
            });
        }
    };

    return { ...state, requestVoucher };
}
