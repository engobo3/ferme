import React, { createContext, useContext, useState } from 'react';
import {
    DEFAULT_REGION_ID,
    getRegion,
    REGIONS,
} from '@diaspora-trust/core-logic';
import type { Region, RegionId } from '@diaspora-trust/core-logic';

/**
 * Marché sélectionné (Kinshasa / Cotonou) — persisté dans localStorage.
 * Pilote la devise affichée (CDF / XOF), l'indicatif téléphonique et
 * les exemples de saisie dans toute l'application fournisseur.
 */

const STORAGE_KEY = 'farmtrust-supplier-region';

interface RegionContextValue {
    region: Region;
    regionId: RegionId;
    setRegionId: (id: RegionId) => void;
}

const RegionContext = createContext<RegionContextValue | null>(null);

function readStoredRegionId(): RegionId {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && stored in REGIONS) return stored as RegionId;
    } catch {
        // localStorage indisponible (navigation privée, etc.)
    }
    return DEFAULT_REGION_ID;
}

export function RegionProvider({ children }: { children: React.ReactNode }) {
    const [regionId, setRegionIdState] = useState<RegionId>(readStoredRegionId);

    const setRegionId = (id: RegionId) => {
        setRegionIdState(id);
        try {
            localStorage.setItem(STORAGE_KEY, id);
        } catch {
            // Persistance impossible — le choix reste valable pour la session.
        }
    };

    return (
        <RegionContext.Provider value={{ region: getRegion(regionId), regionId, setRegionId }}>
            {children}
        </RegionContext.Provider>
    );
}

export function useRegion(): RegionContextValue {
    const ctx = useContext(RegionContext);
    if (!ctx) throw new Error('useRegion doit être utilisé dans un <RegionProvider>');
    return ctx;
}
