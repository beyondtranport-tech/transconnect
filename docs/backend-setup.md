# Connecting Your Backend to the Correct Firebase Project

If you are experiencing a "Bucket Not Found", "Permission Denied", or "Incorrect 'aud' (audience) claim" error, it is highly likely that your application's frontend and backend are configured for different Firebase projects.

This guide provides the definitive steps to generate the correct credentials (called a "service account key") for your project and configure your app to use them.

---

## Step 1: Go to the Service Account Page

1.  Open the Google Cloud Console's **Service Accounts** page. A general link is provided below.
    **[https://console.cloud.google.com/iam-admin/serviceaccounts](https://console.cloud.google.com/iam-admin/serviceaccounts)**

2.  **CRITICAL:** Before proceeding, you **MUST** ensure the correct Google Cloud project is selected at the top of the page. The project name should match the one you intend to use for your application (e.g., `ecosystem-hub`).

## Step 2: Find Your Admin Service Account

1.  On the list, find the service account with **"Firebase Admin SDK Administrator Service Agent"** in its name.
2.  The email address will look like `firebase-adminsdk-fbsvc@...`.
3.  Click on this service account email address to open its details page.

## Step 3: Create a New JSON Key

This is the most important step to fix authentication issues.

1.  Click on the **"KEYS"** tab at the top of the page.
2.  Click the **"ADD KEY"** button, then select **"Create new key"** from the dropdown menu.
3.  A dialog will appear. Make sure **JSON** is selected as the key type.
4.  Click the **"CREATE"** button.
5.  A JSON file will be automatically downloaded to your computer. It will have a name similar to `your-project-name-....json`. **This file contains your new, correct credential.**

## Step 4: Convert the Key to Base64

The contents of this JSON file need to be encoded into a single line of text.

1.  Open the downloaded JSON file in a simple text editor (like Notepad, TextEdit, or VS Code).
2.  Select and copy the **entire content** of the file (from the opening `{` to the closing `}`).
3.  Go to an online Base64 encoding tool, such as **[https://www.base64encode.net/](https://www.base64encode.net/)**.
4.  Paste the JSON content into the **top box** (the "Encode" section).
5.  Click the **"ENCODE"** button.
6.  A long string of text will be generated in the box below. Click the **"Copy to clipboard"** button. This is your encoded key.

## Step 5: Update Your `.env.local` File

1.  In your project's code, open the `.env.local` file located in the root directory.
2.  You will see a line that starts with `FIREBASE_ADMIN_SDK_CONFIG_B64=`.
3.  Delete everything after the `=` and paste the new encoded key you just copied. The line should look like this:

    ```
    FIREBASE_ADMIN_SDK_CONFIG_B64=PASTE_YOUR_NEW_ENCODED_KEY_HERE
    ```

4.  Save the `.env.local` file.

That's it! Your application's backend is now configured with the correct credentials. If the application's frontend was configured for a different project, this change, combined with a frontend configuration update, will resolve the mismatch.
