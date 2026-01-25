# Enabling Firebase Storage

The application uses Firebase Storage to save and manage user-uploaded assets like shop images, product photos, and AI-generated content. For the upload functionality to work, you must first enable the Storage service in your Firebase project.

The error "The specified bucket does not exist" is a strong indicator that this step has not been completed.

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

Once this process is complete, the file upload functionality within your application should work correctly. You do not need to make any further configuration changes.
