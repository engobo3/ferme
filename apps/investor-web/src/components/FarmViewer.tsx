// web/components/FarmViewer.tsx
"use client";
import { useEffect, useState, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import type { FillLayerSpecification, LineLayerSpecification } from 'mapbox-gl';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppT } from '../lib/i18n';

// Mapbox token from environment variable
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/** Ensure a GeoJSON ring is closed (first coord == last coord). */
function ensureRingClosure(coords: number[][]) {
    if (coords.length < 2) return;
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push([...first]);
    }
}

export default function FarmViewer({ userId }: { userId: string }) {
    const { ta } = useAppT();
    const [tasks, setTasks] = useState<any[]>([]);
    const [viewState, setViewState] = useState({
        latitude: 6.366, // Benin/Togo region default
        longitude: 2.418,
        zoom: 16
    });

    useEffect(() => {
        const q = query(collection(db, 'tasks'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(data);
        });
        return () => unsubscribe();
    }, [userId]);

    // Quick Data Mapping for Visualization
    const geoJsonData = useMemo(() => {
        const features: any[] = [];

        tasks.forEach(task => {
            // LAYER 1: LEGAL (Blue) - "Surveyor's Import"
            if (task.targetBoundary?.length > 2) {
                const coords = task.targetBoundary.map((p: any) => [p.longitude, p.latitude]);
                ensureRingClosure(coords);

                features.push({
                    type: 'Feature',
                    properties: { type: 'legal', id: task.id },
                    geometry: { type: 'Polygon', coordinates: [coords] }
                });
            }

            // LAYER 2: REALITY (Red) - "Michel's GPS Walk"
            if (task.realityBoundary?.length > 2) {
                const rCoords = task.realityBoundary.map((p: any) => [p.longitude, p.latitude]);
                ensureRingClosure(rCoords);

                features.push({
                    type: 'Feature',
                    properties: { type: 'reality', id: task.id },
                    geometry: { type: 'Polygon', coordinates: [rCoords] }
                });
            }
        });

        return {
            type: 'FeatureCollection',
            features
        };
    }, [tasks]);

    // Truth Gap Alert Logic
    const activeAlert = useMemo(() => {
        return tasks.some(t => t.targetBoundary?.length > 2 && t.realityBoundary?.length > 2);
    }, [tasks]);

    const legalStyle: Omit<FillLayerSpecification, 'source'> = {
        id: 'legal-fill',
        type: 'fill',
        paint: {
            'fill-color': '#0000FF',
            'fill-opacity': 0.2
        },
        filter: ['==', 'type', 'legal']
    };

    const legalOutline: Omit<LineLayerSpecification, 'source'> = {
        id: 'legal-outline',
        type: 'line',
        paint: {
            'line-color': '#0000FF',
            'line-width': 2
        },
        filter: ['==', 'type', 'legal']
    };

    const realityStyle: Omit<FillLayerSpecification, 'source'> = {
        id: 'reality-fill',
        type: 'fill',
        paint: {
            'fill-color': '#FF0000',
            'fill-opacity': 0.2
        },
        filter: ['==', 'type', 'reality']
    };

    const realityOutline: Omit<LineLayerSpecification, 'source'> = {
        id: 'reality-outline',
        type: 'line',
        paint: {
            'line-color': '#FF0000',
            'line-width': 3,
            'line-dasharray': [2, 1]
        },
        filter: ['==', 'type', 'reality']
    };

    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative bg-gray-100">
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/satellite-v9"
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                <Source id="farm-data" type="geojson" data={geoJsonData as any}>
                    <Layer {...legalStyle} />
                    <Layer {...legalOutline} />
                    <Layer {...realityStyle} />
                    <Layer {...realityOutline} />
                </Source>
            </Map>

            {activeAlert && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-pulse z-50">
                    <span className="text-2xl">&#9888;&#65039;</span>
                    <div>
                        <p className="font-bold text-sm">{ta('map.truthGap')}</p>
                        <p className="text-xs opacity-90">{ta('map.truthGapDesc')}</p>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-4 rounded-xl text-xs z-10 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500/20 border border-blue-500 rounded"></div>
                    <span className="font-medium text-gray-700">{ta('map.legalBoundary')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500/20 border border-red-500 border-dashed rounded"></div>
                    <span className="font-medium text-gray-700">{ta('map.reality')}</span>
                </div>
            </div>
        </div>
    );
}
