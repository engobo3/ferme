"use client";
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { formatMoney, type CurrencyCode, type TaskStatus } from '@diaspora-trust/core-logic';
import { getTaskStatusDisplay, useI18n } from '@diaspora-trust/shared-ui';
import { db, functions } from '../../lib/firebase';
import { useAppT, type AppStringKey } from '../../lib/i18n';

/** A confidence reason, kept as a key + params so it renders in both locales. */
interface AIReason {
    key: AppStringKey;
    params?: Record<string, string | number>;
}

/**
 * Simulates an ML pipeline that scores task evidence quality.
 * In production, this would call a Cloud Function running
 * the TFLite model on uploaded photos.
 */
function computeAIConfidence(task: any): { score: number; reasons: AIReason[] } {
    let score = 50; // Base score
    const reasons: AIReason[] = [];

    // Evidence quantity
    const evidenceCount = task.evidence?.length || 0;
    if (evidenceCount >= 3) { score += 15; reasons.push({ key: 'appr.reasonPhotosVerified', params: { count: evidenceCount } }); }
    else if (evidenceCount >= 1) { score += 8; reasons.push({ key: 'appr.reasonPhotosAttached', params: { count: evidenceCount } }); }
    else { reasons.push({ key: 'appr.reasonNoPhotos' }); }

    // GPS verification
    const hasGps = task.evidence?.some((e: any) => e.gpsLocation);
    if (hasGps) { score += 15; reasons.push({ key: 'appr.reasonGps' }); }

    // GeoJSON boundary data
    if (task.geojson || task.targetBoundary) { score += 10; reasons.push({ key: 'appr.reasonBoundary' }); }

    // Task description completeness
    if (task.description && task.description.length > 50) { score += 5; reasons.push({ key: 'appr.reasonDetailed' }); }

    // Payout amount sanity (small amounts are lower risk)
    if (task.payoutAmount && task.payoutAmount < 1000) { score += 5; reasons.push({ key: 'appr.reasonLowRisk' }); }

    return { score: Math.min(score, 99), reasons };
}

function getConfidenceBadge(score: number): { labelKey: AppStringKey; color: string; icon: string } {
    if (score >= 90) return { labelKey: 'appr.confHigh', color: 'bg-primary-soft text-primary border-primary-soft', icon: '🛡️' };
    if (score >= 70) return { labelKey: 'appr.confMedium', color: 'bg-construction-soft text-construction border-construction-soft', icon: '⚡' };
    return { labelKey: 'appr.confLow', color: 'bg-danger-soft text-danger border-danger-soft', icon: '⚠️' };
}

/** Firestore stores currency as a loose string; clamp to a known code (CDF default). */
function asCurrency(value: unknown): CurrencyCode {
    return value === 'XOF' || value === 'USD' ? value : 'CDF';
}

export default function ApprovalQueue() {
    const { t, locale } = useI18n();
    const { ta } = useAppT();
    const [tasks, setTasks] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'tasks'), where('status', '==', 'in_review'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleApprove = async (taskId: string, accelerated: boolean = false) => {
        if (!accelerated && !confirm(ta('appr.confirmRelease'))) return;
        setProcessingId(taskId);
        try {
            const approveFn = httpsCallable(functions, 'approveAndPayTask');
            const result = await approveFn({ taskId });
            console.log("Payout Success:", result.data);
            alert(ta('appr.fundsReleased'));
        } catch (error: any) {
            console.error("Payout Failed:", error);
            alert(ta('appr.error', { message: error.message || 'Cloud Function' }));
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{ta('dash.approvalsTitle')}</h2>
                    <p className="text-slate-500">{ta('appr.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="font-bold text-slate-800">{tasks.length}</span>
                        <span className="text-slate-500 ml-2">{ta('appr.tasksWaiting')}</span>
                    </div>
                    <div className="bg-purple-50 px-4 py-2 rounded-lg border border-purple-200 shadow-sm">
                        <span className="text-purple-700 font-bold text-xs">{ta('appr.aiScoring')}</span>
                        <span className="text-purple-500 ml-1 text-xs">{ta('appr.aiActive')}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <span className="text-6xl mb-4">✅</span>
                        <p>{ta('appr.allCaughtUp')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{ta('appr.colTask')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{ta('appr.colAssigned')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{ta('appr.colEvidence')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{ta('appr.colScore')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{ta('appr.colAmount')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{ta('appr.colAction')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tasks.map(task => {
                                    const ai = computeAIConfidence(task);
                                    const badge = getConfidenceBadge(ai.score);
                                    const isHighConfidence = ai.score >= 90;
                                    const statusDisplay = getTaskStatusDisplay((task.status ?? 'in_review') as TaskStatus, locale);

                                    return (
                                        <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${isHighConfidence ? 'bg-primary-faint/50' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800">{task.title}</p>
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                                                        style={{ color: statusDisplay.color, backgroundColor: statusDisplay.bgColor }}
                                                    >
                                                        {statusDisplay.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{task.description}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">OP</div>
                                                    <span className="text-sm text-slate-700">{task.assignedTo}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    {ta('appr.items', { count: task.evidence?.length || 0 })}
                                                    {task.geojson && <span className="text-xs bg-info-soft text-info px-2 rounded">GeoJSON</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${badge.color}`}>
                                                        {badge.icon} {ai.score}% {ta(badge.labelKey)}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400 max-w-[150px]">
                                                        {ai.reasons.slice(0, 2).map(r => ta(r.key, r.params)).join(' • ')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono font-bold text-slate-800">
                                                {formatMoney(task.payoutAmount || 0, asCurrency(task.payoutCurrency))}
                                            </td>
                                            <td className="p-4">
                                                {isHighConfidence ? (
                                                    <button
                                                        onClick={() => handleApprove(task.id, true)}
                                                        disabled={!!processingId}
                                                        className={`px-4 py-2 rounded-lg font-bold text-sm text-white shadow-md transition-all ${processingId === task.id
                                                            ? 'bg-slate-400 cursor-wait'
                                                            : 'bg-gradient-to-r from-primary-bright to-primary hover:from-primary hover:to-primary-dark hover:shadow-lg ring-2 ring-primary-soft'
                                                            }`}
                                                    >
                                                        {processingId === task.id ? ta('appr.processing') : ta('appr.oneClickPay')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleApprove(task.id)}
                                                        disabled={!!processingId}
                                                        className={`px-4 py-2 rounded-lg font-bold text-sm text-white shadow-md transition-all ${processingId === task.id
                                                            ? 'bg-slate-400 cursor-wait'
                                                            : 'bg-primary hover:bg-primary-dark hover:shadow-lg'
                                                            }`}
                                                    >
                                                        {processingId === task.id ? ta('appr.processing') : t('task.approvePay')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
