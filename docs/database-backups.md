# Firestore Database Backups & Data Protection

Unlike your code, which is backed up to GitHub via `git push`, your Firestore database is a live cloud service. Protecting your 9,000+ records requires using Google Cloud's native backup and export tools.

---

## 1. Where to Check for Backups

You can manage and verify your data backups in the **Google Cloud Console** (not the Firebase Console).

### Scheduled Backups (Point-in-Time Recovery)
If you are on the **Blaze (Pay-as-you-go) plan**, you can enable automatic daily backups with a 7-day retention period.
*   **Go to:** [Firestore Backups Console](https://console.cloud.google.com/firestore/backups)
*   **Check:** Ensure a backup schedule is active for your `(default)` database.

### Manual Data Exports
Manual exports are snapshots of your data stored in a Google Cloud Storage bucket.
*   **Go to:** [Cloud Storage Browser](https://console.cloud.google.com/storage/browser)
*   **Look for:** A bucket named `ecosystem-hub-backups` or similar. If you've run an export recently, the files will be there.

---

## 2. How to Perform a Manual Backup

If you are about to perform a major data operation (like a bulk import or duplicate clean), follow these steps:

1.  Open the [Firestore Import/Export Tab](https://console.cloud.google.com/firestore/databases/-default-/import-export).
2.  Click **"EXPORT"**.
3.  Select a destination bucket (create one if needed, e.g., `gs://ecosystem-hub-backups`).
4.  Select the collections you want to protect (e.g., `partners`, `leads`, `companies`).
5.  Click **"EXPORT"**.

---

## 3. Best Practices for High-Volume Data

*   **Audit Logs:** The application is already configured to record every create, update, and delete action in the `auditLogs` collection. This provides a "Paper Trail" even if a backup hasn't been run.
*   **Capped Reads:** To prevent "Resource Exhausted" errors, the app now uses a **100-record hard cap** for initial views. Always use the **Search Bar** to find specific records rather than scrolling through the whole database.
*   **Duplicate Cleaning:** Always run the **Duplicate Cleaner** (available in the Finance and Investor modules) before a major export to ensure your backup is clean and high-yield.
