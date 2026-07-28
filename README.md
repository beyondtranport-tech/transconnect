
# Logistics Flow

This is the stabilized version of the Logistics Flow application, featuring the industrial registry, automated AI discovery, and the forensic engagement engine.

---

## Maintenance & Backups

To save your current work and push your changes to GitHub, run the following sequence in your terminal:

### Step 1: Stage All Your Changes
This command adds all new and modified files to be included in your backup.
```bash
git add .
```

### Step 2: Save Your Changes
Commit your changes with a descriptive message.
```bash
git commit -m "Manual Backup: [Description of your changes]"
```

### Step 3: Push Your Backup to GitHub
This uploads your saved changes to your remote repository.
```bash
git push
```

---

## Restoring Latest Code (Syncing with GitHub)

If your environment is out of sync or you want to fetch the latest code pushed to the repository, use these commands:

### Update Existing Project
```bash
git pull
npm install
```

### Restore Into a Fresh Project
If you have created a new blank project and want to clone your code into it:
1. Copy your GitHub Repository URL.
2. Run: `git clone [YOUR_REPO_URL] .` (Note the dot at the end).
3. Run: `npm install`

---

## Recent Updates: Forensic V13 (The Performance Bridge) - PUBLISHED
- **Automated Engagement Engine**: Implemented the "Auto-Pilot" dispatch hub and SendGrid webhook listener for forensic bounce tracking.
- **UI Stability Fixes**: Resolved critical ReferenceErrors and missing component imports in the Admin layout and Engagement Pipeline.
- **Production Build Resolution**: Fixed JSX token errors and TypeScript implicit `any` types in the table components to ensure a clean Next.js production build.
- **504 Timeout Resolution**: Enforced 500-record query limits and prioritized `updatedAt` sorting in the Admin API to ensure high-velocity responses on datasets with 9,000+ records.
- **V13 Forensic Protocol**: Upgraded the AI Scavenger to V13, introducing iterative acronym expansion (e.g., JH -> Junior H) and sectional "Contact Card" mining for single-page industrial websites.
- **CRM Stakeholder Restoration**: Restored the CEO and Marketing/Sales Manager fields to the Supplier and Transporter management modals for complete forensic oversight.
- **Logging Optimization**: Optimized the "Log & Copy" partner fetch to use a targeted 100-record subset, preventing session timeouts during engagement.

## Forensic V8 - V12
- **Dividend Rewards Terminal**: Implemented Bronze, Silver, and Gold reward configurations.
- **Inductive Reconstruction**: Moved AI logic from "evidence-only" to fragment-stitching across multiple sources.
- **Node Ownership Workflow**: Implemented R10/mo node claiming and community vouching.
