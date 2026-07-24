/**
 * Seed script for Firebase Emulator — populates Firestore with test data
 * matching what the investor-web dashboard expects.
 *
 * Usage:  npx tsx scripts/seed-emulator.ts
 *
 * Requires the Firestore emulator to be running on localhost:8080.
 */
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, collection, doc, setDoc, Timestamp } from "firebase/firestore";

const app = initializeApp({ projectId: "ferme-9b64f" });
const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

// --- Coordinates: realistic farm polygon near Bohicon, Benin ---
const farmBoundary = [
    { latitude: 7.1775, longitude: 2.0672 },
    { latitude: 7.1785, longitude: 2.0672 },
    { latitude: 7.1785, longitude: 2.0685 },
    { latitude: 7.1775, longitude: 2.0685 },
];

// A slightly offset "reality" polygon (simulates GPS walk discrepancy)
const realityGeojson = {
    type: "Feature",
    properties: {},
    geometry: {
        type: "Polygon",
        coordinates: [[
            [2.0674, 7.1776],
            [2.0683, 7.1776],
            [2.0686, 7.1784],
            [2.0676, 7.1786],
            [2.0674, 7.1776], // close ring
        ]]
    }
};

async function seed() {
    console.log("Seeding Firestore emulator...\n");

    // ── Users ──
    const users = [
        {
            id: "diaspora_user_123",
            displayName: "Michel Kambou",
            email: "michel@diaspora-trust.com",
            role: "funder",
            phone: "+12065551234",
        },
        {
            id: "operator_001",
            displayName: "Fabrice Hounsou",
            email: "fabrice@farm.local",
            role: "operator",
            phone: "+22961001001",
        },
        {
            id: "supplier_001",
            displayName: "Ets. Akobi & Fils",
            email: "akobi@supplier.local",
            role: "supplier",
            phone: "+22966551234",
        },
    ];

    for (const u of users) {
        await setDoc(doc(db, "users", u.id), u);
        console.log(`  ✓ users/${u.id} (${u.displayName})`);
    }

    // ── Tasks (drives FarmViewer, FinancialWidget, ApprovalQueue) ──
    const now = Date.now();
    const tasks = [
        {
            id: "task_feed_chicks_001",
            title: "Feed Day-Old Chicks — Batch #7",
            description: "Distribute 25kg starter mash to Poulailler A. Record feed bag photo.",
            status: "completed",
            assignedTo: "operator_001",
            assignedToName: "Fabrice Hounsou",
            payoutAmount: 15000,
            payoutCurrency: "XOF",
            isPaid: true,
            dueDate: Timestamp.fromMillis(now - 5 * 86400000),
            completedAt: Timestamp.fromMillis(now - 4 * 86400000),
            targetBoundary: farmBoundary,
            evidence: [
                { type: "photo", url: "https://placehold.co/400x300?text=Feed+Bag", timestamp: now - 4 * 86400000 },
                { type: "gps", gpsLocation: { latitude: 7.178, longitude: 2.068 } },
            ],
        },
        {
            id: "task_vaccinate_002",
            title: "Vaccinate Batch #7 — Newcastle Disease",
            description: "Administer Newcastle vaccine to 480 remaining birds. Photo of vaccine vial required.",
            status: "in_review",
            assignedTo: "operator_001",
            assignedToName: "Fabrice Hounsou",
            payoutAmount: 25000,
            payoutCurrency: "XOF",
            isPaid: false,
            dueDate: Timestamp.fromMillis(now - 1 * 86400000),
            targetBoundary: farmBoundary,
            geojson: realityGeojson,
            evidence: [
                { type: "photo", url: "https://placehold.co/400x300?text=Vaccine+Vial", timestamp: now - 86400000 },
                { type: "photo", url: "https://placehold.co/400x300?text=Chickens+Vaccinated", timestamp: now - 86400000 },
                { type: "gps", gpsLocation: { latitude: 7.1780, longitude: 2.0678 } },
            ],
        },
        {
            id: "task_weigh_pigs_003",
            title: "Weigh Pigs — Week 16 Check",
            description: "Record individual weights for all 12 pigs. Use ear tag IDs.",
            status: "in_review",
            assignedTo: "operator_001",
            assignedToName: "Fabrice Hounsou",
            payoutAmount: 10000,
            payoutCurrency: "XOF",
            isPaid: false,
            dueDate: Timestamp.fromMillis(now),
            evidence: [
                { type: "photo", url: "https://placehold.co/400x300?text=Pig+Scale", timestamp: now - 3600000 },
            ],
        },
        {
            id: "task_fence_repair_004",
            title: "Repair North Fence Section",
            description: "Replace 3 broken posts along the northern boundary. Submit before/after photos.",
            status: "pending",
            assignedTo: "operator_001",
            assignedToName: "Fabrice Hounsou",
            payoutAmount: 35000,
            payoutCurrency: "XOF",
            isPaid: false,
            dueDate: Timestamp.fromMillis(now + 3 * 86400000),
            targetBoundary: farmBoundary,
        },
        {
            id: "task_water_tank_005",
            title: "Install Water Tank for Poulailler B",
            description: "500L tank + piping. Collect receipts from Ets. Akobi.",
            status: "pending",
            assignedTo: "operator_001",
            assignedToName: "Fabrice Hounsou",
            payoutAmount: 120000,
            payoutCurrency: "XOF",
            isPaid: false,
            dueDate: Timestamp.fromMillis(now + 7 * 86400000),
        },
    ];

    for (const t of tasks) {
        const { id, ...data } = t;
        await setDoc(doc(db, "tasks", id), data);
        console.log(`  ✓ tasks/${id} (${data.status}) — ${data.title}`);
    }

    // ── Transactions (read by FinancialWidget if expanded later) ──
    const transactions = [
        {
            id: "txn_001",
            userId: "diaspora_user_123",
            type: "deposit",
            amount: 5000,
            currency: "USD",
            timestamp: Timestamp.fromMillis(now - 30 * 86400000),
            description: "Initial investment deposit",
        },
        {
            id: "txn_002",
            userId: "diaspora_user_123",
            type: "payout",
            amount: 15000,
            currency: "XOF",
            timestamp: Timestamp.fromMillis(now - 4 * 86400000),
            taskId: "task_feed_chicks_001",
            description: "Payout: Feed Day-Old Chicks",
        },
    ];

    for (const t of transactions) {
        const { id, ...data } = t;
        await setDoc(doc(db, "transactions", id), data);
        console.log(`  ✓ transactions/${id}`);
    }

    // ── Farms ──
    await setDoc(doc(db, "farms", "kikwit_farm_001"), {
        name: "Kikwit Farm",
        location: { latitude: 7.178, longitude: 2.068 },
        boundary: farmBoundary,
        owner: "diaspora_user_123",
        status: "active",
        livestock: {
            poultry: { currentBatch: 7, birdCount: 480, startDate: Timestamp.fromMillis(now - 21 * 86400000) },
            pigs: { count: 12, avgWeightKg: 45 },
        },
    });
    console.log("  ✓ farms/kikwit_farm_001");

    console.log("\nDone! Seeded 3 users, 5 tasks, 2 transactions, 1 farm.");
    console.log("Open the emulator UI at http://localhost:4000 to inspect.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
