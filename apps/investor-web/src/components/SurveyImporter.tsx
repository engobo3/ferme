// web/components/SurveyImporter.tsx
"use client";
import React, { useState } from 'react';
import { kml, gpx } from '@mapbox/togeojson';
import { DOMParser } from '@xmldom/xmldom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as turf from '@turf/turf';
import { useAppT } from '../lib/i18n';

interface StatusMessage {
    text: string;
    isError: boolean;
}

export default function SurveyImporter({ userId }: { userId: string }) {
    const { ta } = useAppT();
    const [status, setStatus] = useState<StatusMessage | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<{ areaHa: number, coordinates: any[] } | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus({ text: ta('survey.parsing', { name: file.name }), isError: false });
        setPreviewData(null);

        try {
            const text = await file.text();
            const parser = new DOMParser();
            const dom = parser.parseFromString(text, 'text/xml');

            // Gatekeeper: Reject bad XML immediately
            if (dom.getElementsByTagName("parsererror").length > 0) {
                throw new Error(ta('survey.invalidXml'));
            }

            let geojson: any;
            if (file.name.endsWith('.kml')) {
                geojson = kml(dom);
            } else if (file.name.endsWith('.gpx')) {
                geojson = gpx(dom);
            } else {
                throw new Error(ta('survey.unsupported'));
            }

            // Extract the first Polygon found
            const features = geojson.features.filter((f: any) => f.geometry.type === 'Polygon');
            if (features.length === 0) {
                throw new Error(ta('survey.noPolygon'));
            }

            const targetBoundary = features[0]; // Take the first one for now

            // Calculate Area
            const areaSqMeters = turf.area(targetBoundary);
            const areaHa = Number((areaSqMeters / 10000).toFixed(2));

            setPreviewData({
                areaHa,
                coordinates: targetBoundary.geometry.coordinates[0].map((coord: number[]) => ({
                    longitude: coord[0],
                    latitude: coord[1]
                }))
            });

            setStatus({ text: ta('survey.parsed', { area: areaHa }), isError: false });
        } catch (error: any) {
            console.error(error);
            setStatus({ text: ta('survey.error', { message: error.message }), isError: true });
        } finally {
            setLoading(false);
        }
    };

    const confirmUpload = async () => {
        if (!previewData) return;
        setLoading(true);
        setStatus({ text: ta('survey.uploading'), isError: false });

        try {
            // Save as a new "Master Task" or "Farm Record".
            // Persisted text is French — the platform's working language.
            await addDoc(collection(db, 'tasks'), {
                title: `Levé importé (${previewData.areaHa} ha)`,
                description: `Importé depuis un fichier de levé professionnel. Superficie : ${previewData.areaHa} hectares.`,
                farmId: '', // TODO: Associate with actual farm ID when available
                assignedTo: userId,
                status: 'pending',
                payoutAmount: 0,
                isPaid: false,
                dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days default
                // Government-Ready "Ghost Polygon"
                targetBoundary: previewData.coordinates,
                calculatedAreaHa: previewData.areaHa,
                sourceType: 'professional_import',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setStatus({ text: ta('survey.success'), isError: false });
            setPreviewData(null);
        } catch (error: any) {
            console.error(error);
            setStatus({ text: ta('survey.error', { message: error.message }), isError: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{ta('survey.title')}</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                <input
                    type="file"
                    accept=".kml,.gpx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="survey-upload"
                    disabled={loading}
                />
                <label htmlFor="survey-upload" className="cursor-pointer block">
                    <div className="text-4xl mb-2">📥</div>
                    <span className="text-sm text-gray-500 font-medium">
                        {loading ? ta('survey.processing') : ta('survey.clickUpload')}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">{ta('survey.compatible')}</p>
                </label>
            </div>
            {previewData && (
                <div className="mt-6 bg-info-soft/50 p-4 rounded-lg border border-info-soft">
                    <h4 className="font-bold text-info mb-2">{ta('survey.analysis')}</h4>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-info">{ta('survey.calculatedArea')}</span>
                        <span className="text-xl font-bold text-info">{previewData.areaHa} ha</span>
                    </div>
                    <button
                        onClick={confirmUpload}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg shadow-sm transition-all"
                    >
                        {loading ? ta('survey.saving') : ta('survey.confirmSave')}
                    </button>
                    <p className="text-center text-xs text-info/70 mt-2">{ta('survey.updateNote')}</p>
                </div>
            )}

            {status && !previewData && (
                <div className={`mt-4 p-3 rounded text-sm font-medium ${status.isError ? 'bg-danger-soft text-danger' : 'bg-primary-faint text-primary'}`}>
                    {status.text}
                </div>
            )}
        </div>
    );
}
