import React, { useState } from 'react';
import { SupplierAuth } from './components/SupplierAuth';
import { RegionSelector } from './components/RegionSelector';
import { RegionProvider, useRegion } from './lib/region';
import { VoucherScanner } from './features/voucher-redeem/VoucherScanner';
import { PriceSubmission } from './features/inventory/PriceSubmission';

type Tab = 'vouchers' | 'prices';

function AppShell() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('vouchers');
    const { region } = useRegion();

    if (!isAuthenticated) {
        return <SupplierAuth onAuth={() => setIsAuthenticated(true)} />;
    }

    const tabs: { id: Tab; label: string }[] = [
        { id: 'vouchers', label: 'Bons d’achat' },
        { id: 'prices', label: 'Soumettre les prix' },
    ];

    return (
        <div className="min-h-screen bg-page">
            <header className="bg-surface border-b border-line px-4 sm:px-6 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3 max-w-4xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">FarmTrust Fournisseur</h1>
                        <p className="text-xs text-slate-500">
                            {region.city} · {region.countryLabel} · devise {region.currency}
                        </p>
                    </div>

                    <RegionSelector />

                    <nav className="flex gap-2" aria-label="Navigation principale">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`min-h-11 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-brand-100 text-brand-700'
                                        : 'text-slate-600 hover:bg-surface-muted'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6">
                {activeTab === 'vouchers' && <VoucherScanner />}
                {activeTab === 'prices' && <PriceSubmission />}
            </main>
        </div>
    );
}

export default function App() {
    return (
        <RegionProvider>
            <AppShell />
        </RegionProvider>
    );
}
