"use client";
import React, { useState } from 'react';
import { validatePrice, formatMoney } from '@diaspora-trust/core-logic';
import type { PriceBenchmark, MaterialCategory } from '@diaspora-trust/core-logic';

interface SupplierPriceEntry {
    id: string;
    supplierName: string;
    category: MaterialCategory;
    productName: string;
    unitPrice: number;
    unit: string;
    region: string;
    submittedAt: number;
    status: 'pending' | 'approved' | 'flagged' | 'rejected';
}

// Mock supplier price submissions - replace with Firestore
const MOCK_SUBMISSIONS: SupplierPriceEntry[] = [
    { id: 'sp1', supplierName: 'Dépôt Kinshasa Central', category: 'cement', productName: 'Ciment Dangote 50kg', unitPrice: 5800, unit: 'sac', region: 'Kinshasa', submittedAt: Date.now() - 3600000, status: 'pending' },
    { id: 'sp2', supplierName: 'Dépôt Kinshasa Central', category: 'blocks', productName: 'Parpaings 15x20x40', unitPrice: 320, unit: 'pièce', region: 'Kinshasa', submittedAt: Date.now() - 7200000, status: 'pending' },
    { id: 'sp3', supplierName: 'Quincaillerie Maputo', category: 'rebar', productName: 'Fer à béton 12 mm', unitPrice: 12000, unit: 'barre', region: 'Kinshasa', submittedAt: Date.now() - 10800000, status: 'pending' },
    { id: 'sp4', supplierName: 'Ets Bukavu Matériaux', category: 'cement', productName: 'Ciment CimGabon 50kg', unitPrice: 3200, unit: 'sac', region: 'Kinshasa', submittedAt: Date.now() - 14400000, status: 'pending' },
    { id: 'sp5', supplierName: 'Fournisseur Express', category: 'roofing', productName: 'Tôle bac 3 m', unitPrice: 11500, unit: 'feuille', region: 'Kinshasa', submittedAt: Date.now() - 18000000, status: 'pending' },
];

const BENCHMARKS: Record<string, PriceBenchmark> = {
    'cement': { materialCategory: 'cement', region: 'Kinshasa', avgPrice: 5500, minPrice: 4800, maxPrice: 6200, currency: 'CDF', lastUpdated: Date.now(), sampleSize: 15 },
    'blocks': { materialCategory: 'blocks', region: 'Kinshasa', avgPrice: 300, minPrice: 250, maxPrice: 380, currency: 'CDF', lastUpdated: Date.now(), sampleSize: 12 },
    'rebar': { materialCategory: 'rebar', region: 'Kinshasa', avgPrice: 7000, minPrice: 6000, maxPrice: 8000, currency: 'CDF', lastUpdated: Date.now(), sampleSize: 8 },
    'roofing': { materialCategory: 'roofing', region: 'Kinshasa', avgPrice: 11000, minPrice: 9500, maxPrice: 12500, currency: 'CDF', lastUpdated: Date.now(), sampleSize: 6 },
};

const RECOMMENDATION_STYLES = {
    approve: { bg: 'bg-primary-faint', border: 'border-primary-soft', text: 'text-primary', label: 'Approuver' },
    review: { bg: 'bg-construction-faint', border: 'border-construction-soft', text: 'text-construction', label: 'À vérifier' },
    reject: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-danger', label: 'Rejeter' },
};

export function PriceReviewPanel() {
    const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS);
    const [filter, setFilter] = useState<'all' | 'flagged' | 'approved'>('all');

    const processedSubmissions = submissions.map(sub => {
        const benchmark = BENCHMARKS[sub.category];
        const validation = benchmark ? validatePrice(sub.unitPrice, benchmark) : null;
        return { ...sub, validation };
    });

    const filtered = filter === 'all'
        ? processedSubmissions
        : filter === 'flagged'
            ? processedSubmissions.filter(s => s.validation && !s.validation.isValid)
            : processedSubmissions.filter(s => s.status === 'approved');

    const handleAction = (id: string, action: 'approved' | 'rejected') => {
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action } : s));
    };

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex gap-2">
                {(['all', 'flagged', 'approved'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            filter === f ? 'bg-construction-soft text-construction' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {f === 'all' ? 'Tous' : f === 'flagged' ? 'Signalés' : 'Approuvés'}
                        {f === 'flagged' && (
                            <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {processedSubmissions.filter(s => s.validation && !s.validation.isValid).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Submissions list */}
            <div className="space-y-3">
                {filtered.map(sub => {
                    const style = sub.validation
                        ? RECOMMENDATION_STYLES[sub.validation.recommendation]
                        : RECOMMENDATION_STYLES.review;

                    return (
                        <div key={sub.id} className={`${style.bg} rounded-xl p-4 border ${style.border}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{sub.productName}</h4>
                                    <p className="text-sm text-gray-600">{sub.supplierName}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.text} ${style.bg}`}>
                                    {style.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Prix soumis</p>
                                    <p className="font-bold text-gray-900">{formatMoney(sub.unitPrice, 'CDF')}/{sub.unit}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Moyenne régionale</p>
                                    <p className="font-medium text-gray-700">
                                        {BENCHMARKS[sub.category] ? formatMoney(BENCHMARKS[sub.category].avgPrice, 'CDF') : '?'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Écart</p>
                                    <p className={`font-bold ${
                                        sub.validation && Math.abs(sub.validation.variancePercent) > 30 ? 'text-red-600' :
                                        sub.validation && Math.abs(sub.validation.variancePercent) > 15 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                        {sub.validation ? `${sub.validation.variancePercent > 0 ? '+' : ''}${sub.validation.variancePercent}%` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Alertes</p>
                                    <p className="text-sm">
                                        {sub.validation?.flags.length ? sub.validation.flags.join(', ') : 'Aucune'}
                                    </p>
                                </div>
                            </div>

                            {sub.status === 'pending' && (
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => handleAction(sub.id, 'rejected')}
                                        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white border border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        Rejeter
                                    </button>
                                    <button
                                        onClick={() => handleAction(sub.id, 'approved')}
                                        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark"
                                    >
                                        Approuver
                                    </button>
                                </div>
                            )}

                            {sub.status !== 'pending' && (
                                <p className={`text-sm font-medium text-right ${
                                    sub.status === 'approved' ? 'text-primary' : 'text-danger'
                                }`}>
                                    {sub.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
