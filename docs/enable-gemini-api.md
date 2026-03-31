# How to Fix AI Feature "403 Forbidden" Errors

If you are seeing a "403 Forbidden" or "API is blocked" error when trying to use AI features, it means the necessary Google Cloud APIs are not enabled, billing is not set up, or your backend does not have the correct permissions.

**This is the most common error when using AI features for the first time.** Follow these steps carefully to resolve it.

---

### Step 1: Ensure Billing is Enabled for Your Project

AI services require a Google Cloud project with an active billing account.

1.  Go to the [Google Cloud Billing page](https://console.cloud.google.com/billing?project=ecosystem-hub).
2.  Check if your project (`ecosystem-hub`) is linked to a billing account.
3.  If you see "This project is not associated with a billing account," you **must** link one. Click "Link a billing account" and follow the prompts. You may need to create a new billing account if you don't have one.

**You will not be able to use the AI features until billing is enabled.**

---

### Step 2: Grant Permissions to the Backend Service Account

Your application's backend code runs with a special identity called a service account. You must grant this account permission to use the AI services.

1.  Go to the **IAM & Admin** page in the Google Cloud Console:
    **[https://console.cloud.google.com/iam-admin/iam?project=ecosystem-hub](https://console.cloud.google.com/iam-admin/iam?project=ecosystem-hub)**

2.  Find the principal (member) named **"Compute Engine default service account"**. Its email address will look like `[your-project-number]-compute@developer.gserviceaccount.com`.

3.  Click the **pencil icon** (Edit principal) on that row.

4.  Click **"+ ADD ANOTHER ROLE"**.

5.  In the "Select a role" dropdown, search for and select **"Vertex AI User"**. This role provides the necessary permissions to use the Generative AI models.

6.  Click **Save**.

---

### Step 3: Enable the "Generative Language API"

Once billing is confirmed and permissions are granted, you need to enable the specific API for Gemini.

1.  Go to the API Library page for the Generative Language API using this direct link:
    **[https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ecosystem-hub](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ecosystem-hub)**

2.  Click the blue **"Enable"** button. If it says "Manage", the API is already enabled, and you can proceed.

---

### Step 4: Wait and Retry

After enabling the API and granting permissions, please wait **at least 2-3 minutes** for the changes to take effect across all of Google's systems.

Then, try using the AI feature in your application again. The "403 Forbidden" error should now be resolved.
