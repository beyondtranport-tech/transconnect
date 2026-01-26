# Enabling Firebase Storage

The application uses Firebase Storage to save and manage user-uploaded assets like shop images, product photos, and AI-generated content. For the upload functionality to work, you must first enable the Storage service in your Firebase project and ensure the backend has the correct permissions.

---

## Step 1: Go to the Firebase Console

1.  Open the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (e.g., `transconnect-v1-39578841-2a857`).

## Step 2: Navigate to Storage

1.  In the left-hand navigation menu, under the **Build** section, click on **Storage**.

## Step 3: Get Started with Storage

1.  If Storage is not enabled, you will see a "Get started" button. Click it.
2.  A dialog will appear to guide you through setting up security rules. It is recommended to start in **Production mode**. Click **Next**.
    *   *Production mode* starts with all reads and writes disallowed, which is a secure default. The application's own security rules (`storage.rules`) will be applied automatically to grant the necessary permissions for users to upload their own files.
3.  You will then be asked to choose a location for your Storage bucket. The default location selected for you is usually the best choice. Click **Done**.

It may take a moment for your Storage bucket to be created and provisioned.

---

## Step 4: Troubleshooting - "Bucket not found" Error

**This is a critical step.** If you have enabled Storage but are still seeing errors like "The specified bucket does not exist" or "permission denied", it means the backend service account needs permission to access your storage bucket.

### 4.1: Find Your Service Account Email

1.  Go to the Google Cloud Console for your project: **[IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=transconnect-v1-39578841-2a857)**
2.  Find the principal (member) that has the name **"Firebase Admin SDK Administrator Service Agent"**.
3.  Copy its email address. It will look something like `firebase-adminsdk-fbsvc@transconnect-v1-39578841-2a857.iam.gserviceaccount.com`.

### 4.2: Grant Storage Admin Role

**Important:** Make sure you are on the main **IAM** page, which lists all principals (members). The top of the page should say "IAM". The "+ GRANT ACCESS" button is located at the top of this main page.

1.  On the **IAM** page, click the **+ GRANT ACCESS** button at the top.
2.  In the **"New principals"** field that appears, paste the service account email you just copied.
3.  In the **"Select a role"** dropdown, search for and select **"Storage Object Admin"**. This role provides the necessary permissions for the backend to manage files in your Storage bucket.
4.  Click **Save**.

After completing these steps, the file upload functionality within your application should work correctly. You do not need to make any further configuration changes.
