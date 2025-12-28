
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { serviceAccount } from '@/firebase/service-account-credentials';

let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp({
        credential: {
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key,
        },
    }, 'admin');
} else {
    adminApp = getApps().find(app => app.name === 'admin') || initializeApp({
        credential: {
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key,
        },
    }, 'admin');
}


const adminDb = getFirestore(adminApp);

interface Member {
    id: string;
    [key: string]: any;
}

export async function getMembers(): Promise<{ success: boolean; data?: Member[]; error?: string }> {
    try {
        const membersSnapshot = await adminDb.collection('members').get();
        const members = membersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return { success: true, data: members };
    } catch (error: any) {
        console.error('Error fetching members with admin SDK:', error);
        return { success: false, error: error.message };
    }
}
