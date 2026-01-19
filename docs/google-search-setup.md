# Setting up Google Custom Search API for Lead Generation

To enable the AI Lead Agent to find real-world company data, you need to configure Google's Custom Search JSON API. This requires two things: an **API Key** and a **Programmable Search Engine ID**.

## Step 1: Get Your Google Cloud API Key

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (e.g., `transconnect-v1-39578841-2a857`) from the top navigation bar.
3.  In the navigation menu (hamburger icon), go to **APIs & Services > Credentials**.
4.  Click **+ CREATE CREDENTIALS** at the top and select **API key**.
5.  A new API key will be created. Copy this key.

## Step 2: Enable the Custom Search API

**This is a critical step.** The API must be enabled for your project before you can restrict your key to it.

1.  Go directly to the API Library for your project by clicking this link: **[https://console.cloud.google.com/apis/library?project=transconnect-v1-39578841-2a857](https://console.cloud.google.com/apis/library?project=transconnect-v1-39578841-2a857)**
2.  The page will have a search bar at the top. In this search bar, type "**Custom Search JSON API**" and press Enter.
3.  Click on the "Custom Search JSON API" result from the search.
4.  Click the **Enable** button. Wait for it to finish. If the button says "Manage", the API is already enabled, and you can proceed to the next step.

## Step 3: Restrict Your API Key

1.  Go back to **APIs & Services > Credentials**.
2.  Click on the name of the API key you just created.
3.  Under "API restrictions", select "Restrict key".
4.  In the "Select APIs" dropdown, you should now be able to find and select "**Custom Search JSON API**".
5.  Click **OK** and then **Save**.
6.  Paste your copied API key into your `.env` file as the value for `GOOGLE_SEARCH_API_KEY`.


## Step 4: Create a Programmable Search Engine

1.  Go to the [Programmable Search Engine control panel](https://programmablesearchengine.google.com/controlpanel/all).
2.  Click **Add** to create a new search engine.
3.  In the "What to search?" section, enter a valid website to search (e.g., `www.google.com`). This is just a starting point and doesn't limit your searches.
4.  Give your search engine a name (e.g., "TransConnect Lead Finder").
5.  Click **Create**.
6.  Once created, click on **Customize**.
7.  Under the "Basics" tab, you will find the **Search engine ID**. Copy this ID.
8.  In the same section, make sure to turn **ON** the "Search the entire web" option. This is crucial for the tool to work correctly.
9.  Click **Save Changes** if you made any.
10. Paste the Search Engine ID into your `.env` file as the value for `CUSTOM_SEARCH_ENGINE_ID`.

Once both values are in your `.env` file, the AI Lead Agent will be fully functional and able to search for real companies.
