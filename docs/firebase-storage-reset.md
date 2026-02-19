# How to Safely Reset Firebase Storage

If you are consistently seeing a "Bucket Not Found" error even after verifying all code and permissions, the underlying storage resource in Firebase may not have been provisioned correctly. A hard reset can fix this.

**WARNING:** This process involves deleting your storage bucket. Proceed only if you are sure you have no critical data in it. Since file uploads have been failing, it is likely empty.

---

## Step 1: Go to Firebase Storage

1.  Open the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (`ecosystem-hub`).
3.  In the left-hand navigation menu, under the **Build** section, click on **Storage**.

## Step 2: Verify and Delete the Bucket

1.  You should see a file browser. If there are any files you cannot afford to lose, download them now.
2.  At the top of the file browser, click the three-dots menu (⋮) next to your bucket name (which looks like `ecosystem-hub.appspot.com`).
3.  From the dropdown, select **"Delete bucket"**.
4.  A confirmation dialog will appear. You will need to type your bucket's name exactly as shown to confirm the deletion. This is a safety measure.
5.  Click the final **"Delete"** button.

## Step 3: Re-create the Bucket

After deletion, the Firebase Console should prompt you to "Get started" with creating a new bucket.

### **Primary Method (Firebase Console)**

1.  On the main Storage page, you should see a "Get started" button. Click it.
2.  A dialog will appear to guide you through setting up security rules. It is critical to select **Production mode**. Click **Next**.
3.  You will be asked to choose a Cloud Storage location. **It is very important to select the same location you used previously.** The default selected for you is usually the correct one.
4.  Click **Done**.

### **Alternative Method (If Firebase Console Fails)**

If clicking "Get started" in the Firebase Console does not work or brings you back to the same screen, use the Google Cloud Console directly:

1.  **Go to the Google Cloud Storage Browser:**
    **[https://console.cloud.google.com/storage/browser?project=ecosystem-hub](https://console.cloud.google.com/storage/browser?project=ecosystem-hub)**

2.  Click the **"CREATE BUCKET"** button at the top.

3.  **Name your bucket:** This is the most critical step. You **MUST** name your bucket exactly:
    `ecosystem-hub.appspot.com`

4.  **Choose where to store your data:** Select a "Region" for location type and choose a location (e.g., `us-central1`). Click **Continue**.

5.  **Choose a storage class:** You can leave the "Standard" default. Click **Continue**.

6.  **Choose how to control access:** Select "Uniform" and uncheck "Enforce public access prevention". Click **Create**.

7.  **IMPORTANT:** You will be prompted to confirm that the bucket will be public. Click **"CONFIRM"**. This is necessary for images to be viewable in your app. Your `storage.rules` file will still protect writes.

This creates the default bucket that Firebase expects.

## Step 4: Wait and Retry

After either method, please wait at least **5 minutes** for all permissions and settings to propagate across Google's systems.

After waiting, please return to the application and try uploading an image again. This process should have cleared any underlying configuration errors.
