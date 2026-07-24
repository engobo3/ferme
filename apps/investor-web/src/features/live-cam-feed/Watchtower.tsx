"use client";
import React, { useState } from 'react';
import { useAppT, type AppStringKey } from '../../lib/i18n';

export default function Watchtower() {
    const { ta } = useAppT();

    // Mock Data for MVP — names come from the app catalog so they follow the locale
    const cameras: { id: number; nameKey: AppStringKey; status: 'online' | 'offline'; lat: string }[] = [
        { id: 1, nameKey: 'watch.camGate', status: 'online', lat: '120ms' },
        { id: 2, nameKey: 'watch.camField', status: 'online', lat: '124ms' },
        { id: 3, nameKey: 'watch.camShed', status: 'offline', lat: '-' },
        { id: 4, nameKey: 'watch.camProcessing', status: 'online', lat: '118ms' },
    ];

    const [selectedCam, setSelectedCam] = useState<number | null>(1);

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header / Network Status */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-bright/20 rounded-xl border border-primary-bright/50">
                        <span className="text-2xl animate-pulse">📡</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{ta('watch.hubTitle')}</h2>
                        <div className="flex items-center gap-2 text-sm text-green-400">
                            <span className="w-2 h-2 bg-primary-bright rounded-full"></span>
                            {ta('watch.signalStrong')}
                        </div>
                    </div>
                </div>

                <div className="flex gap-8 text-center">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">{ta('watch.downlink')}</p>
                        <p className="text-xl font-mono font-bold">142 Mbps</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">{ta('watch.uplink')}</p>
                        <p className="text-xl font-mono font-bold">18 Mbps</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">{ta('watch.latency')}</p>
                        <p className="text-xl font-mono font-bold text-yellow-400">32 ms</p>
                    </div>
                </div>
            </div>

            {/* Camera Grid */}
            <div className="grid grid-cols-12 gap-6 flex-1">
                {/* Main View */}
                <div className="col-span-12 lg:col-span-8 bg-black rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl">
                    {selectedCam ? (
                        <>
                            {/* Simulated Feed */}
                            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                <span className="text-slate-600 text-6xl">🎥</span>
                                <p className="absolute bottom-4 left-4 text-white font-mono bg-black/50 px-2 rounded">
                                    {ta('watch.live')}: {(() => { const cam = cameras.find(c => c.id === selectedCam); return cam ? ta(cam.nameKey) : ''; })()}
                                </p>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                                    <span className="text-red-500 text-xs font-bold font-mono">REC</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">{ta('watch.selectCamera')}</div>
                    )}
                </div>

                {/* Camera List */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                    <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider">{ta('watch.activeFeeds')}</h3>
                    {cameras.map((cam) => (
                        <button
                            key={cam.id}
                            onClick={() => setSelectedCam(cam.id)}
                            className={`p-4 rounded-xl border transition-all text-left group ${selectedCam === cam.id
                                    ? 'bg-slate-800 border-slate-600 shadow-lg'
                                    : 'bg-white border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold ${selectedCam === cam.id ? 'text-white' : 'text-slate-700'}`}>
                                    {ta(cam.nameKey)}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${cam.status === 'online' ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger'
                                    }`}>
                                    {cam.status === 'online' ? ta('watch.online') : ta('watch.offline')}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">{ta('watch.latencyLabel', { value: cam.lat })}</span>
                                <span className="text-slate-400">{ta('watch.motionNone')}</span>
                            </div>
                        </button>
                    ))}

                    <button className="mt-auto p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
                        <span>{ta('watch.addCamera')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
