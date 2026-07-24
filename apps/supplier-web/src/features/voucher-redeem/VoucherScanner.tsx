import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { formatMoney } from '@diaspora-trust/core-logic';
import type { CurrencyCode, SupplierCategory, Voucher } from '@diaspora-trust/core-logic';
import { db, functions } from '../../lib/firebase';

/** Libellés français des statuts de bon. */
const STATUS_LABELS: Record<Voucher['status'], string> = {
    'active': 'Actif',
    'partially-redeemed': 'Partiellement utilisé',
    'fully-redeemed': 'Entièrement utilisé',
    'expired': 'Expiré',
    'cancelled': 'Annulé',
};

/** Couleurs de statut (jetons statusColors des libs partagées). */
const STATUS_STYLES: Record<Voucher['status'], string> = {
    'active': 'bg-success-soft text-success',
    'partially-redeemed': 'bg-warning-soft text-warning',
    'fully-redeemed': 'bg-surface-muted text-slate-600',
    'expired': 'bg-danger-soft text-danger',
    'cancelled': 'bg-danger-soft text-danger',
};

const CATEGORY_LABELS: Record<SupplierCategory, string> = {
    'feed-supplier': 'Aliments bétail',
    'hardware-store': 'Quincaillerie',
    'building-materials': 'Matériaux de construction',
    'veterinary': 'Vétérinaire',
    'agricultural-inputs': 'Intrants agricoles',
    'general': 'Général',
};

/** La devise du bon est un `string` en base — repli sur CDF si inconnue. */
function asCurrency(currency: string): CurrencyCode {
    return currency === 'XOF' || currency === 'USD' ? currency : 'CDF';
}

/** Messages français par code d'erreur du callable validateVoucher. */
const REDEEM_ERRORS: Record<string, string> = {
    'functions/unauthenticated': 'Connexion requise pour utiliser un bon.',
    'functions/not-found': 'Bon ou profil fournisseur introuvable.',
    'functions/failed-precondition': 'Ce bon est expiré ou n’est plus valide.',
    'functions/permission-denied': 'Votre compte n’est pas autorisé à utiliser ce bon (catégorie ou fournisseur non éligible).',
    'functions/resource-exhausted': 'Solde du bon insuffisant pour ce montant.',
    'functions/invalid-argument': 'Montant invalide.',
};

interface ValidateVoucherResult {
    success: boolean;
    redemptionId: string;
    remaining: number;
    message: string;
}

export function VoucherScanner() {
    const [voucherCode, setVoucherCode] = useState('');
    const [voucher, setVoucher] = useState<Voucher | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    const [redeemAmount, setRedeemAmount] = useState('');
    const [itemsText, setItemsText] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemError, setRedeemError] = useState<string | null>(null);
    const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

    const handleLookup = async () => {
        const code = voucherCode.trim();
        if (!code) return;

        setIsLoading(true);
        setLookupError(null);
        setVoucher(null);
        setRedeemError(null);
        setRedeemSuccess(null);

        try {
            const snap = await getDoc(doc(db, 'vouchers', code));
            if (!snap.exists()) {
                setLookupError('Bon introuvable. Vérifiez le code saisi.');
                return;
            }

            const data = snap.data() as Record<string, unknown>;
            // expiresAt peut être un nombre (epoch ms) ou un Timestamp Firestore.
            const rawExpires = data.expiresAt as number | { toMillis?: () => number } | undefined;
            const expiresAt = typeof rawExpires === 'number'
                ? rawExpires
                : rawExpires?.toMillis?.() ?? 0;

            const loaded: Voucher = {
                ...(data as unknown as Voucher),
                id: snap.id,
                expiresAt,
                amountRedeemed: (data.amountRedeemed as number) ?? 0,
                redemptions: (data.redemptions as Voucher['redemptions']) ?? [],
                restrictedTo: (data.restrictedTo as SupplierCategory[]) ?? [],
            };

            setVoucher(loaded);
            // Pré-remplir avec le solde restant — modifiable pour un paiement partiel.
            setRedeemAmount(String(Math.max(0, loaded.amount - loaded.amountRedeemed)));
            setItemsText('');
        } catch (error: unknown) {
            console.error('Voucher lookup failed:', error);
            if (error instanceof FirebaseError && error.code === 'permission-denied') {
                setLookupError('Accès refusé. Connectez-vous avec un compte fournisseur.');
            } else {
                setLookupError('Erreur lors de la recherche du bon. Vérifiez votre connexion.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = async () => {
        if (!voucher) return;

        const currency = asCurrency(voucher.currency);
        const remaining = voucher.amount - voucher.amountRedeemed;
        const amount = parseFloat(redeemAmount);

        setRedeemError(null);
        setRedeemSuccess(null);

        if (isNaN(amount) || amount <= 0) {
            setRedeemError('Saisissez un montant valide.');
            return;
        }
        if (amount > remaining) {
            setRedeemError(`Le montant dépasse le solde restant (${formatMoney(remaining, currency)}).`);
            return;
        }

        setIsRedeeming(true);
        try {
            const validateFn = httpsCallable<
                { voucherId: string; amount: number; items: string[] },
                ValidateVoucherResult
            >(functions, 'validateVoucher');

            const items = itemsText
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            const result = await validateFn({ voucherId: voucher.id, amount, items });

            const newRemaining = result.data.remaining;
            setRedeemSuccess(
                `Bon utilisé : ${formatMoney(amount, currency)} — solde restant : ${formatMoney(newRemaining, currency)}.`,
            );
            setVoucher(prev =>
                prev
                    ? {
                        ...prev,
                        amountRedeemed: prev.amountRedeemed + amount,
                        status: newRemaining <= 0 ? 'fully-redeemed' : 'partially-redeemed',
                    }
                    : prev,
            );
            setRedeemAmount(String(Math.max(0, newRemaining)));
        } catch (error: unknown) {
            console.error('Voucher redemption failed:', error);
            if (error instanceof FirebaseError && REDEEM_ERRORS[error.code]) {
                setRedeemError(REDEEM_ERRORS[error.code]);
            } else {
                setRedeemError('Échec de l’utilisation du bon. Réessayez.');
            }
        } finally {
            setIsRedeeming(false);
        }
    };

    const currency = voucher ? asCurrency(voucher.currency) : 'CDF';
    const remaining = voucher ? voucher.amount - voucher.amountRedeemed : 0;
    const isExpired = voucher ? Date.now() > voucher.expiresAt : false;
    const canRedeem =
        !!voucher &&
        !isExpired &&
        (voucher.status === 'active' || voucher.status === 'partially-redeemed') &&
        remaining > 0;
    // Statut affiché : un bon actif mais périmé est montré « Expiré ».
    const displayStatus: Voucher['status'] = !voucher
        ? 'active'
        : isExpired && voucher.status !== 'fully-redeemed' && voucher.status !== 'cancelled'
            ? 'expired'
            : voucher.status;

    return (
        <div className="space-y-6">
            <div className="bg-surface rounded-xl p-6 shadow-sm border border-line">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Scanner un bon d’achat</h2>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={voucherCode}
                        onChange={e => setVoucherCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLookup()}
                        placeholder="Entrer le code du bon…"
                        className="flex-1 min-h-12 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                    <button
                        onClick={handleLookup}
                        disabled={isLoading || !voucherCode.trim()}
                        className="min-h-12 bg-brand-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-900 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Recherche…' : 'Chercher'}
                    </button>
                </div>

                {lookupError && (
                    <p role="alert" className="mt-3 rounded-lg px-4 py-3 text-sm font-medium bg-danger-soft text-danger">
                        {lookupError}
                    </p>
                )}
            </div>

            {voucher && (
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-line">
                    <div className="flex justify-between items-start mb-4 gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{voucher.purpose}</h3>
                            <p className="text-sm text-slate-500">Bon nº {voucher.id.slice(0, 8)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${STATUS_STYLES[displayStatus]}`}>
                            {STATUS_LABELS[displayStatus]}
                        </span>
                    </div>

                    {voucher.restrictedTo.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm text-slate-500 mb-1.5">Réservé aux catégories</p>
                            <div className="flex flex-wrap gap-2">
                                {voucher.restrictedTo.map(cat => (
                                    <span
                                        key={cat}
                                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-chantier-100 text-chantier-700"
                                    >
                                        {CATEGORY_LABELS[cat] ?? cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-slate-500">Montant total</p>
                            <p className="text-xl font-bold text-slate-900">
                                {formatMoney(voucher.amount, currency)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Solde restant</p>
                            <p className="text-xl font-bold text-brand-700">
                                {formatMoney(remaining, currency)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Expire le</p>
                            <p className={`text-base font-semibold ${isExpired ? 'text-danger' : 'text-slate-900'}`}>
                                {voucher.expiresAt
                                    ? new Date(voucher.expiresAt).toLocaleDateString('fr-FR')
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {canRedeem ? (
                        <div className="border-t border-line pt-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="redeem-amount" className="block text-sm font-medium text-slate-700 mb-1">
                                        Montant à utiliser ({currency})
                                    </label>
                                    <input
                                        id="redeem-amount"
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        max={remaining}
                                        value={redeemAmount}
                                        onChange={e => setRedeemAmount(e.target.value)}
                                        className="w-full min-h-11 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Paiement partiel autorisé — maximum {formatMoney(remaining, currency)}.
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="redeem-items" className="block text-sm font-medium text-slate-700 mb-1">
                                        Articles vendus (facultatif)
                                    </label>
                                    <input
                                        id="redeem-items"
                                        type="text"
                                        value={itemsText}
                                        onChange={e => setItemsText(e.target.value)}
                                        placeholder="Ex : 10 sacs ciment, 2 tôles"
                                        className="w-full min-h-11 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Séparez les articles par des virgules.</p>
                                </div>
                            </div>

                            <button
                                onClick={handleRedeem}
                                disabled={isRedeeming}
                                className="w-full min-h-12 bg-brand-700 text-white py-3 rounded-lg font-semibold hover:bg-brand-900 disabled:opacity-50 transition-colors"
                            >
                                {isRedeeming ? 'Validation en cours…' : 'Utiliser ce bon'}
                            </button>
                        </div>
                    ) : (
                        !redeemSuccess && (
                            <p className="rounded-lg px-4 py-3 text-sm font-medium bg-surface-muted text-slate-600">
                                {isExpired
                                    ? 'Ce bon est expiré et ne peut plus être utilisé.'
                                    : 'Ce bon ne peut plus être utilisé.'}
                            </p>
                        )
                    )}

                    {redeemError && (
                        <p role="alert" className="mt-3 rounded-lg px-4 py-3 text-sm font-medium bg-danger-soft text-danger">
                            {redeemError}
                        </p>
                    )}
                    {redeemSuccess && (
                        <p role="status" className="mt-3 rounded-lg px-4 py-3 text-sm font-medium bg-success-soft text-success">
                            {redeemSuccess}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
