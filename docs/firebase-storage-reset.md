# How to Safely Reset Firebase Storage

If you are consistently seeing a "Bucket Not Found" error even after verifying all code and permissions, the underlying storage resource in Firebase may not have been provisioned correctly. A hard reset can fix this.

**WARNING:** This process involves deleting your storage bucket. Proceed only if you are sure you have no critical data in it. Since file uploads have been failing, it is likely empty.

---

## Step 1: Go to Firebase Storage

1.  Open the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (`ecosystem-hub`).
3.  In the left-hand navigation menu, under the **Build** section, click on **Storage**.

## Step 2: Verify and Delete the Bucket

1.  You should see a file browser. If there are any files you cannot afford to lose, download them now. **Since uploads have been failing, this is likely empty.**
2.  At the top of the file browser, click the three-dots menu (⋮) next to your bucket name (which looks like `ecosystem-hub.appspot.com`).
3.  From the dropdown, select **"Delete bucket"**.
4.  A confirmation dialog will appear. You will need to type your bucket's name exactly as shown to confirm the deletion. This is a safety measure.
5.  Click the final **"Delete"** button.

## Step 3: Re-create the Bucket

1.  After the deletion is complete, you will be returned to the main Storage page, and you should see a "Get started" button again. Click it.
2.  A dialog will appear to guide you through setting up security rules. It is critical to select **Production mode**. Click **Next**.
3.  You will be asked to choose a Cloud Storage location. **It is very important to select the same location you used previously.** The default selected for you is usually the correct one.
4.  Click **Done**.

It will take a minute or two for your new bucket to be created and provisioned.

## Step 4: Wait and Retry

Please wait at least **5 minutes** for all permissions and settings to propagate across Google's systems.

After waiting, please return to the application and try uploading an image again. This process should have cleared any underlying configuration errors.
