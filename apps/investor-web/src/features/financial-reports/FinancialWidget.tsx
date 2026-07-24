// web/components/FinancialWidget.tsx
"use client";
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { formatMoneyCompact, type CurrencyCode } from '@diaspora-trust/core-logic';
import { useI18n } from '@diaspora-trust/shared-ui';
import { db } from '../../lib/firebase';
import { useAppT } from '../../lib/i18n';

interface FinancialWidgetProps {
    userId: string;
    auditMode: boolean;
    setAuditMode: (mode: boolean) => void;
}

/** Firestore stores currency as a loose string; clamp to a known code (CDF default). */
function asCurrency(value: unknown): CurrencyCode {
    return value === 'XOF' || value === 'USD' ? value : 'CDF';
}

export default function FinancialWidget({ userId, auditMode, setAuditMode }: FinancialWidgetProps) {
    const { t } = useI18n();
    const { ta } = useAppT();
    const [stats, setStats] = useState({
        totalInvested: 0,
        balance: 0,
        activeTasks: 0,
        roi: 0,
    });
    // Payouts grouped by currency — Kinshasa tasks pay in CDF, Cotonou in XOF.
    const [payoutsByCurrency, setPayoutsByCurrency] = useState<Partial<Record<CurrencyCode, number>>>({});

    useEffect(() => {
        // Fetch real user profile for balance data
        const fetchProfile = async () => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setStats(prev => ({
                    ...prev,
                    totalInvested: data.totalInvested || 0,
                    balance: data.availableBalance || 0,
                }));
            }
        };
        fetchProfile();

        // TODO: Scope to user's farms with where('farmId', 'in', userFarmIds)
        const q = query(collection(db, 'tasks'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let active = 0;
            const payouts: Partial<Record<CurrencyCode, number>> = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'pending' || data.status === 'in_review') active++;
                if (data.status === 'completed' && data.payoutAmount) {
                    const currency = asCurrency(data.payoutCurrency);
                    payouts[currency] = (payouts[currency] || 0) + data.payoutAmount;
                }
            });
            setStats(prev => ({ ...prev, activeTasks: active }));
            setPayoutsByCurrency(payouts);
        });
        return () => unsubscribe();
    }, [userId]);

    const payoutEntries = Object.entries(payoutsByCurrency) as [CurrencyCode, number][];

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-white font-bold text-sm uppercase tracking-widest">{ta('fin.portfolioPerformance')}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-green-400 font-mono text-xs">▲ {stats.roi}%</span>
                    <span className="text-slate-500 text-xs">{ta('fin.ytd')}</span>
                </div>
            </div>

            {/* Main Stats */}
            <div className="p-6 grid grid-cols-2 gap-6">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">{t('money.invested')}</p>
                    <p className="text-2xl font-bold text-slate-900">{formatMoneyCompact(stats.totalInvested, 'CDF')}</p>
                </div>
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">{t('money.available')}</p>
                    <p className="text-2xl font-bold text-slate-900">{formatMoneyCompact(stats.balance, 'CDF')}</p>
                </div>
            </div>

            {/* Payouts released, grouped by currency */}
            <div className="px-6 pb-4">
                <p className="text-slate-500 text-xs font-bold uppercase mb-1">{ta('fin.payoutsReleased')}</p>
                {payoutEntries.length === 0 ? (
                    <p className="text-sm font-bold text-slate-700">{formatMoneyCompact(0, 'CDF')}</p>
                ) : (
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {payoutEntries.map(([currency, amount]) => (
                            <p key={currency} className="text-sm font-bold text-slate-700">
                                {formatMoneyCompact(amount, currency)}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {/* Mini Chart / Ticker */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-500 font-bold">{ta('fin.activeDeployments')}</span>
                    <span className="bg-info-soft text-info px-2 py-0.5 rounded-full font-bold">{ta('fin.teams', { count: stats.activeTasks })}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-info h-full w-[60%]" title={ta('fin.deployed', { percent: 60 })}></div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={() => setAuditMode(!auditMode)}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${auditMode
                        ? 'bg-primary text-white shadow-lg shadow-primary-soft'
                        : 'bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    {auditMode ? ta('fin.auditOn') : ta('fin.auditToggle')}
                </button>
            </div>
        </div>
    );
}
