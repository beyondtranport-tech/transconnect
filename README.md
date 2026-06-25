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
git commit -m "Global Architecture Synchronization: Applied high-capacity registry structure across all Marketing Library modules"
```

### Step 3: Push Your Backup to GitHub
This uploads your saved changes to your remote repository.
```bash
git push
```

*Note: If prompted for credentials, follow the guide in `docs/git-auth-troubleshooting.md` to use a GitHub Personal Access Token (PAT).*

---

## Recent Updates: Global Architecture Synchronization
- **Unified Registry Structure**: Applied the high-capacity architecture from the Supplier module to all other Marketing Library subdirectories (Partners, ISA, Transporters, Investors, Finance, Drivers).
- **Integrated Pre-Scan Filters**: Status, Outreach, and Assignee filters are now available on the initial scan screen for all modules.
- **Interactive Column Visibility**: Added a custom column toggle to all industrial tables, allowing selective data point visibility.
- **Full-Base Visibility (20k Records)**: All modules now retrieve the entire industrial record base in a single session for accurate pagination and filtering.
- **Restored Forensic Logic**: Re-implemented sortable outreach columns and strict Entity/Contact separation across the platform.

## Earlier Updates: Admin Portal Stabilization
- **Fixed Build Failures**: Resolved "Unexpected token div" and "Dialog" errors caused by malformed JSX closures.
- **Forensic Tracking**: Embedded hidden tracking pixels in all 6 core engagement templates for real-time monitoring.
- **Interactive Pagination**: Restored manual page-jump inputs and accurate result counts in the DataTable component.
