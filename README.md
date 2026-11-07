# Your academic website (GitHub Pages)

Five pages (Home, Publications, Group, Bio, Courses) plus News and Opportunities blocks.
All content lives in one file, `data/site.json`. You edit it through `admin.html`, never by hand.

## One-time setup (about 10 minutes)

1. Create a free account at github.com.
2. Create a **public** repository named `YOURUSERNAME.github.io`.
3. Upload every file and folder from this zip into the repository (Add file → Upload files). Keep the folder structure (`data/`, `assets/`).
4. Repository → Settings → Pages → Source: "Deploy from a branch", Branch: `main`, folder `/ (root)` → Save.
5. After about a minute your site is live at `https://YOURUSERNAME.github.io`.

## Making editing one click (one-time)

1. GitHub → your profile photo → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Repository access: **Only select repositories** → choose `YOURUSERNAME.github.io`.
3. Permissions → Repository permissions → **Contents: Read and write**. Generate and copy the token.
4. Open `https://YOURUSERNAME.github.io/admin.html` → Publish tab → enter `YOURUSERNAME/YOURUSERNAME.github.io`, branch `main`, and the token. Press Test connection.

## Updating the site

Open `/admin.html`, change anything (profile, news, publications, students, courses, opportunities), then press **Publish to GitHub**. The live site refreshes in about a minute.
Upload your CV and photo from the Files tab. They are saved to `assets/` and linked automatically.

## Good to know

- The token stays in your browser only. It is saved on the device only if you tick "Remember". Never share it.
- Unpublished edits are kept as a draft in your browser, so a closed tab does not lose them.
- "Download site.json" gives you a backup you can also upload to the `data/` folder by hand.
- Publications with status "under review" or "in preparation" appear in their own section. Others are grouped by year, newest first. Your name (set as "Name as it appears in author lists") is shown in bold.
- To preview on your own computer, run `python3 -m http.server` in this folder and open http://localhost:8000. Opening the files by double-click will not work.
- Replace the sample content (placeholder email, links, sample papers) before sharing the address.

---

## New: edit directly on the page

Open `admin.html` once in your browser (it remembers you). After that, an **"✎ Edit this page"** button appears at the bottom right of every page, **only in your browser** (visitors never see it). It opens the editor in a side panel on the right, on the right tab for that page, and every change shows on the page instantly. Press **Publish to GitHub** in the panel to save.
To remove the button on a shared computer: Publish tab → "Hide the Edit button and forget my token".

## New: automatic publications (weekly)

A GitHub Action (`.github/workflows/sync-publications.yml`) runs every Monday and adds new papers to your Publications page. It never changes or removes papers you already have, and a paper you delete never comes back.

**Recommended: ORCID (free, no key)**
1. Create a free ORCID iD at orcid.org and add your papers (Works → Add works → Search & link, or paste a BibTeX file exported from Google Scholar).
2. In the editor: Profile tab → "ORCID iD" → paste it (like 0000-0002-1825-0097) → Publish.
3. Done. To run it immediately: Publications tab → "Sync publications now", or GitHub → Actions → "Sync publications" → Run workflow.

**Optional: Google Scholar directly.** Google Scholar has no official API and blocks scripts, so it needs a paid-or-free-tier go-between called SerpAPI (free plan: 100 searches a month, one search per weekly run).
1. Get a key at serpapi.com.
2. GitHub repo → Settings → Secrets and variables → Actions → New repository secret → name `SERPAPI_KEY`, paste the key.
3. In the editor: Profile tab → "Google Scholar ID" (the `user=XXXX` part of your Scholar link) → Publish.

### Upload the new files
Add these to your repository, keeping the folders: `edit.js`, `scripts/sync_publications.py`, and `.github/workflows/sync-publications.yml`. Also replace `admin.js`, `admin.html`, `site.js`, the five page `.html` files, and `data/site.json` ONLY if you have not added your own content yet (otherwise keep your current `data/site.json`).
If your browser will not drag in the hidden `.github` folder, use Add file → Create new file in GitHub, type `.github/workflows/sync-publications.yml` as the name, and paste the file's text.

### Token permissions
For the "Sync now" button, edit your token (Settings → Developer settings → Fine-grained tokens) and add **Actions: Read and write**. The weekly automatic run needs nothing extra.
