import React from 'react';
import { REGIONS } from '@diaspora-trust/core-logic';
import { useRegion } from '../lib/region';

/**
 * Sélecteur de marché (Kinshasa · CDF / Cotonou · XOF).
 * Cibles tactiles ≥ 44 px pour un usage en boutique, sur mobile.
 */
export function RegionSelector({ compact = false }: { compact?: boolean }) {
    const { regionId, setRegionId } = useRegion();

    return (
        <div
            role="group"
            aria-label="Choisir le marché"
            className="inline-flex rounded-full bg-surface-muted p-1 border border-line"
        >
            {Object.values(REGIONS).map(r => {
                const active = r.id === regionId;
                return (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => setRegionId(r.id)}
                        aria-pressed={active}
                        className={`min-h-11 px-4 rounded-full text-sm font-medium transition-colors ${
                            active
                                ? 'bg-brand-700 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {r.city}
                        {!compact && (
                            <span className={`ml-1.5 text-xs ${active ? 'text-brand-100' : 'text-slate-400'}`}>
                                {r.currency}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
