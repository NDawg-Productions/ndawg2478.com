/* ==========================================================================
   site-data.js
   Fetches site-data.json and renders dynamic content on index.html and
   portfolio.html. If a draft saved by admin.html exists in localStorage,
   that draft is used instead so changes can be previewed before publishing.
   ========================================================================== */

const SITE_DATA_DRAFT_KEY = 'ndawgSiteDataDraft';
const SITE_DATA_PATH = 'data/site-data.json';

/* Some sandboxed/preview environments throw on any localStorage access
   rather than failing quietly. Guard it so a draft-lookup failure can't
   take down the whole page render. */
function safeGetLocalStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

async function loadSiteData() {
  if (window.__PREVIEW_DATA__) {
    return { data: window.__PREVIEW_DATA__, isDraft: false };
  }
  const draft = safeGetLocalStorage(SITE_DATA_DRAFT_KEY);
  if (draft) {
    try {
      return { data: JSON.parse(draft), isDraft: true };
    } catch (e) {
      console.warn('Could not parse draft site data, falling back to published data.json', e);
    }
  }
  const res = await fetch(SITE_DATA_PATH);
  if (!res.ok) throw new Error('Failed to load ' + SITE_DATA_PATH);
  return { data: await res.json(), isDraft: false };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function showDraftBanner() {
  const banner = document.createElement('div');
  banner.textContent = 'Previewing unpublished admin draft — changes are only visible in this browser until exported and committed.';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#8a6bb1;color:#14100c;' +
    'font-family:Montserrat,sans-serif;font-size:0.78rem;font-weight:600;text-align:center;' +
    'padding:10px 14px;z-index:9999;letter-spacing:0.02em;';
  document.body.appendChild(banner);
}

/* ---------------- index.html (hub) ---------------- */

function renderHub(data) {
  const p = data.profile;

  const bannerImg = document.querySelector('[data-role="banner-image"]');
  if (bannerImg && p) bannerImg.src = p.bannerImage;

  const profileImg = document.querySelector('[data-role="profile-image"]');
  if (profileImg && p) profileImg.src = p.profileImage;

  const handleEl = document.querySelector('[data-role="handle"]');
  if (handleEl && p) handleEl.textContent = p.handle;

  const taglineEl = document.querySelector('[data-role="tagline"]');
  if (taglineEl && p) taglineEl.textContent = p.tagline;

  const socialContainer = document.querySelector('[data-role="social-links"]');
  if (socialContainer && Array.isArray(data.socialLinks)) {
    socialContainer.innerHTML = data.socialLinks.map((link) => `
      <a class="btn btn-social" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
        <img class="social-icon" src="${escapeHtml(link.icon)}" alt="" aria-hidden="true"> ${escapeHtml(link.label)}
      </a>
    `).join('');
  }
}

/* ---------------- portfolio.html ---------------- */

function renderPortfolio(data) {
  const intro = data.portfolioIntro;
  if (intro) {
    const eyebrow = document.querySelector('[data-role="portfolio-eyebrow"]');
    const title = document.querySelector('[data-role="portfolio-title"]');
    const desc = document.querySelector('[data-role="portfolio-description"]');
    if (eyebrow) eyebrow.textContent = intro.eyebrow;
    if (title) title.textContent = intro.title;
    if (desc) desc.textContent = intro.description;
  }

  const container = document.querySelector('[data-role="service-categories"]');
  if (container && Array.isArray(data.serviceCategories)) {
    container.innerHTML = data.serviceCategories.map((cat) => `
      <section class="service-section" data-accent="${escapeHtml(cat.accent)}">
        <h2 class="section-title">${escapeHtml(cat.title)}</h2>
        <div class="service-grid" aria-label="${escapeHtml(cat.title)} offerings">
          ${(cat.services || []).map((svc) => `
            <article class="service-card">
              <div class="service-icon">${window.svgIcon(svc.icon)}</div>
              <h3>${escapeHtml(svc.title)}</h3>
              <p>${escapeHtml(svc.description)}</p>
              ${svc.link ? `<a class="service-link" href="${escapeHtml(svc.link)}" target="_blank" rel="noopener noreferrer">Learn more ${window.svgIcon('arrow-right')}</a>` : ''}
            </article>
          `).join('')}
        </div>
      </section>
    `).join('');
  }

  const contactBtn = document.querySelector('[data-role="contact-button"]');
  if (contactBtn && data.contact) {
    const subject = encodeURIComponent(data.contact.subject || '');
    contactBtn.href = `mailto:${data.contact.email}?subject=${subject}`;
  }
}

/* ---------------- init ---------------- */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data, isDraft } = await loadSiteData();
    if (document.body.classList.contains('hub')) renderHub(data);
    if (document.body.classList.contains('portfolio-page')) renderPortfolio(data);
    if (isDraft) showDraftBanner();
  } catch (err) {
    console.error('Site data failed to load:', err);
  }
});
