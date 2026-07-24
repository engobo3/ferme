"use client";
import React, { useState, useEffect } from 'react';
import type { Material, MaterialCategory, PriceBenchmark } from '@diaspora-trust/core-logic';
import { calculateProjectCostSummary, summarizeProjectMaterials, formatMoney } from '@diaspora-trust/core-logic';

// Mock data for development - replace with Firestore queries
const MOCK_MATERIALS: Material[] = [
    {
        id: 'm1', projectId: 'proj1', name: 'Ciment CimGabon 50kg', category: 'cement',
        quantity: 100, unit: 'sacs', unitPriceSubmitted: 6500, unitPriceBenchmark: 5500,
        status: 'delivered', trackingEvents: [
            { date: Date.now() - 5 * 86400000, event: 'purchased', verifiedBy: 'supplier1' },
            { date: Date.now() - 3 * 86400000, event: 'in-transit', verifiedBy: 'driver1' },
            { date: Date.now() - 1 * 86400000, event: 'delivered-site', verifiedBy: 'operator1' },
        ],
    },
    {
        id: 'm2', projectId: 'proj1', name: 'Parpaings 15x20x40', category: 'blocks',
        quantity: 2000, unit: 'pieces', unitPriceSubmitted: 350, unitPriceBenchmark: 300,
        status: 'installed', trackingEvents: [
            { date: Date.now() - 10 * 86400000, event: 'purchased', verifiedBy: 'supplier2' },
            { date: Date.now() - 8 * 86400000, event: 'in-transit', verifiedBy: 'driver1' },
            { date: Date.now() - 7 * 86400000, event: 'delivered-site', verifiedBy: 'operator1' },
            { date: Date.now() - 2 * 86400000, event: 'installed', verifiedBy: 'operator1' },
        ],
    },
    {
        id: 'm3', projectId: 'proj1', name: 'Fer à béton 12 mm', category: 'rebar',
        quantity: 50, unit: 'barres', unitPriceSubmitted: 8500, unitPriceBenchmark: 7000,
        status: 'purchased', trackingEvents: [
            { date: Date.now() - 1 * 86400000, event: 'purchased', verifiedBy: 'supplier3' },
        ],
    },
    {
        id: 'm4', projectId: 'proj1', name: 'Tôle bac alu 3 m', category: 'roofing',
        quantity: 40, unit: 'feuilles', unitPriceSubmitted: 12000,
        status: 'quoted', trackingEvents: [],
    },
];

const MOCK_BENCHMARKS = new Map<MaterialCategory, PriceBenchmark>([
    ['cement', { materialCategory: 'cement', region: 'Kinshasa', avgPrice: 5500, minPrice: 4800, maxPrice: 6200, currency: 'CDF', lastUpdated: Date.now(), sampleSize: 15 }],
    ['blocks', { materialCategory: 'blocks', region: 'Kinshasa', avgPrice: 300, minPrice: 250, maxPrice: 380, currency: 'CDF', lastUpdated: Date.now(), sampleSize: 12 }],
    ['rebar', { materialCategory: 'rebar', region: 'Kinshasa', avgPrice: 7000, minPrice: 6000, maxPrice: 8000, currency: 'CDF', lastUpdated: Date.now(), sampleSize: 8 }],
    ['roofing', { materialCategory: 'roofing', region: 'Kinshasa', avgPrice: 11000, minPrice: 9500, maxPrice: 12500, currency: 'CDF', lastUpdated: Date.now(), sampleSize: 6 }],
]);

export function ProjectCostSummary() {
    const materials = MOCK_MATERIALS;
    const costSummary = calculateProjectCostSummary(materials, MOCK_BENCHMARKS);
    const trackingSummary = summarizeProjectMaterials(materials);

    const varianceColor = costSummary.overallVariancePercent > 20
        ? 'text-danger' : costSummary.overallVariancePercent > 10
        ? 'text-construction-strong' : 'text-primary';

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Coût total soumis</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatMoney(costSummary.totalSubmitted, 'CDF')}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Référence régionale</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {formatMoney(costSummary.totalBenchmark, 'CDF')}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Écart global</p>
                    <p className={`text-2xl font-bold ${varianceColor}`}>
                        {costSummary.overallVariancePercent > 0 ? '+' : ''}{costSummary.overallVariancePercent}%
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Économies possibles</p>
                    <p className="text-2xl font-bold text-primary">
                        {formatMoney(costSummary.savingsOpportunity, 'CDF')}
                    </p>
                </div>
            </div>

            {/* Material Progress */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Avancement des matériaux</h3>
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex-1">
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-bright rounded-full transition-all"
                                style={{ width: `${trackingSummary.completionPercent}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{trackingSummary.completionPercent}%</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{trackingSummary.total}</p>
                        <p className="text-xs text-gray-500">Matériaux au total</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-primary">{trackingSummary.installed}</p>
                        <p className="text-xs text-gray-500">Installés</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-info">{trackingSummary.inTransit}</p>
                        <p className="text-xs text-gray-500">En transit</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-danger">{trackingSummary.missing}</p>
                        <p className="text-xs text-gray-500">Manquants</p>
                    </div>
                </div>
            </div>

            {/* Flagged Items */}
            {costSummary.flaggedItems.length > 0 && (
                <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                    <h3 className="font-semibold text-red-800 mb-3">
                        Articles signalés ({costSummary.flaggedItems.length})
                    </h3>
                    <div className="space-y-2">
                        {costSummary.flaggedItems.map(item => {
                            const bm = MOCK_BENCHMARKS.get(item.category);
                            const variance = bm
                                ? ((item.unitPriceSubmitted - bm.avgPrice) / bm.avgPrice * 100).toFixed(1)
                                : '?';
                            return (
                                <div key={item.id} className="flex justify-between items-center bg-white rounded-lg p-3 border border-red-100">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.quantity} {item.unit}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-danger">+{variance}%</p>
                                        <p className="text-xs text-gray-500">
                                            {formatMoney(item.unitPriceSubmitted, 'CDF')} vs {bm ? formatMoney(bm.avgPrice, 'CDF') : '?'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
