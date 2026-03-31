# How to Fix AI Feature "403 Forbidden" Errors

If you are seeing a "403 Forbidden" or "API is blocked" error when using AI features, it means your `GEMINI_API_KEY` is missing, incorrect, or the API it uses is not enabled in your Google Cloud project.

**This is the most common error when using AI features for the first time.** Follow these steps carefully to resolve it.

---

### Step 1: Get Your Gemini API Key

1.  Visit the **[Google AI Studio](https://makersuite.google.com/app/apikey)**.
2.  You may be prompted to log in with your Google account and agree to the terms of service.
3.  Click the "**Create API key**" button.
4.  A new API key will be generated for you. **Copy this key immediately** and save it. This is your `GEMINI_API_KEY`.

### Step 2: Add the Key to Your `.env` File

1.  In the root directory of your project, find or create a file named `.env`.
2.  Add the following line, pasting the key you just copied:

    ```
    GEMINI_API_KEY=PASTE_YOUR_API_KEY_HERE
    ```

### Step 3: Enable the "Generative Language API"

This API must be enabled for your key to work.

1.  Go to the API Library page for the Generative Language API using this direct link:
    **[https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ecosystem-hub](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ecosystem-hub)**

2.  Click the blue **"Enable"** button. If it says "Manage", the API is already enabled.

---

### Step 4: Restart Your Application

After saving the `.env` file, you must **restart your application** for the changes to take effect. If you are running `npm run dev`, stop the server (Ctrl+C) and run it again.

This process will resolve the "403 Forbidden" errors.
