
# Setting up Google Custom Search API for Lead Generation

To enable the AI Lead Agent and Enrichment tools to find real-world company data, you need to configure Google's Custom Search API correctly. This requires two values in your `.env` file: an **API Key** and a **Search Engine ID**.

---

## CRITICAL: Why you might see "Search Engine Not Found"

If you see "Search Engine Not Found" in the Google Control Panel, it means you are logged into a different Google account in your browser than the one used to create that specific ID. 

**FIX:** Ensure you are logged into the account that owns the Search Engine. You can view all your available IDs at the [Search Engine Control Panel](https://programmablesearchengine.google.com/controlpanel/all).

---

## Step 1: Get Your Google Cloud API Key

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (`ecosystem-hub`) from the top navigation bar.
3.  In the navigation menu, go to **APIs & Services > Credentials**.
4.  Click **+ CREATE CREDENTIALS** at the top and select **API key**.
5.  Copy this key. This is your `GOOGLE_SEARCH_API_KEY`.

## Step 2: Enable the Custom Search API

1.  Go to the [API Library](https://console.cloud.google.com/apis/library/customsearch.googleapis.com?project=ecosystem-hub).
2.  Click **Enable**.

## Step 3: Create / Verify Your Search Engine

This is where most configuration errors happen. Follow these steps exactly:

1.  Go to the [Search Engine Control Panel](https://programmablesearchengine.google.com/controlpanel/all).
2.  If you don't see your engine, click **Add**.
3.  **Name it:** e.g., "Logistics Lead Finder".
4.  **Initial Site:** You must enter one. Use `www.google.com`. Click **Create**.
5.  **CRITICAL - Search the entire web:**
    *   Once created, go to the **Basics** tab of your new engine.
    *   Find the section **"Sites to search"**.
    *   Click **Add** and select **"Search the entire web"**.
    *   **DELETE** `www.google.com` from the list.
    *   Ensure the **"Search the entire web"** toggle is turned **ON**.
6.  **Get the ID:** Copy the **Search engine ID** (e.g., `3457246c678064558`).

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

The application will now log `[GOOGLE SEARCH] Using CX ID: 3457...` to your terminal window whenever you use the sparkle tool, confirming the setup is successful.
