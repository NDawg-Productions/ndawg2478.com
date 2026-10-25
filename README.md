# ndawg2478.github.io

Creator site for @ndawg2478, with professional services on `portfolio.html`. Static HTML/CSS/vanilla JS, built for GitHub Pages. Edit `data/site-data.json` and commit to publish.

## File structure

```
.
├── index.html            # Home: creator profile, TikTok and Instagram, contact
├── portfolio.html        # Professional services (kept at this URL)
├── styles.css            # All styles
├── CNAME                 # Custom domain
├── data/
│   └── site-data.json    # All editable content
├── js/
│   ├── site-data.js      # Fetches site-data.json and renders the pages
│   └── icons.js          # Local inline icon set (no external icon-font CDN)
├── assets/
│   ├── banner.jpg        # Sunset mountain-lake banner
│   ├── profile.webp      # Low-poly Saint Bernard logo
│   ├── favicon.png
│   ├── apple-touch.png
│   └── icons/            # Social marks, plus the unused merch logo
└── README.md
```

## How content works now

`index.html` and `portfolio.html` load `data/site-data.json` and render it. That file is the only copy to edit. Empty fields under `optional` (bio, testimonials, client logos, featured work) stay off the page until they are filled.

The homepage shows TikTok and Instagram as cards styled with the site, using the accounts in `socialLinks`. `feeds.tiktok` and `feeds.instagram` add specific videos and posts. Each one is a play tile that loads that network's player only after a click. Leave those lists empty until the URLs are real:

- TikTok video: `https://www.tiktok.com/@ndawg2478/video/VIDEO_ID`
- Instagram reel: `https://www.instagram.com/reel/SHORTCODE/`
- Instagram post: `https://www.instagram.com/p/SHORTCODE/`

The in-browser admin panel has been removed. Its password is still in older git commits and should be treated as exposed — change anything that password was reused for. Do not put a new password in this repository.

**This is a static site (GitHub Pages).** Commit the JSON (and any new image files) and Pages will redeploy within a minute or two.

### Testing locally

Because the pages `fetch()` the JSON file, opening `index.html` directly from disk (`file://`) will fail silently due to browser restrictions. Run a quick local server from the project folder instead:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html` and `/portfolio.html`.

## Deploying to GitHub Pages

1. **Create the repo.** On GitHub, create a new **public** repository named exactly `USERNAME.github.io` (replace `USERNAME` with your GitHub username — this exact name is what makes GitHub serve it as a user site).

2. **Initialize and push from this folder:**

   ```bash
   cd path/to/this/folder
   git init
   git add .
   git commit -m "Initial commit: creator hub + production portfolio"
   git branch -M main
   git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
   git push -u origin main
   ```

3. **Enable Pages.** In the repo, go to **Settings → Pages**. Under "Build and deployment," set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.

4. **Visit your site.** After a minute or two, it will be live at `https://USERNAME.github.io`.

## Custom domain — connecting ndawg2478.com to GitHub Pages

The `CNAME` file in this repo is already set to `ndawg2478.com`. To actually make that domain point at your site:

1. **At your domain registrar** (wherever you bought `ndawg2478.com`), open its DNS settings and add:
   - Four **A records** for the apex domain (`@` or blank host), pointing to GitHub Pages' IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - One **CNAME record** for `www`, pointing to `USERNAME.github.io`.
   (If you'd rather use a subdomain like `links.ndawg2478.com` instead of the apex domain, skip the A records and just add a CNAME for that subdomain pointing to `USERNAME.github.io` — then change the `CNAME` file's contents to match.)

2. **Back in the repo**, go to **Settings → Pages → Custom domain**, enter `ndawg2478.com`, and save. GitHub will verify the DNS and can auto-provision HTTPS once it propagates (can take anywhere from a few minutes to 24 hours). Once the padlock option appears, check **Enforce HTTPS**.

3. **Verify** by visiting `https://ndawg2478.com` once DNS has propagated (`dig ndawg2478.com` or `https://dnschecker.org` can confirm propagation status if it's not resolving yet).

## Setting up git.ndawg2478.com so your repos push through your own domain

This is a fun one — a couple of things worth knowing before setting it up:

- This only works cleanly over **SSH**, not HTTPS. Git-over-HTTPS relies on TLS, which validates the domain against GitHub's certificate — `git.ndawg2478.com` will never match GitHub's cert, so HTTPS pushes to a custom domain would fail (or require you to run your own reverse-proxy server with its own cert, which is a much bigger project than this). SSH doesn't do that kind of hostname validation, so it works with just a DNS record.
- GitHub's SSH server authenticates by your **SSH key**, not by which hostname you connected through — so once DNS points your subdomain at GitHub, connections "just work" the same as connecting to `github.com` directly.

**Step 1 — Add the DNS record** (same registrar/DNS panel as above):
```
Type: CNAME
Host: git
Value: github.com
```

**Step 2 — Make sure you have an SSH key set up with GitHub.** Skip this if you already push over SSH today:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
```
Copy that output into **GitHub → Settings → SSH and GPG keys → New SSH key**.

**Step 3 — Make every repo use your custom domain automatically.** Rather than editing each repo's remote by hand, this one git config rewrites any `git@github.com:` URL to go through your domain instead, globally, for every repo on the machine:
```bash
git config --global url."git@git.ndawg2478.com:".insteadOf "git@github.com:"
```
From now on, `git clone git@github.com:USERNAME/anything.git` (or any existing remote already set to that form) transparently connects via `git.ndawg2478.com` instead — no per-repo changes needed.

**Step 4 — Test it:**
```bash
ssh -T git@git.ndawg2478.com
```
First connection will show a host-key confirmation prompt (normal — you're seeing GitHub's real host key, just via the new hostname) — type `yes`. You should then see:
```
Hi USERNAME! You've successfully authenticated, but GitHub does not provide shell access.
```
That confirms it's live. Any `git push` / `git pull` / `git clone` using a `github.com` SSH remote will now route through `git.ndawg2478.com` on this machine.

If you want this to apply on other machines too, repeat Step 3 there (it's a local git config, not something GitHub or DNS stores for you) — Steps 1 and 2 only need doing once each.

## Notes

- The banner is a static image rather than the original source video: a raw 4K/50-second clip is far too large for a lightweight static repo (and exceeds GitHub's per-file size limits), so a high-resolution frame was extracted instead to keep the page fast-loading.
- Social logos for Twitch, YouTube, TikTok, X, and Instagram are bundled as official SVGs in `assets/icons/` (sourced from Simple Icons, CC0-licensed). Add another platform by dropping a file into `assets/icons/` and setting its path on a `socialLinks` entry in `data/site-data.json`. An icon value with no slash (such as `shirt`) uses the inline set in `js/icons.js`.
- Service icons use the same short keys (`monitor`, `bot`, `shirt`, `scissors`, `video`, `presentation`, `briefcase`, `star`).
- Colors are the variables at the top of `styles.css`. Headings use Fraunces; body text uses the system font.
- Image fields should be paths like `assets/banner.jpg`. Commit the file next to the JSON. Do not paste base64 into the data file.

