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
git commit -m "Admin Portal Stabilization: Fixed build crashes and verified tracking"
```

### Step 3: Push Your Backup to GitHub
This uploads your saved changes to your remote repository.
```bash
git push
```

*Note: If prompted for credentials, follow the guide in `docs/git-auth-troubleshooting.md` to use a GitHub Personal Access Token (PAT).*

---

## Recent Updates: Admin Portal Stabilization
- **Fixed Build Failures**: Resolved "Unexpected token div" and "Dialog" errors caused by malformed JSX closures in the management modules.
- **Full-Base Visibility**: Re-engineered the registry to load up to 20,000 records, ensuring total visibility of all 5,400+ industrial entries.
- **Forensic Tracking**: Verified and embedded hidden tracking pixels in all 6 core engagement templates for real-time "Read" status monitoring.
- **Interactive Pagination**: Restored manual page-jump inputs and accurate result counts in the DataTable component.
