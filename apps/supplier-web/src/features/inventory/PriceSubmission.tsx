import React, { useState } from 'react';
import { formatMoney } from '@diaspora-trust/core-logic';
import type { MaterialCategory, RegionId } from '@diaspora-trust/core-logic';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { useRegion } from '../../lib/region';

const CATEGORIES: { value: MaterialCategory; label: string }[] = [
    { value: 'cement', label: 'Ciment (sac 50 kg)' },
    { value: 'blocks', label: 'Parpaings' },
    { value: 'sand', label: 'Sable (m³)' },
    { value: 'gravel', label: 'Gravier (m³)' },
    { value: 'rebar', label: 'Fer à béton' },
    { value: 'roofing', label: 'Tôle (pièce)' },
    { value: 'timber', label: 'Bois' },
    { value: 'plumbing', label: 'Plomberie' },
    { value: 'electrical', label: 'Électricité' },
    { value: 'paint', label: 'Peinture' },
    { value: 'other', label: 'Autre' },
];

/** Exemple de produit local par marché — évite les marques d'un autre pays. */
const NAME_EXAMPLES: Record<RegionId, string> = {
    kinshasa: 'Ex : Ciment CILU 42,5',
    cotonou: 'Ex : Ciment NOCIBÉ CPJ 35',
};

interface PriceEntry {
    category: MaterialCategory;
    name: string;
    unitPrice: number;
    unit: string;
}

interface SubmitPriceResult {
    success: boolean;
    message: string;
    results: { name: string; status: string; variancePercent?: number; strikesRemaining?: number }[];
    warnings: string[];
}

export function PriceSubmission() {
    const { region } = useRegion();
    const [entries, setEntries] = useState<PriceEntry[]>([]);
    const [category, setCategory] = useState<MaterialCategory>('cement');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('pièce');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);

    const addEntry = () => {
        const parsed = parseFloat(price);
        if (!name.trim() || isNaN(parsed) || parsed <= 0) return;

        setEntries(prev => [...prev, { category, name: name.trim(), unitPrice: parsed, unit }]);
        setName('');
        setPrice('');
        setFeedback(null);
    };

    const removeEntry = (index: number) => {
        setEntries(prev => prev.filter((_, i) => i !== index));
    };

    const submitPrices = async () => {
        setSubmitting(true);
        setFeedback(null);
        setWarnings([]);
        try {
            const submitFn = httpsCallable<
                { entries: (PriceEntry & { currency: string })[]; region: RegionId; currency: string },
                SubmitPriceResult
            >(functions, 'submitSupplierPrice');

            // Chaque entrée porte la devise du marché sélectionné (CDF à Kinshasa,
            // XOF à Cotonou). NOTE : le backend submitSupplierPrice ne stocke pas
            // encore ce champ — il est envoyé pour compatibilité future.
            const result = await submitFn({
                entries: entries.map(e => ({ ...e, currency: region.currency })),
                region: region.id,
                currency: region.currency,
            });

            const flagged = result.data.results.filter(r => r.status === 'flagged');
            setFeedback({
                kind: 'success',
                text: `${entries.length} prix soumis pour vérification (${region.city}, ${region.currency}).`,
            });
            setWarnings([
                ...result.data.warnings,
                ...flagged.map(f => `« ${f.name} » dépasse le prix de référence — signalé pour contrôle.`),
            ]);
            setEntries([]);
        } catch (error: unknown) {
            console.error('Price submission failed:', error);
            const message = error instanceof Error ? error.message : null;
            setFeedback({
                kind: 'error',
                text: message ? `Erreur : ${message}` : 'Échec de la soumission. Vérifiez votre connexion et réessayez.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface rounded-xl p-6 shadow-sm border border-line">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Soumettre vos prix</h2>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-chantier-100 text-chantier-700">
                        {region.city} · {region.currency}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                        <label htmlFor="price-category" className="block text-sm font-medium text-slate-700 mb-1">
                            Catégorie
                        </label>
                        <select
                            id="price-category"
                            value={category}
                            onChange={e => setCategory(e.target.value as MaterialCategory)}
                            className="w-full min-h-11 border border-slate-300 rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="price-name" className="block text-sm font-medium text-slate-700 mb-1">
                            Nom du produit
                        </label>
                        <input
                            id="price-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={NAME_EXAMPLES[region.id]}
                            className="w-full min-h-11 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                        <label htmlFor="price-amount" className="block text-sm font-medium text-slate-700 mb-1">
                            Prix unitaire ({region.currency})
                        </label>
                        <input
                            id="price-amount"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder={region.currency === 'CDF' ? '25 000' : '5 000'}
                            className="w-full min-h-11 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="price-unit" className="block text-sm font-medium text-slate-700 mb-1">
                            Unité
                        </label>
                        <input
                            id="price-unit"
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            placeholder="sac, pièce, m³…"
                            className="w-full min-h-11 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
                        />
                    </div>
                </div>

                <button
                    onClick={addEntry}
                    className="w-full min-h-12 border-2 border-dashed border-slate-300 py-3 rounded-lg text-slate-600 hover:border-brand-600 hover:text-brand-700 transition-colors"
                >
                    + Ajouter ce produit
                </button>
            </div>

            {feedback && (
                <div
                    role="status"
                    className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                        feedback.kind === 'success'
                            ? 'bg-success-soft text-success border-success/20'
                            : 'bg-danger-soft text-danger border-danger/20'
                    }`}
                >
                    {feedback.text}
                </div>
            )}
            {warnings.length > 0 && (
                <div className="rounded-xl px-4 py-3 text-sm bg-warning-soft text-warning border border-warning/20 space-y-1">
                    {warnings.map((w, i) => (
                        <p key={i}>{w}</p>
                    ))}
                </div>
            )}

            {entries.length > 0 && (
                <div className="bg-surface rounded-xl p-6 shadow-sm border border-line">
                    <h3 className="font-semibold text-slate-900 mb-3">
                        Produits à soumettre ({entries.length})
                    </h3>
                    <div className="space-y-2 mb-4">
                        {entries.map((entry, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-line">
                                <div>
                                    <span className="font-medium text-slate-900">{entry.name}</span>
                                    <span className="text-sm text-slate-500 ml-2">({entry.unit})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-slate-900">
                                        {formatMoney(entry.unitPrice, region.currency)}
                                    </span>
                                    <button
                                        onClick={() => removeEntry(i)}
                                        aria-label={`Retirer ${entry.name}`}
                                        className="min-h-11 min-w-11 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-soft transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={submitPrices}
                        disabled={submitting}
                        className="w-full min-h-12 bg-brand-700 text-white py-3 rounded-lg font-semibold hover:bg-brand-900 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? 'Soumission en cours…' : `Soumettre ${entries.length} prix en ${region.currency}`}
                    </button>
                </div>
            )}
        </div>
    );
}
