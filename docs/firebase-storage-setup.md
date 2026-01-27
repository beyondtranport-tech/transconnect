
# Enabling Firebase Storage

The application uses Firebase Storage to save and manage user-uploaded assets like shop images, product photos, and AI-generated content. For the upload functionality to work, you must first enable the Storage service in your Firebase project and ensure the backend has the correct permissions.

---

## Step 0: Verify Your Storage Bucket

Before granting permissions, it's crucial to ensure your Storage bucket exists and is properly configured.

1.  **Go to Google Cloud Storage:** Open the Cloud Storage browser for your project by clicking this link: **[https://console.cloud.google.com/storage/browser?project=transconnect-v1-39578841-2a857](https://console.cloud.google.com/storage/browser?project=transconnect-v1-39578841-2a857)**

2.  **Check for a Bucket:** You should see a single bucket listed, typically named `transconnect-v1-39578841-2a857.appspot.com`.
    *   **If you see the bucket:** Your bucket is correctly provisioned. You can proceed to Step 1.
    *   **If you DO NOT see a bucket:** This is the root of the problem. Your Storage is not enabled. Please proceed to Step 1 to enable it first.

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

It may take a moment for your Storage bucket to be created and provisioned. After it's created, you can go back to the Google Cloud link from Step 0 to confirm you see the bucket listed.

---

## Step 4: Grant Backend Permissions

This is the most critical step to solve upload errors. If your bucket exists but uploads are hanging or failing, it's almost always a permissions issue.

### 4.1: Find Your Service Account Email

1.  Go to the Google Cloud Console's main **IAM** page for your project: **[IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=transconnect-v1-39578841-2a857)**
2.  Find the principal (member) that has the name **"Firebase Admin SDK Administrator Service Agent"**.
3.  Copy its email address. It will look like `firebase-adminsdk-fbsvc@transconnect-v1-39578841-2a857.iam.gserviceaccount.com`.

### 4.2: Grant Storage Admin Role

**Important:** Make sure you are on the main **IAM** page, which lists all principals (members). The top of the page should say "IAM". The "+ GRANT ACCESS" button is located at the top of this main page, **not** on the "Service Accounts" sub-page.

1.  On the main **IAM** page, click the **+ GRANT ACCESS** button at the top.
2.  In the **"New principals"** field that appears, paste the service account email you just copied.
3.  In the **"Select a role"** dropdown, search for and select **"Storage Object Admin"**. This role provides the necessary permissions for the backend to create, view, and delete files in your Storage bucket.
4.  Click **Save**. A "Policy updated" message will appear. It may take a minute or two for permissions to take effect.

After completing these steps, the file upload functionality within your application should work correctly. You do not need to make any further configuration changes.
