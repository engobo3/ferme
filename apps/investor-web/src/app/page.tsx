"use client";
import { useState } from 'react';
import { useI18n } from '@diaspora-trust/shared-ui';
import { useAuth } from '../components/AuthProvider';
import LoginPage from '../components/LoginPage';
import Sidebar from '../components/Sidebar';
import FarmViewer from '../components/FarmViewer';
import FinancialWidget from '../features/financial-reports/FinancialWidget';
import LegalTools from '../components/LegalTools';
import Watchtower from '../features/live-cam-feed/Watchtower';
import ApprovalQueue from '../features/approvals/ApprovalQueue';
import ConstructionDashboard from '../features/construction/ConstructionDashboard';
import SmartYieldPredictor from '../features/financial-reports/SmartYieldPredictor';
import { useAppT } from '../lib/i18n';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const { t } = useI18n();
    const { ta } = useAppT();
    const [auditMode, setAuditMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'watchtower' | 'approvals' | 'construction' | 'legal'>('overview');

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-bright to-primary-dark rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 animate-pulse">D</div>
                    <p className="text-slate-400 text-sm">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (!user) return <LoginPage />;

    const userId = user.uid;

    return (
        <div className="flex h-screen bg-slate-50 overscroll-none">
            {/* Sidebar Navigation */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* Top Bar (Glass) */}
                <div className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10 sticky top-0">
                    <h2 className="text-xl font-bold text-slate-800">
                        {activeTab === 'overview' && ta('dash.commandCenter')}
                        {activeTab === 'watchtower' && ta('dash.watchtowerTitle')}
                        {activeTab === 'approvals' && ta('dash.approvalsTitle')}
                        {activeTab === 'construction' && ta('dash.constructionTitle')}
                        {activeTab === 'legal' && ta('dash.legalTitle')}
                    </h2>
                    <div className="flex items-center gap-4">
                        <StatusBadge label={ta('dash.starlinkHub')} status="online" />
                        <StatusBadge label={ta('dash.systemHealth')} status="good" />
                        <LocaleToggle />
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-100">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-12 gap-6 h-full min-h-[600px]">
                            {/* Map - Takes Dominance */}
                            <div className="col-span-12 lg:col-span-9 h-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white relative">
                                <div className="absolute top-4 left-4 z-10">
                                    <div className="bg-slate-900/90 text-white px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest backdrop-blur border border-slate-700">
                                        {ta('dash.liveSatellite')}
                                    </div>
                                </div>
                                <FarmViewer userId={userId} />
                            </div>

                            {/* Widgets - Quick Glance */}
                            <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                                <FinancialWidget
                                    userId={userId}
                                    auditMode={auditMode}
                                    setAuditMode={setAuditMode}
                                />
                                <SmartYieldPredictor />
                            </div>
                        </div>
                    )}

                    {/* OTHER TABS */}
                    {activeTab === 'watchtower' && <Watchtower />}
                    {activeTab === 'approvals' && <ApprovalQueue />}
                    {activeTab === 'construction' && <ConstructionDashboard />}
                    {activeTab === 'legal' && <LegalTools userId={userId} />}
                </div>
            </main>
        </div>
    );
}

// Sub-Components

/** FR | EN switch — drives both the shared and app-local catalogs. */
function LocaleToggle() {
    const { locale, setLocale } = useI18n();
    return (
        <button
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold hover:border-primary transition-colors"
            aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
        >
            <span className={locale === 'fr' ? 'text-primary' : 'text-slate-400'}>FR</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className={locale === 'en' ? 'text-primary' : 'text-slate-400'}>EN</span>
        </button>
    );
}

function StatusBadge({ label, status }: { label: string, status: 'online' | 'good' | 'warn' }) {
    const colors = {
        online: 'bg-primary-soft text-primary border-primary-soft',
        good: 'bg-info-soft text-info border-info-soft',
        warn: 'bg-construction-soft text-construction border-construction-soft'
    };
    return (
        <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-2 ${colors[status]}`}>
            <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-primary-bright' : 'bg-info'} animate-pulse`}></span>
            {label}
        </div>
    );
}
