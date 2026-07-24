import React, { useState } from 'react';
import { isPlausibleMsisdn } from '@diaspora-trust/core-logic';
import { useRegion } from '../lib/region';
import { RegionSelector } from './RegionSelector';

interface SupplierAuthProps {
    onAuth: () => void;
}

/**
 * Écran de connexion fournisseur — flux OTP SIMULÉ.
 * L'indicatif téléphonique suit le marché sélectionné (+243 / +229).
 */
export function SupplierAuth({ onAuth }: SupplierAuthProps) {
    const { region } = useRegion();
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'phone' | 'verify'>('phone');

    const phoneValid = isPlausibleMsisdn(phone, region);

    const handleSendCode = () => {
        if (phoneValid) {
            // TODO: Firebase phone auth
            setStep('verify');
        }
    };

    const handleVerify = () => {
        if (code.length === 6) {
            // TODO: Verify OTP with Firebase
            onAuth();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-page p-4">
            <div className="bg-surface rounded-2xl shadow-lg p-8 w-full max-w-sm border border-line">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">FarmTrust</h1>
                <p className="text-slate-500 mb-4">Portail Fournisseur</p>

                <div className="mb-6">
                    <p className="text-sm font-medium text-slate-700 mb-2">Votre marché</p>
                    <RegionSelector compact />
                    <p className="text-xs text-slate-500 mt-1.5">
                        {region.city}, {region.countryLabel} — prix en {region.currency}
                    </p>
                </div>

                {step === 'phone' ? (
                    <>
                        <label htmlFor="auth-phone" className="block text-sm font-medium text-slate-700 mb-2">
                            Numéro de téléphone
                        </label>
                        <div className="flex mb-4">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-surface-muted text-slate-600 font-medium select-none">
                                {region.phonePrefix}
                            </span>
                            <input
                                id="auth-phone"
                                type="tel"
                                inputMode="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="812 345 678"
                                className="w-full min-h-12 border border-slate-300 rounded-r-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                            />
                        </div>
                        <button
                            onClick={handleSendCode}
                            disabled={!phoneValid}
                            className="w-full min-h-12 bg-brand-700 text-white py-3 rounded-lg font-semibold hover:bg-brand-900 disabled:opacity-50 transition-colors"
                        >
                            Recevoir le code
                        </button>
                    </>
                ) : (
                    <>
                        <label htmlFor="auth-code" className="block text-sm font-medium text-slate-700 mb-2">
                            Code de vérification
                        </label>
                        <p className="text-xs text-slate-500 mb-3">
                            Code envoyé au {region.phonePrefix} {phone}
                        </p>
                        <input
                            id="auth-code"
                            type="text"
                            inputMode="numeric"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full min-h-12 border border-slate-300 rounded-lg px-4 py-3 mb-4 text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                        />
                        <button
                            onClick={handleVerify}
                            disabled={code.length !== 6}
                            className="w-full min-h-12 bg-brand-700 text-white py-3 rounded-lg font-semibold hover:bg-brand-900 disabled:opacity-50 transition-colors"
                        >
                            Vérifier
                        </button>
                    </>
                )}

                <p className="text-xs text-slate-400 mt-6 text-center">
                    Mode démonstration — la vérification SMS n’est pas encore activée.
                </p>
            </div>
        </div>
    );
}
