# Connecting Your Backend to the Correct Firebase Project

If you are experiencing a "Bucket Not Found" or "Permission Denied" error on the server even after confirming your bucket exists and IAM permissions are set, it is highly likely that your application's backend is accidentally using credentials from an old or different Firebase project.

This guide provides the definitive steps to generate the correct credentials (called a "service account key") for your project and configure your app to use them.

---

## Step 1: Go to the Service Account Page

1.  Use this direct link to open the **Service Accounts** page for your project in the Google Cloud Console:
    **[https://console.cloud.google.com/iam-admin/serviceaccounts?project=transconnect-v1-39578841-2a857](https://console.cloud.google.com/iam-admin/serviceaccounts?project=transconnect-v1-39578841-2a857)**

## Step 2: Find Your Admin Service Account

1.  On the list, find the service account with **"Firebase Admin SDK Administrator Service Agent"** in its name.
2.  The email address will look like `firebase-adminsdk-fbsvc@...`.
3.  Click on this service account email address to open its details page.

## Step 3: Create a New JSON Key

1.  Click on the **"KEYS"** tab at the top of the page.
2.  Click the **"ADD KEY"** button, then select **"Create new key"** from the dropdown menu.
3.  A dialog will appear. Make sure **JSON** is selected as the key type.
4.  Click the **"CREATE"** button.
5.  A JSON file will be automatically downloaded to your computer. It will have a name similar to `transconnect-v1-....json`. **This file contains your new, correct credential.**

## Step 4: Convert the Key to Base64

The contents of this JSON file need to be encoded into a single line of text.

1.  Open the downloaded JSON file in a simple text editor (like Notepad, TextEdit, or VS Code).
2.  Select and copy the **entire content** of the file (from the opening `{` to the closing `}`).
3.  Go to an online Base64 encoding tool, such as **[https://www.base64encode.net/](https://www.base64encode.net/)**.
4.  Paste the JSON content into the **top box** (the "Encode" section).
5.  Click the **"ENCODE"** button.
6.  A long string of text will be generated in the box below. Click the **"Copy to clipboard"** button. This is your encoded key.

## Step 5: Update Your `.env` File

1.  In your project's code, open the `.env` file located in the root directory.
2.  You will see a line that starts with `FIREBASE_ADMIN_SDK_CONFIG_B64=`.
3.  Delete everything after the `=` and paste the new encoded key you just copied. The line should look like this:

    ```
    FIREBASE_ADMIN_SDK_CONFIG_B64=PASTE_YOUR_NEW_ENCODED_KEY_HERE
    ```

4.  Save the `.env` file.

That's it! Your application's backend is now configured with the correct credentials and will be able to find your Storage bucket. The upload functionality will now work correctly.
