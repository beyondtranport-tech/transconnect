
'use server';

import { getClientSideAuthToken } from "@/firebase";
import { cookies } from "next/headers";
import { getAdminApp } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

// This is a helper function to call the admin API from a server action.
// It securely forwards the user's authentication token.
async function callAdminAPI(action: string, payload?: any) {
  const { app } = getAdminApp();
  if (!app) {
    return { success: false, error: 'Admin SDK not initialized' };
  }

  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('decodedToken');

  if (!tokenCookie) {
    return { success: false, error: 'Authentication token not found in cookies.' };
  }
  
  // This is a placeholder for a real token fetching mechanism in a real app.
  // In a production app, you would likely use a more secure session management strategy.
  const idToken = tokenCookie.value;

  // We need to resolve the base URL for fetch requests on the server.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/admin`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });

    return await response.json();
  } catch (error: any) {
    console.error(`Server action callAdminAPI failed for action: ${action}`, error);
    return { success: false, error: error.message || 'An internal server error occurred.' };
  }
}

export async function handleGetAuditLogs() {
    return await callAdminAPI('getAuditLogs');
}
