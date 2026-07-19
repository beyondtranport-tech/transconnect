
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
git commit -m "Forensic V6: Refined engagement content with proper bold rendering and Free Registration mandate"
```

### Step 3: Push Your Backup to GitHub
This uploads your saved changes to your remote repository.
```bash
git push
```

*Note: If prompted for credentials, follow the guide in `docs/git-auth-troubleshooting.md` to use a GitHub Personal Access Token (PAT).*

---

## Recent Updates: Forensic V6
- **Proper HTML Rendering**: Converted intro text to JSX to ensure `<strong>` tags correctly bold the company name instead of showing as literal text.
- **"Free Registration" Mandate**: Overhauled all outreach sequences to emphasize zero-cost activation.
- **Channel Personalization**: Implemented dynamic value propositions for Suppliers vs Transporters vs Partners.

## Forensic V5 (Definitive Build)
- **Definitive Build Stabilization**: Resolved all JSX token mismatches, missing component imports, and Promise logic errors.
- **Authorized Public Handshake**: Hardened Firestore security rules to allow `get` access for unauthenticated recipients.
- **Exhaustive Contact Resolver**: Optimized the engagement wizard to scan 15 potential data nodes for emails and phone numbers.
