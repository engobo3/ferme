"use client";
import React, { useState } from 'react';
import type { Material } from '@diaspora-trust/core-logic';
import { validateMaterialChainOfCustody } from '@diaspora-trust/core-logic';

// Mock materials - replace with Firestore
const MOCK_MATERIALS: Material[] = [
    {
        id: 'm1', projectId: 'proj1', name: 'Ciment CimGabon 50kg', category: 'cement',
        quantity: 100, unit: 'sacs', unitPriceSubmitted: 6500,
        status: 'delivered', trackingEvents: [
            { date: Date.now() - 5 * 86400000, event: 'purchased', verifiedBy: 'Fournisseur Central', photoUrl: undefined, gpsLocation: { latitude: -4.325, longitude: 15.322 } },
            { date: Date.now() - 3 * 86400000, event: 'in-transit', verifiedBy: 'Chauffeur Mbuyi', gpsLocation: { latitude: -4.330, longitude: 15.340 } },
            { date: Date.now() - 1 * 86400000, event: 'delivered-site', verifiedBy: 'Michel (opérateur)', gpsLocation: { latitude: -4.341, longitude: 15.355 } },
        ],
    },
    {
        id: 'm2', projectId: 'proj1', name: 'Parpaings 15x20x40', category: 'blocks',
        quantity: 2000, unit: 'pieces', unitPriceSubmitted: 350,
        status: 'installed', trackingEvents: [
            { date: Date.now() - 10 * 86400000, event: 'purchased', verifiedBy: 'Briqueterie Nsele' },
            { date: Date.now() - 8 * 86400000, event: 'in-transit', verifiedBy: 'Chauffeur Kabongo' },
            { date: Date.now() - 7 * 86400000, event: 'delivered-site', verifiedBy: 'Michel (opérateur)' },
            { date: Date.now() - 2 * 86400000, event: 'installed', verifiedBy: 'Michel (opérateur)', photoUrl: 'https://example.com/photo.jpg' },
        ],
    },
    {
        id: 'm3', projectId: 'proj1', name: 'Fer à béton 12 mm', category: 'rebar',
        quantity: 50, unit: 'barres', unitPriceSubmitted: 8500,
        status: 'purchased', trackingEvents: [
            { date: Date.now() - 1 * 86400000, event: 'purchased', verifiedBy: 'Quincaillerie Maputo' },
        ],
    },
    {
        id: 'm4', projectId: 'proj1', name: 'Tôle bac alu 3 m', category: 'roofing',
        quantity: 40, unit: 'feuilles', unitPriceSubmitted: 12000,
        status: 'quoted', trackingEvents: [],
    },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    'quoted': { label: 'Devis', color: 'bg-gray-100 text-gray-600' },
    'approved': { label: 'Approuvé', color: 'bg-info-soft text-info' },
    'purchased': { label: 'Acheté', color: 'bg-construction-soft text-construction' },
    'delivered': { label: 'Livré', color: 'bg-purple-100 text-purple-700' },
    'installed': { label: 'Installé', color: 'bg-primary-soft text-primary' },
};

const EVENT_LABELS: Record<string, string> = {
    'purchased': 'Achat',
    'in-transit': 'En transit',
    'delivered-site': 'Livré sur site',
    'installed': 'Installé',
    'damaged': 'Endommagé',
    'missing': 'Manquant',
};

export function MaterialTracker() {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex gap-3 flex-wrap">
                {Object.entries(STATUS_LABELS).map(([key, val]) => (
                    <span key={key} className={`px-2.5 py-1 rounded-full text-xs font-medium ${val.color}`}>
                        {val.label}
                    </span>
                ))}
            </div>

            {/* Material Cards */}
            {MOCK_MATERIALS.map(material => {
                const custody = validateMaterialChainOfCustody(material);
                const statusStyle = STATUS_LABELS[material.status] || STATUS_LABELS['quoted'];
                const isExpanded = expandedId === material.id;

                return (
                    <div key={material.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : material.id)}
                            className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="text-left">
                                <h4 className="font-semibold text-gray-900">{material.name}</h4>
                                <p className="text-sm text-gray-500">{material.quantity} {material.unit}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {!custody.complete && custody.missingSteps.length > 0 && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                        {custody.missingSteps.filter(s => s.startsWith('ALERT')).length > 0
                                            ? 'ALERTE'
                                            : `${custody.missingSteps.length} étape(s) manquante(s)`
                                        }
                                    </span>
                                )}
                                {custody.complete && (
                                    <span className="text-xs bg-primary-soft text-primary px-2 py-1 rounded-full font-medium">
                                        Chaîne complète
                                    </span>
                                )}
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}>
                                    {statusStyle.label}
                                </span>
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {/* Expanded: Timeline */}
                        {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                                {material.trackingEvents.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Aucun événement de suivi</p>
                                ) : (
                                    <div className="relative pl-6">
                                        {/* Vertical line */}
                                        <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200" />

                                        {material.trackingEvents.map((event, i) => {
                                            const isLast = i === material.trackingEvents.length - 1;
                                            const isAlert = event.event === 'missing' || event.event === 'damaged';
                                            return (
                                                <div key={i} className="relative mb-4 last:mb-0">
                                                    {/* Dot */}
                                                    <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 ${
                                                        isAlert ? 'bg-red-500 border-red-300' :
                                                        isLast ? 'bg-blue-500 border-blue-300' : 'bg-green-500 border-green-300'
                                                    }`} />

                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <p className={`font-medium text-sm ${isAlert ? 'text-red-700' : 'text-gray-900'}`}>
                                                                {EVENT_LABELS[event.event] || event.event}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Par : {event.verifiedBy}</p>
                                                        {event.gpsLocation && (
                                                            <p className="text-xs text-gray-400">
                                                                GPS: {event.gpsLocation.latitude.toFixed(3)}, {event.gpsLocation.longitude.toFixed(3)}
                                                            </p>
                                                        )}
                                                        {event.notes && (
                                                            <p className="text-xs text-gray-500 mt-1 italic">{event.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Missing steps warning */}
                                {custody.missingSteps.length > 0 && (
                                    <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-100">
                                        <p className="text-xs font-semibold text-red-700 mb-1">Étapes manquantes :</p>
                                        {custody.missingSteps.map((step, i) => (
                                            <p key={i} className="text-xs text-red-600">- {EVENT_LABELS[step] || step}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
