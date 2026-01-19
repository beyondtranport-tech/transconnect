# Setting up Google Custom Search API for Lead Generation

To enable the AI Lead Agent to find real-world company data, you need to configure Google's Custom Search API. This requires two things: an **API Key** and a **Programmable Search Engine ID**.

## Step 1: Get Your Google Cloud API Key

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (e.g., `transconnect-v1-39578841-2a857`) from the top navigation bar.
3.  In the navigation menu (hamburger icon), go to **APIs & Services > Credentials**.
4.  Click **+ CREATE CREDENTIALS** at the top and select **API key**.
5.  A new API key will be created. **Copy this key immediately** and save it somewhere safe, like a notepad. This is your `GOOGLE_SEARCH_API_KEY`.

## Step 2: Enable the Custom Search API

**This is a critical step.** The API must be enabled for your project before you can restrict your key to it.

1.  Go directly to the API Library for your project by clicking this link: **[https://console.cloud.google.com/apis/library?project=transconnect-v1-39578841-2a857](https://console.cloud.google.com/apis/library?project=transconnect-v1-39578841-2a857)**
2.  The page will have a search bar at the top. In this search bar, type "**Custom Search API**" and press Enter.
3.  Click on the "Custom Search API" result from the search.
4.  Click the **Enable** button. Wait for it to finish. If the button says "Manage", the API is already enabled, and you can proceed to the next step.

## Step 3: Restrict Your API Key

1.  Go back to **APIs & Services > Credentials**.
2.  Click on the name of the API key you created in Step 1 (e.g., "API key 3").
3.  Under "API restrictions", select "Restrict key".
4.  In the "Select APIs" dropdown, you should now be able to find and select "**Custom Search API**".
5.  Click **OK** and then **Save**.

## Step 4: Create a Programmable Search Engine

1.  Go to the [Programmable Search Engine control panel](https://programmablesearchengine.google.com/controlpanel/all).
2.  Click **Add** to create a new search engine.
3.  In the "What to search?" section, enter a valid website to search (e.g., `www.google.com`). This is just a starting point.
4.  Give your search engine a name (e.g., "TransConnect Lead Finder").
5.  Click **Create**.
6.  If you see a code snippet like `<script ... cx="YOUR_ID" ...>`, your **Search engine ID** is the value inside the `cx` quotes.
7.  If not, click **Customize** for your new search engine. Under the "Basics" tab, find and copy the **Search engine ID**.
8.  **Crucially**, in the same section, turn **ON** the "Search the entire web" option.
9.  Click **Save Changes**.

## Final Step: Update Your `.env` File

You now have both required values.
*   **Your `GOOGLE_SEARCH_API_KEY`**: The key you created in Step 1. If you didn't copy it, go back to the **APIs & Services > Credentials** page to find it.
*   **Your `CUSTOM_SEARCH_ENGINE_ID`**: The ID you copied in Step 4.

Paste both of these values into your `.env` file.

```
GOOGLE_SEARCH_API_KEY=YOUR_API_KEY_HERE
CUSTOM_SEARCH_ENGINE_ID=YOUR_SEARCH_ENGINE_ID_HERE
```
The AI Lead Agent will now be fully functional.
