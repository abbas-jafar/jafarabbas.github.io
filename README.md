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
