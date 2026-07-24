"use client";
import React from 'react';
import { signOut } from 'firebase/auth';
import { useI18n } from '@diaspora-trust/shared-ui';
import { auth } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { useAppT } from '../lib/i18n';

type Tab = 'overview' | 'watchtower' | 'approvals' | 'construction' | 'legal';

interface SidebarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const { ta } = useAppT();

    const displayName = user?.displayName || user?.email?.split('@')[0] || ta('side.user');
    const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const menuItems: { id: Tab; label: string; icon: string }[] = [
        { id: 'overview', label: t('nav.overview'), icon: '🏰' },
        { id: 'watchtower', label: t('nav.watchtower'), icon: '📡' },
        { id: 'approvals', label: t('nav.approvals'), icon: '✅' },
        { id: 'construction', label: t('nav.construction'), icon: '🏗️' },
        { id: 'legal', label: t('nav.legal'), icon: '⚖️' },
    ];

    return (
        <div className="w-64 h-screen bg-slate-900 text-white flex flex-col shadow-2xl z-20 font-sans">
            {/* Brand */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-bright to-primary-dark rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                    D
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-wide text-slate-100">DIASPORA</h1>
                    <p className="text-xs text-primary-bright font-bold tracking-[0.2em]">TRUST</p>
                </div>
            </div>

            {/* Asset Portfolio (The "Hub") */}
            <div className="px-4 pt-6 pb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 pl-2">{ta('side.myPortfolio')}</p>
                <div className="space-y-2">
                    {/* Project A: Farm (Active) */}
                    <button className="w-full flex items-center gap-3 p-3 bg-slate-800 rounded-xl border-l-4 border-primary-bright shadow-md">
                        <span className="text-lg">🚜</span>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">{ta('side.kikwitFarm')}</p>
                            <p className="text-[10px] text-green-400">{ta('side.farmStatus')}</p>
                        </div>
                    </button>

                    {/* Project B: Construction (Cross-Sell Hook) */}
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-xl border border-dashed border-slate-700 hover:border-construction-strong opacity-60 hover:opacity-100 transition-all">
                        <span className="text-lg">🏗️</span>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-300">{ta('side.newConstruction')}</p>
                            <p className="text-[10px] text-slate-500">{ta('side.clickToStart')}</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Platform Menu */}
            <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pl-2">{ta('side.platform')}</p>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${activeTab === item.id
                                ? 'bg-primary text-white shadow-lg shadow-primary-dark/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                    >
                        <span className="text-lg opacity-80">{item.icon}</span>
                        <span className="font-medium text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* User Profile (Bottom) */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-bright to-primary-dark flex items-center justify-center text-xs font-bold ring-2 ring-slate-900">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-200 truncate">{displayName}</p>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary-bright animate-pulse"></span>
                            {ta('side.online')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut(auth)}
                    className="w-full px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {t('common.signOut')}
                </button>
            </div>
        </div>
    );
}
