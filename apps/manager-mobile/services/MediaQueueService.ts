import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

const QUEUE_KEY = 'MEDIA_UPLOAD_QUEUE';

export interface MediaJob {
    id: string;
    localPath: string; // file:///...
    storagePath: string; // evidence/task-123/img.jpg
    firestoreCollection: string;
    firestoreId: string;
    fieldName: string; // 'evidence' usually, but could be 'profilePic'
    metadata: any; // { type: 'photo' | 'video', taskId: '...' }
    status: 'pending' | 'uploading' | 'failed' | 'completed';
    retryCount: number;
    createdAt: number;
}

class MediaQueueService {
    private listeners: ((queue: MediaJob[]) => void)[] = [];
    private processingPromise: Promise<void> | null = null;

    constructor() {
        // Auto-start processing when network comes online
        NetInfo.addEventListener(state => {
            if (state.isConnected) {
                this.processQueue();
            }
        });
    }

    // Subscribe to queue changes
    subscribe(listener: (queue: MediaJob[]) => void) {
        this.listeners.push(listener);
        this.getQueue().then(queue => listener(queue)); // Initial emit
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners(queue: MediaJob[]) {
        this.listeners.forEach(l => l(queue));
    }

    // Helper for UI
    async getJobsForTask(taskId: string): Promise<MediaJob[]> {
        const queue = await this.getQueue();
        return queue.filter(j => j.firestoreId === taskId);
    }

    // 1. Add Job to Queue (Called by UI)
    async addJob(jobData: Omit<MediaJob, 'id' | 'status' | 'retryCount' | 'createdAt'>) {
        const newJob: MediaJob = {
            ...jobData,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            status: 'pending',
            retryCount: 0,
            createdAt: Date.now(),
        };

        const queue = await this.getQueue();
        queue.push(newJob);
        await this.saveQueue(queue);

        console.log(`[MediaQueue] Job Added: ${newJob.id}`);

        // Try to process immediately
        this.processQueue();
    }

    // 2. Main Processor (serialized via promise chain to prevent races)
    async processQueue() {
        if (this.processingPromise) return;
        this.processingPromise = this._processQueueInner();
        try { await this.processingPromise; } finally { this.processingPromise = null; }
    }

    private async _processQueueInner() {
        const net = await NetInfo.fetch();
        if (!net.isConnected) {
            console.log('[MediaQueue] Offline. Pausing processing.');
            return;
        }

        const queue = await this.getQueue();
        const pendingJobs = queue.filter(j => j.status === 'pending' || j.status === 'failed');

        if (pendingJobs.length === 0) return;

        console.log(`[MediaQueue] Processing ${pendingJobs.length} jobs...`);

        for (const job of pendingJobs) {
            const currentNet = await NetInfo.fetch();
            if (!currentNet.isConnected) break;

            await this.processJob(job);
        }
    }

    // 3. Process Single Job
    private async processJob(job: MediaJob) {
        try {
            console.log(`[MediaQueue] Uploading ${job.id}...`);

            // A. Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(job.localPath);
            if (!fileInfo.exists) {
                console.error(`[MediaQueue] File not found: ${job.localPath}`);
                await this.removeJob(job.id); // Can't recover
                return;
            }

            // B. Upload to Firebase Storage
            const reference = storage().ref(job.storagePath);
            await reference.putFile(job.localPath);
            const downloadUrl = await reference.getDownloadURL();

            // C. Update Firestore
            // We append to the 'evidence' array or update a field
            if (job.fieldName === 'evidence') {
                await firestore().collection(job.firestoreCollection).doc(job.firestoreId).update({
                    evidence: firestore.FieldValue.arrayUnion({
                        ...job.metadata,
                        url: downloadUrl,
                        uploadedAt: Date.now(),
                        source: 'offline-queue',
                        networkType: (await NetInfo.fetch()).type // Track if uploaded via Starlink/WiFi or Cell
                    })
                });
            } else {
                // Generic field update
                await firestore().collection(job.firestoreCollection).doc(job.firestoreId).update({
                    [job.fieldName]: downloadUrl
                });
            }

            console.log(`[MediaQueue] Success: ${job.id}`);
            await this.removeJob(job.id);

        } catch (error) {
            console.error(`[MediaQueue] Failed ${job.id}`, error);
            await this.updateJobStatus(job.id, 'failed');
            // Notify so UI shows Red
            this.notifyListeners(await this.getQueue());
        }
    }

    // Helpers
    private async getQueue(): Promise<MediaJob[]> {
        const json = await AsyncStorage.getItem(QUEUE_KEY);
        return json ? JSON.parse(json) : [];
    }

    private async saveQueue(queue: MediaJob[]) {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        this.notifyListeners(queue);
    }

    private async removeJob(id: string) {
        const queue = await this.getQueue();
        const newQueue = queue.filter(j => j.id !== id);
        await this.saveQueue(newQueue);
    }

    private async updateJobStatus(id: string, status: MediaJob['status']) {
        const queue = await this.getQueue();
        const index = queue.findIndex(j => j.id === id);
        if (index > -1) {
            queue[index].status = status;
            queue[index].retryCount += 1;
            await this.saveQueue(queue);
        }
    }
}

export const mediaQueue = new MediaQueueService();
