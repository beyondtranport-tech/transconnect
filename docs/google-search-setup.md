# Setting up Google Custom Search API for Lead Generation

To enable the AI Lead Agent and Enrichment tools to find real-world company data, you need to configure Google's Custom Search API correctly. This requires two values in your `.env` file: an **API Key** and a **Search Engine ID**.

---

## Step 1: Get Your Google Cloud API Key

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (`ecosystem-hub`) from the top navigation bar.
3.  In the navigation menu, go to **APIs & Services > Credentials**.
4.  Click **+ CREATE CREDENTIALS** at the top and select **API key**.
5.  Copy this key. This is your `GOOGLE_SEARCH_API_KEY`.

## Step 2: Enable the Custom Search API (CRITICAL)

The "403 Access Denied" error means this step was missed. You must explicitly turn on the search service for your project.

1.  Click this direct link to the **[Custom Search API Library Page](https://console.cloud.google.com/apis/library/customsearch.googleapis.com?project=ecosystem-hub)**.
2.  Click the blue **"ENABLE"** button. (If it says "Manage", it is already enabled).

## Step 3: Create / Verify Your Search Engine

1.  Go to the [Search Engine Control Panel](https://programmablesearchengine.google.com/controlpanel/all).
2.  Ensure you are logged into the account that owns the engine (`mkoton100@gmail.com`).
3.  If you see "Search Engine Not Found", it's a login mismatch. Try opening the link in an Incognito window.
4.  **Get the ID:** Copy the **Search engine ID** (e.g., `3457246c678064558`).
5.  **CRITICAL - Search the entire web:** In the "Basics" tab, ensure the **"Search the entire web"** toggle is turned **ON**.

## Step 4: Update Your .env File

Paste both values into your `.env` file. **Do not use quotes or spaces.**

```
GOOGLE_SEARCH_API_KEY=YOUR_API_KEY_HERE
CUSTOM_SEARCH_ENGINE_ID=3457246c678064558
```

## Step 5: Restart Your Server & Check Logs

After saving the `.env` file, you **MUST** stop your terminal (`Ctrl+C`) and run:
```bash
npm run dev
```

Look at the terminal output at the bottom of your screen. When you click the sparkle tool, the app will log:
`[GOOGLE SEARCH] Using CX ID: 3457...`
confirming it is using the correct configuration.
