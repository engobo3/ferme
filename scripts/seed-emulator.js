/**
 * Seed the local Firebase emulator suite with demo accounts and data
 * for testing the three apps together. Idempotent — safe to re-run.
 *
 * Usage: node scripts/seed-emulator.js   (emulators must be running)
 *
 * Accounts created (password for both: demo-ferme-2026):
 *   operateur@ferme.local     — operator "Michel Opérateur" (mobile app)
 *   investisseur@ferme.local  — funder "Aline Diaspora" (investor web)
 */
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'ferme-9b64f';

const admin = require('firebase-admin');
admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT });

const PASSWORD = 'demo-ferme-2026';
const FARM_ID = 'ferme-kikwit';
const PROJECT_ID = 'chantier-kikwit';
// Kikwit, RD Congo
const FARM_LOCATION = { latitude: -5.0386, longitude: 18.8166 };
const DAY = 24 * 60 * 60 * 1000;

async function ensureUser(email, displayName) {
    const auth = admin.auth();
    try {
        return await auth.getUserByEmail(email);
    } catch {
        return await auth.createUser({ email, password: PASSWORD, displayName });
    }
}

async function seed() {
    const db = admin.firestore();
    const now = Date.now();

    // --- Accounts ---
    const operator = await ensureUser('operateur@ferme.local', 'Michel Opérateur');
    const funder = await ensureUser('investisseur@ferme.local', 'Aline Diaspora');

    await db.collection('users').doc(operator.uid).set({
        uid: operator.uid,
        email: 'operateur@ferme.local',
        displayName: 'Michel Opérateur',
        role: 'operator',
        region: 'kinshasa',
        farmIds: [FARM_ID],
        phoneNumber: '+243810000001',
        createdAt: now,
        updatedAt: now,
    }, { merge: true });

    await db.collection('users').doc(funder.uid).set({
        uid: funder.uid,
        email: 'investisseur@ferme.local',
        displayName: 'Aline Diaspora',
        role: 'funder',
        region: 'kinshasa',
        totalInvested: 12_000_000,
        availableBalance: 5_000_000,
        createdAt: now,
        updatedAt: now,
    }, { merge: true });

    // --- Farm ---
    await db.collection('farms').doc(FARM_ID).set({
        id: FARM_ID,
        name: 'Ferme de Kikwit',
        location: { ...FARM_LOCATION, address: 'Route de Vanga, Kikwit' },
        region: 'kinshasa',
        sizeHectares: 2.5,
        cropType: 'Volaille (poulets de chair)',
        ownerId: funder.uid,
        managerId: operator.uid,
        status: 'active',
        createdAt: now,
    }, { merge: true });

    // Geofence around the farm (~100m square) for the clock-in demo.
    const d = 0.001;
    const boundary = [
        { latitude: FARM_LOCATION.latitude - d, longitude: FARM_LOCATION.longitude - d },
        { latitude: FARM_LOCATION.latitude - d, longitude: FARM_LOCATION.longitude + d },
        { latitude: FARM_LOCATION.latitude + d, longitude: FARM_LOCATION.longitude + d },
        { latitude: FARM_LOCATION.latitude + d, longitude: FARM_LOCATION.longitude - d },
    ];

    // --- Tasks (idempotent via fixed doc ids) ---
    const tasks = [
        {
            id: 'demo-pesee-lot-a',
            title: 'Pesée hebdomadaire — Lot A',
            description: 'Peser 30 poulets au hasard du lot A et enregistrer le poids moyen. Photo de la balance exigée.',
            status: 'pending',
            dueDate: now + 2 * DAY,
            payoutAmount: 75_000,
            targetBoundary: boundary,
            evidence: [],
        },
        {
            id: 'demo-cloture-poulailler',
            title: 'Réparer la clôture du poulailler',
            description: 'Remplacer le grillage endommagé côté est avant les pluies. Photo avant/après exigée.',
            status: 'pending',
            dueDate: now - 3 * DAY, // en retard
            payoutAmount: 120_000,
            evidence: [],
        },
        {
            id: 'demo-vaccination-lot-a',
            title: 'Vaccination des poussins — Lot A',
            description: 'Vaccination Newcastle des 480 poussins du lot A.',
            status: 'in_review',
            dueDate: now - 1 * DAY,
            payoutAmount: 150_000,
            evidence: [{
                photoUrl: 'https://example.com/preuves/vaccination-lot-a.jpg',
                gpsLocation: FARM_LOCATION,
                timestamp: now - 1 * DAY,
                notes: 'Vaccination terminée, 480 poussins traités',
            }],
        },
        {
            id: 'demo-nettoyage-poulailler',
            title: 'Nettoyage complet du poulailler',
            description: 'Désinfection complète avant l’arrivée du nouveau lot.',
            status: 'completed',
            dueDate: now - 10 * DAY,
            payoutAmount: 60_000,
            isPaid: true,
            evidence: [{
                photoUrl: 'https://example.com/preuves/nettoyage.jpg',
                gpsLocation: FARM_LOCATION,
                timestamp: now - 9 * DAY,
            }],
        },
    ];

    for (const task of tasks) {
        const { id, ...data } = task;
        await db.collection('tasks').doc(id).set({
            farmId: FARM_ID,
            assignedTo: operator.uid,
            payoutCurrency: 'CDF',
            isPaid: false,
            createdAt: now - 7 * DAY,
            updatedAt: now,
            ...data,
        }, { merge: true });
    }

    // --- Materials (chantier) ---
    const materials = [
        {
            id: 'demo-ciment-cilu',
            name: 'Ciment CILU 50 kg',
            category: 'cement',
            quantity: 40,
            unit: 'sacs',
            unitPriceSubmitted: 28_000,
            unitPriceBenchmark: 26_500,
            status: 'delivered',
            trackingEvents: [
                { date: now - 5 * DAY, event: 'purchased', verifiedBy: 'Michel Opérateur' },
                { date: now - 3 * DAY, event: 'in-transit', verifiedBy: 'Michel Opérateur' },
                { date: now - 1 * DAY, event: 'delivered-site', verifiedBy: 'Michel Opérateur', gpsLocation: FARM_LOCATION },
            ],
        },
        {
            id: 'demo-fer-beton',
            name: 'Fer à béton 12 mm',
            category: 'rebar',
            quantity: 60,
            unit: 'barres',
            unitPriceSubmitted: 22_000,
            status: 'purchased',
            trackingEvents: [
                { date: now - 1 * DAY, event: 'purchased', verifiedBy: 'Michel Opérateur' },
            ],
        },
        {
            id: 'demo-blocs-15',
            name: 'Blocs ciment 15',
            category: 'blocks',
            quantity: 500,
            unit: 'pièces',
            unitPriceSubmitted: 1_800,
            unitPriceBenchmark: 1_750,
            status: 'installed',
            trackingEvents: [
                { date: now - 12 * DAY, event: 'purchased', verifiedBy: 'Michel Opérateur' },
                { date: now - 10 * DAY, event: 'in-transit', verifiedBy: 'Michel Opérateur' },
                { date: now - 8 * DAY, event: 'delivered-site', verifiedBy: 'Michel Opérateur', gpsLocation: FARM_LOCATION },
                { date: now - 2 * DAY, event: 'installed', verifiedBy: 'Michel Opérateur', gpsLocation: FARM_LOCATION },
            ],
        },
    ];

    for (const material of materials) {
        const { id, ...data } = material;
        await db.collection('materials').doc(id).set({
            projectId: PROJECT_ID,
            purchaseDate: data.trackingEvents[0].date,
            updatedAt: now,
            ...data,
        }, { merge: true });
    }

    console.log('--- Émulateur alimenté ---');
    console.log(`Opérateur  : operateur@ferme.local / ${PASSWORD} (uid ${operator.uid})`);
    console.log(`Investisseur : investisseur@ferme.local / ${PASSWORD} (uid ${funder.uid})`);
    console.log(`Ferme : ${FARM_ID} · ${tasks.length} tâches · ${materials.length} matériaux`);
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Échec du seed :', err);
        process.exit(1);
    });
