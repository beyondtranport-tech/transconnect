
import type { ServiceAccount } from 'firebase-admin/app';

// This is a placeholder that will be populated by the environment.
// It is critical that these environment variables are set correctly.
export const serviceAccount: ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
