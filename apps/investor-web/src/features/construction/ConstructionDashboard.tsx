"use client";
import React, { useState } from 'react';
import { PriceReviewPanel } from './PriceReviewPanel';
import { MaterialTracker } from './MaterialTracker';
import { ProjectCostSummary } from './ProjectCostSummary';

type ConstructionTab = 'overview' | 'prices' | 'materials';

export default function ConstructionDashboard() {
    const [activeTab, setActiveTab] = useState<ConstructionTab>('overview');

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                {([
                    { key: 'overview', label: 'Vue d’ensemble' },
                    { key: 'prices', label: 'Vérification des prix' },
                    { key: 'materials', label: 'Suivi des matériaux' },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'bg-construction-soft text-construction border-b-2 border-construction'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && <ProjectCostSummary />}
            {activeTab === 'prices' && <PriceReviewPanel />}
            {activeTab === 'materials' && <MaterialTracker />}
        </div>
    );
}
