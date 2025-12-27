
// This file is a placeholder for the service account credentials.
// In a real production environment, these credentials would be securely stored
// and accessed, for example, as environment variables.
// For the purposes of this development environment, we can use a placeholder
// that the backend will replace with the actual credentials.

export const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID!,
  "private_key": process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL!,
  "client_id": process.env.FIREBASE_CLIENT_ID!,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL!,
};
