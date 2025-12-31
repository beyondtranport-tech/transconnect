
import type { ServiceAccount } from 'firebase-admin/app';
import serviceAccountJson from './service-account.json';

// This file now correctly imports the JSON and casts it to the ServiceAccount type.
// This ensures that the private key and other fields are correctly formatted.
export const serviceAccount = serviceAccountJson as ServiceAccount;
