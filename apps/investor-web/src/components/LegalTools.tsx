"use client";
import React, { useState } from 'react';
import { useI18n } from '@diaspora-trust/shared-ui';
import SurveyImporter from './SurveyImporter';
import { useAppT } from '../lib/i18n';

export default function LegalTools({ userId }: { userId: string }) {
    const { locale } = useI18n();
    const { ta } = useAppT();
    const [activeTab, setActiveTab] = useState<'vault' | 'import'>('vault');

    const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            {/* Header / Tabs */}
            <div className="p-4 border-b border-gray-100 flex gap-4">
                <button
                    onClick={() => setActiveTab('vault')}
                    className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'vault' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {ta('legal.vaultTab')}
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'import' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    {ta('legal.importTab')}
                </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'vault' && (
                    <div className="space-y-6">
                        <div className="bg-info-soft/50 p-4 rounded-lg">
                            <h3 className="text-info font-medium mb-1">{ta('legal.safeKeeping')}</h3>
                            <p className="text-info text-sm">{ta('legal.safeKeepingDesc')}</p>
                        </div>

                        {/* Drop Zone */}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-white transition-colors cursor-pointer">
                            <div className="text-4xl mb-3">📄</div>
                            <p className="text-sm font-medium text-gray-700">{ta('legal.dropPdf')}</p>
                            <p className="text-xs text-gray-400 mt-1">{ta('legal.clickBrowse')}</p>
                        </div>

                        {/* Saved Docs List (Mock) */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{ta('legal.storedDocs')}</h4>
                            <div className="space-y-2">
                                <DocumentRow
                                    name="Titre_Foncier_Ecrit.pdf"
                                    date={new Date(2024, 9, 12).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    size="2.4 MB"
                                />
                                <DocumentRow
                                    name="Plan_Cadastral_v2.pdf"
                                    date={new Date(2025, 0, 15).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    size="1.1 MB"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'import' && (
                    <div className="space-y-4">
                        <div className="bg-primary-faint p-4 rounded-lg">
                            <h3 className="text-primary-dark font-medium mb-1">{ta('legal.boundary')}</h3>
                            <p className="text-primary text-sm">{ta('legal.boundaryDesc')}</p>
                        </div>

                        {/* Reuse the existing component */}
                        <div className="border border-gray-200 rounded-lg p-2">
                            <SurveyImporter userId={userId} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DocumentRow({ name, date, size }: { name: string, date: string, size: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
                <div className="bg-danger-soft text-danger p-2 rounded text-xs">PDF</div>
                <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">{name}</p>
                    <p className="text-xs text-gray-500">{date}</p>
                </div>
            </div>
            <span className="text-xs text-gray-400">{size}</span>
        </div>
    );
}
