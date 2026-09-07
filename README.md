# ndawg2478.github.io

Link-in-bio hub + production services portfolio for @ndawg2478. Static HTML/CSS/vanilla JS, built for GitHub Pages, with a browser-based admin panel for editing content.

## File structure

```
.
├── index.html            # Social hub (page 1)
├── portfolio.html        # Production services (page 2)
├── admin.html            # Admin portal — edit links, services, logos
├── admin.js              # Admin portal logic
├── admin.css             # Admin portal styles
├── styles.css            # Shared variables + base styles
├── index.css             # Styles specific to index.html
├── portfolio.css         # Styles specific to portfolio.html
├── CNAME                 # Custom domain placeholder
├── data/
│   └── site-data.json    # All editable content: profile, social links, services
├── js/
│   ├── site-data.js      # Fetches site-data.json and renders it into the pages
│   └── icons.js          # Local inline icon set (no external icon-font CDN)
├── assets/
│   ├── banner.jpg        # Sunset mountain-lake banner
│   └── profile.png       # Low-poly Saint Bernard logo
└── README.md
```

## How content works now

`index.html` and `portfolio.html` no longer hardcode your links or services — they fetch `data/site-data.json` at load time and render it. That JSON is what `admin.html` edits.

**⚠️ Important: this is a static site (GitHub Pages), not a backend.** There's no server or database, so:

- **"Save draft"** in the admin panel stores your edits in that browser's `localStorage` only. It lets you click "Preview site" and see changes immediately, but nobody else sees them, and clearing browser data wipes the draft.
- **"Export site-data.json"** downloads the edited file. To actually publish changes, replace `/data/site-data.json` in your GitHub repo with the downloaded file and commit — GitHub Pages redeploys automatically within a minute or two.

If you outgrow this and want true live editing without a manual export/commit step, that requires an actual backend (e.g. a small serverless function + database, or a headless CMS like Netlify CMS/Decap) — happy to help set that up if you want to go that route later.

### Admin password

`admin.html` is gated by a password set in `admin.js` (`ADMIN_PASSWORD`, currently `changeme`). **Change this before publishing.** This is a basic deterrent only, not real security — anyone who views the page source can read the password — so also avoid linking to `/admin.html` from anywhere public.

### Testing locally

Because the pages `fetch()` the JSON file, opening `index.html` directly from disk (`file://`) will fail silently due to browser restrictions. Run a quick local server from the project folder instead:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html`, `/portfolio.html`, and `/admin.html`.

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

5. **Change the admin password.** Before pushing, open `admin.js` and change `ADMIN_PASSWORD = 'changeme'` to something real. It's only a casual deterrent (see the warning at the top of that file), but there's no reason to ship the default.

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
- Social logos for Twitch, YouTube, TikTok, X, and Instagram are bundled as official SVGs in `assets/icons/` (sourced from Simple Icons, CC0-licensed) so they render reliably without depending on an icon-font CDN. X and TikTok are rendered in white (both are officially monochrome black/white marks) so they stay visible against the dark pill background; the rest keep their real brand colors. Add a logo for any other platform (Discord, Kick, Blerp, etc.) by dropping a file into `assets/icons/` and typing its path into the admin panel.
- All other icons site-wide (service icons, buttons, admin UI) are inlined directly from Lucide (ISC-licensed) via `js/icons.js` — nothing on the public pages or the admin panel depends on an external icon-font CDN anymore. This was previously Font Awesome loaded from cdnjs, which meant every icon rendered as a blank box in any environment that blocks third-party requests. Service icons are chosen by a short key (`monitor`, `bot`, `shirt`, `scissors`, `video`, `presentation`, `briefcase`, `star`) typed into the admin panel's Icon field for each service — see `js/icons.js` for the full set, or add more there following the same pattern.
- Update the `mailto:` address in the admin panel's Contact section, and your real social URLs, before publishing.
- Colors and fonts are controlled via CSS variables at the top of `styles.css` — adjust there to retheme the whole site.
- Logo/banner uploads in the admin panel embed the image directly into `site-data.json` as base64. That's simplest for a fully client-side workflow, but makes the JSON file bigger — for a leaner repo, you can instead type a path like `assets/yourfile.jpg` into the image field and commit the actual file to `/assets/` yourself.

