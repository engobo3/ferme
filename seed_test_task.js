const admin = require('firebase-admin');

// Initialize Firebase Admin recursively
// Assume default project from firebaserc or emulator
// If no emulator, we might need a service account depending on env.
// Let's try initializing the default way
try {
    admin.initializeApp();
} catch (e) {
    // Ignore if already initialized
}

async function seedData() {
    const db = admin.firestore();
    try {
        const tasksRef = db.collection('tasks');
        const snapshot = await tasksRef.where('assignedTo', '==', 'michel-operator-123').get();

        if (snapshot.empty) {
            console.log('No tasks found for Michel. Seeding test task...');
            await tasksRef.add({
                assignedTo: 'michel-operator-123',
                status: 'pending',
                title: 'Test Verification Task',
                description: 'Please go to the field and take a photo of the crops to verify the planting stage.',
                payoutAmount: 5000,
                payoutCurrency: 'XOF',
                dueDate: new Date().toISOString(),
                evidence: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('Test task seeded successfully.');
        } else {
            console.log('Tasks already exist for Michel:', snapshot.docs.map(d => d.data().title));
        }
    } catch (err) {
        console.error('Error querying Firestore. Ensure emulators are running or you have access:', err);
    }
}

seedData();
