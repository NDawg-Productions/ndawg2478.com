/* Renders both public pages from data/site-data.json. */

const SITE_DATA_PATH = 'data/site-data.json';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function accentOf(value) {
  return value === 'purple' ? 'purple' : 'sunset';
}

function slug(value) {
  const clean = String(value || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  return clean || 'section';
}

function mailto(email, subject) {
  const clean = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return '#contact';
  const query = subject ? '?subject=' + encodeURIComponent(subject) : '';
  return 'mailto:' + clean + query;
}

function safeHttp(url) {
  const value = String(url || '').trim();
  if (/^https?:\/\/\S+$/i.test(value)) return value;
  return '';
}

function safeAsset(path) {
  const value = String(path || '').trim();
  if (safeHttp(value)) return value;
  if (/^assets\/[a-zA-Z0-9._ /-]+$/.test(value) && !value.includes('..')) return value;
  return '';
}

function iconMarkup(icon) {
  const value = String(icon || '').trim();
  if (!value) return '';
  if (/[/.]/.test(value)) {
    return `<img class="mark" src="${escapeHtml(value)}" alt="" width="22" height="22">`;
  }
  if (window.UIIcons && window.UIIcons[value] && window.svgIcon) return window.svgIcon(value);
  return '';
}

function externalSuffix() {
  return '<span class="visually-hidden"> (opens in a new tab)</span>';
}

async function loadSiteData() {
  const res = await fetch(SITE_DATA_PATH);
  if (!res.ok) throw new Error('Failed to load ' + SITE_DATA_PATH);
  return res.json();
}

function socialById(data, id) {
  return (data.socialLinks || []).find((link) => link && link.id === id) || null;
}

function hostIs(url, name) {
  return new RegExp('(^|\\.)' + name + '\\.com$', 'i').test(url.hostname);
}

function tiktokHandle(data) {
  const link = socialById(data, 'tiktok');
  const href = safeHttp(link && link.url);
  if (!href) return '';
  try {
    const url = new URL(href);
    if (!hostIs(url, 'tiktok')) return '';
    const match = url.pathname.match(/^\/@([A-Za-z0-9._]+)/);
    return match ? match[1] : '';
  } catch (err) {
    return '';
  }
}

function instagramUser(data) {
  const link = socialById(data, 'instagram');
  const href = safeHttp(link && link.url);
  if (!href) return '';
  try {
    const url = new URL(href);
    if (!hostIs(url, 'instagram')) return '';
    const segment = (url.pathname.split('/').filter(Boolean)[0] || '');
    if (!segment || /^(p|reel|reels|stories|explore|accounts)$/i.test(segment)) return '';
    return /^[A-Za-z0-9._]+$/.test(segment) ? segment : '';
  } catch (err) {
    return '';
  }
}

function tiktokVideo(value) {
  const href = safeHttp(value);
  if (!href) return null;
  try {
    const url = new URL(href);
    if (!hostIs(url, 'tiktok')) return null;
    const match = url.pathname.match(/\/@([A-Za-z0-9._]+)\/video\/(\d{8,})/);
    if (!match) return null;
    return { handle: match[1], id: match[2] };
  } catch (err) {
    return null;
  }
}

function instagramPermalink(value) {
  const href = safeHttp(value);
  if (!href) return '';
  try {
    const url = new URL(href);
    if (!hostIs(url, 'instagram')) return '';
    const match = url.pathname.match(/^\/(p|reel|reels)\/([A-Za-z0-9_-]+)\/?/);
    if (!match) return '';
    const kind = match[1].toLowerCase() === 'reels' ? 'reel' : match[1].toLowerCase();
    return 'https://www.instagram.com/' + kind + '/' + match[2] + '/';
  } catch (err) {
    return '';
  }
}

function contactHref() {
  return document.getElementById('contact') ? '#contact' : 'portfolio.html#contact';
}

function renderHeader(data) {
  const el = document.querySelector('[data-role="header"]');
  if (!el) return;
  const page = document.body.dataset.page;
  const contact = data.contact || {};
  const platformsHref = page === 'home' ? '#platforms' : 'index.html#platforms';
  const servicesCta = page === 'services'
    ? `<a class="btn btn-primary btn-compact header-cta" href="${mailto(contact.email, contact.subject)}">Contact</a>`
    : '';
  const logo = safeAsset(data.profile && data.profile.logo);
  el.innerHTML = `
    <a class="brand" href="index.html">
      ${logo ? `<img src="${escapeHtml(logo)}" width="36" height="36" alt="">` : ''}
      <span>${escapeHtml((data.profile && data.profile.handle) || '')}</span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span class="nav-toggle-bars" aria-hidden="true"></span>
      <span class="nav-toggle-label">Menu</span>
    </button>
    <nav id="site-nav" class="nav-links" aria-label="Primary">
      <a href="portfolio.html"${page === 'services' ? ' aria-current="page"' : ''}>Professional Services</a>
      <a href="${platformsHref}">Platforms</a>
      <a href="${contactHref()}">Work with me</a>
    </nav>
    ${servicesCta}
  `;
  bindMenu(el);
}

function bindMenu(header) {
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('#site-nav');
  if (!toggle || !nav) return;
  const label = toggle.querySelector('.nav-toggle-label');
  const setOpen = (open) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (label) label.textContent = open ? 'Close' : 'Menu';
  };
  toggle.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (!header.classList.contains('is-open') || header.contains(event.target)) return;
    setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  const desktop = window.matchMedia('(min-width: 860px)');
  const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', closeOnDesktop);
}

function introMarkup(data) {
  const hero = data.hero || {};
  const contact = data.contact || {};
  const caps = (data.capabilities || []).map((item) => String(item || '').trim()).filter(Boolean);
  const capHtml = caps.length
    ? `<p class="capability-line">${caps.map((item) => `<span>${escapeHtml(item)}</span>`).join('<span class="dot" aria-hidden="true"></span>')}</p>`
    : '';
  return `
    <img class="hero-logo" src="${escapeHtml(data.profile.logo)}" width="72" height="72" alt="${escapeHtml(data.profile.logoAlt || '')}">
    ${hero.eyebrow ? `<p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>` : ''}
    <h1>${escapeHtml(hero.title || '')}</h1>
    ${hero.description ? `<p class="lede">${escapeHtml(hero.description)}</p>` : ''}
    ${capHtml}
    <div class="actions">
      <a class="btn btn-primary" href="${mailto(contact.email, contact.subject)}">${escapeHtml(contact.button || 'Contact')}</a>
      <a class="btn btn-secondary" href="#services">View services</a>
    </div>
  `;
}

function renderHero(data) {
  const copy = document.querySelector('[data-role="hero-copy"]');
  if (copy) copy.innerHTML = introMarkup(data);
  const intro = document.querySelector('[data-role="page-intro"]');
  if (intro) intro.innerHTML = introMarkup(data);
  document.querySelectorAll('[data-role="banner-image"]').forEach((banner) => {
    if (banner.dataset.decorative === 'true') return;
    const src = safeAsset(data.profile && data.profile.banner);
    if (src) banner.src = src;
    if (data.profile && data.profile.bannerAlt) banner.alt = data.profile.bannerAlt;
  });
}

function renderCreator(data) {
  const el = document.querySelector('[data-role="creator"]');
  if (!el) return;
  const profile = data.profile || {};
  const logo = safeAsset(profile.logo);
  const banner = document.querySelector('[data-decorative="true"]');
  if (banner) {
    const src = safeAsset(profile.banner);
    if (src) banner.src = src;
    banner.alt = '';
  }
  el.innerHTML = `
    ${logo ? `<img class="creator-logo" src="${escapeHtml(logo)}" width="84" height="84" alt="${escapeHtml(profile.logoAlt || '')}">` : ''}
    <div class="creator-id">
      <h1>${escapeHtml(profile.handle || '')}</h1>
      ${profile.tagline ? `<p class="lede">${escapeHtml(profile.tagline)}</p>` : ''}
    </div>
    <a class="mast-link" href="#contact">Work with me</a>
  `;
}

function profileEmbeds(data) {
  const cards = [];
  const tiktok = socialById(data, 'tiktok');
  const handle = tiktokHandle(data);
  if (handle) {
    const cite = 'https://www.tiktok.com/@' + handle;
    cards.push(`
      <figure class="embed-card">
        <figcaption>${escapeHtml((tiktok && tiktok.label) || 'TikTok')}</figcaption>
        <div class="embed-frame">
          <blockquote class="tiktok-embed" cite="${cite}" data-unique-id="${escapeHtml(handle)}" data-embed-type="creator">
            <section><a class="embed-fallback" target="_blank" rel="noopener noreferrer" href="${cite}?refer=creator_embed">${escapeHtml((tiktok && tiktok.label) || 'TikTok')}${externalSuffix()}</a></section>
          </blockquote>
        </div>
      </figure>
    `);
  }
  const instagram = socialById(data, 'instagram');
  const user = instagramUser(data);
  if (user) {
    const permalink = 'https://www.instagram.com/' + user + '/';
    cards.push(`
      <figure class="embed-card">
        <figcaption>${escapeHtml((instagram && instagram.label) || 'Instagram')}</figcaption>
        <div class="embed-frame">
          <blockquote class="instagram-media" data-instgrm-permalink="${permalink}" data-instgrm-version="14">
            <a class="embed-fallback" target="_blank" rel="noopener noreferrer" href="${permalink}">${escapeHtml((instagram && instagram.label) || 'Instagram')}${externalSuffix()}</a>
          </blockquote>
        </div>
      </figure>
    `);
  }
  return cards.join('');
}

function renderFeeds(data) {
  const el = document.querySelector('[data-role="feeds"]');
  if (!el) return;
  const cards = profileEmbeds(data);
  if (!cards) {
    el.hidden = true;
    return;
  }
  el.innerHTML = `
    <div class="wrap">
      <h2 class="visually-hidden">TikTok and Instagram</h2>
      <div class="embed-grid">${cards}</div>
    </div>
  `;
  activateEmbeds(el);
}

function featuredShorts(data) {
  const feeds = data.feeds || {};
  const items = [];
  const seen = new Set();
  (Array.isArray(feeds.tiktok) ? feeds.tiktok : []).forEach((entry) => {
    const video = tiktokVideo(entry);
    if (!video || seen.has('tt:' + video.id)) return;
    seen.add('tt:' + video.id);
    items.push({
      kind: 'tiktok',
      href: 'https://www.tiktok.com/@' + video.handle + '/video/' + video.id,
      player: 'https://www.tiktok.com/player/v1/' + video.id + '?autoplay=0'
    });
  });
  (Array.isArray(feeds.instagram) ? feeds.instagram : []).forEach((entry) => {
    const permalink = instagramPermalink(entry);
    if (!permalink || seen.has(permalink)) return;
    seen.add(permalink);
    items.push({ kind: 'instagram', href: permalink });
  });
  return items;
}

function renderShorts(data) {
  const el = document.querySelector('[data-role="shorts"]');
  if (!el) return;
  const items = featuredShorts(data);
  if (!items.length) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = `
    <div class="wrap">
      <h2 id="shorts-heading">Shorts</h2>
      <div class="short-row" tabindex="0" aria-labelledby="shorts-heading">
        ${items.map((item) => {
          if (item.kind === 'tiktok') {
            return `
              <article class="short-card">
                <iframe title="TikTok video" data-src="${escapeHtml(item.player)}" allow="fullscreen; encrypted-media; picture-in-picture" loading="lazy"></iframe>
                <a class="visually-hidden" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">TikTok${externalSuffix()}</a>
              </article>
            `;
          }
          return `
            <article class="short-card short-card-ig">
              <blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(item.href)}" data-instgrm-version="14">
                <a class="embed-fallback" target="_blank" rel="noopener noreferrer" href="${escapeHtml(item.href)}">Instagram${externalSuffix()}</a>
              </blockquote>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;
  activateEmbeds(el);
}

const embedScriptPromises = {};

function loadEmbedScript(src) {
  if (embedScriptPromises[src]) return embedScriptPromises[src];
  embedScriptPromises[src] = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
  return embedScriptPromises[src];
}

function whenVisible(target, fn) {
  if (!target) return;
  if (!('IntersectionObserver' in window)) {
    fn();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      fn();
    }
  }, { rootMargin: '200px' });
  observer.observe(target);
}

function activateEmbeds(root) {
  if (!root) return;
  whenVisible(root, () => {
    if (root.querySelector('.tiktok-embed')) loadEmbedScript('https://www.tiktok.com/embed.js');
    if (root.querySelector('.instagram-media')) {
      loadEmbedScript('https://www.instagram.com/embed.js').then(() => {
        if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
      });
    }
    root.querySelectorAll('iframe[data-src]').forEach((frame) => {
      whenVisible(frame, () => {
        if (!frame.getAttribute('src')) frame.setAttribute('src', frame.dataset.src);
      });
    });
  });
}

function renderHomeContact(data) {
  const el = document.querySelector('[data-role="home-contact"]');
  if (!el) return;
  const contact = data.contact || {};
  el.innerHTML = `
    <div class="wrap home-contact">
      <div>
        <h2 id="contact-heading" class="eyebrow">Work with me</h2>
        <a class="email-link" href="${mailto(contact.email, contact.subject)}">${escapeHtml(contact.email || '')}</a>
      </div>
      <div class="home-contact-side">
        ${contact.text ? `<p class="lede">${escapeHtml(contact.text)}</p>` : ''}
        <a class="text-link" href="portfolio.html">Professional Services ${window.svgIcon ? window.svgIcon('arrow-right') : ''}</a>
      </div>
    </div>
  `;
}

function renderServices(data) {
  const el = document.querySelector('[data-role="services"]');
  if (!el) return;
  const contact = data.contact || {};
  const caps = (data.capabilities || []).map((item) => String(item || '').trim()).filter(Boolean);
  const groups = (data.serviceCategories || []).map((cat) => {
    const accent = accentOf(cat.accent);
    const cards = (cat.services || []).map((svc) => {
      const subject = contact.subject ? contact.subject + ': ' + (svc.title || '') : (svc.title || '');
      const learn = safeHttp(svc.link);
      const learnHtml = learn
        ? `<a class="text-link" href="${escapeHtml(learn)}" target="_blank" rel="noopener noreferrer">Learn more ${window.svgIcon ? window.svgIcon('arrow-right') : ''}${externalSuffix()}</a>`
        : '';
      return `
        <article class="service-card" data-accent="${accent}">
          <div class="service-icon" aria-hidden="true">${iconMarkup(svc.icon)}</div>
          <h3>${escapeHtml(svc.title || '')}</h3>
          <p>${escapeHtml(svc.description || '')}</p>
          <div class="card-links">
            <a class="inquire" href="${mailto(contact.email, subject)}">Inquire ${window.svgIcon ? window.svgIcon('arrow-right') : ''}</a>
            ${learnHtml}
          </div>
        </article>
      `;
    }).join('');
    return `
      <div class="service-group" id="${slug(cat.id)}" data-accent="${accent}">
        <h2 class="category-title">${escapeHtml(cat.title || '')}</h2>
        <div class="service-grid">${cards}</div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="wrap">
      <div class="section-intro">
        <div>
          <p class="eyebrow">Services</p>
          ${caps.length ? `<p class="capability-line">${caps.map((item) => `<span>${escapeHtml(item)}</span>`).join('<span class="dot" aria-hidden="true"></span>')}</p>` : ''}
        </div>
        <a class="text-link" href="#contact">${escapeHtml(contact.button || 'Contact')}</a>
      </div>
      ${groups}
    </div>
  `;
}

function renderPlatforms(data) {
  const el = document.querySelector('[data-role="platforms"]');
  if (!el) return;
  const links = data.socialLinks || [];
  const home = document.body.dataset.page === 'home';
  const heading = home
    ? '<h2 id="platforms-heading" class="section-quiet-title">Also on</h2>'
    : `<p class="eyebrow">Platforms</p><h2>${escapeHtml(data.profile.handle || '')}</h2>${data.profile.tagline ? `<p class="lede">${escapeHtml(data.profile.tagline)}</p>` : ''}`;
  el.innerHTML = `
    <div class="wrap">
      ${heading}
      <div class="platform-list">
        ${links.map((link) => {
          const href = safeHttp(link.url);
          if (!href) return '';
          return `
            <a class="platform-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
              <span class="platform-mark" aria-hidden="true">${iconMarkup(link.icon)}</span>
              <span>${escapeHtml(link.label || '')}</span>
              ${externalSuffix()}
              <span class="platform-arrow" aria-hidden="true">${window.svgIcon ? window.svgIcon('arrow-right') : ''}</span>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderContact(data) {
  const el = document.querySelector('[data-role="contact"]');
  if (!el) return;
  const contact = data.contact || {};
  el.innerHTML = `
    <div class="wrap contact-layout">
      <div>
        <p class="eyebrow">Contact</p>
        <h2>${escapeHtml(contact.heading || '')}</h2>
        ${contact.text ? `<p class="lede">${escapeHtml(contact.text)}</p>` : ''}
      </div>
      <div class="contact-actions">
        <a class="email-link" href="${mailto(contact.email, contact.subject)}">${escapeHtml(contact.email || '')}</a>
        <a class="btn btn-primary" href="${mailto(contact.email, contact.subject)}">${escapeHtml(contact.button || 'Contact')}</a>
      </div>
    </div>
  `;
}

function renderOptional(data) {
  const mount = document.querySelector('[data-role="optional"]');
  if (!mount) return;
  const opt = data.optional || {};
  const parts = [];

  const workItems = (opt.featuredWork || []).filter((item) => {
    if (!item) return false;
    return String(item.title || '').trim() && String(item.summary || '').trim() && safeAsset(item.image);
  });

  if (workItems.length) {
    parts.push(`
      <section class="section" id="work" aria-labelledby="work-heading">
        <div class="wrap">
          <p class="eyebrow">Selected work</p>
          <h2 id="work-heading">Projects</h2>
          <div class="work-grid">
            ${workItems.map((item) => {
              const href = safeHttp(item.url);
              const image = escapeHtml(safeAsset(item.image));
              const body = `
                <img src="${image}" alt="">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary)}</p>
              `;
              return href
                ? `<a class="work-card" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${body}${externalSuffix()}</a>`
                : `<article class="work-card">${body}</article>`;
            }).join('')}
          </div>
        </div>
      </section>
    `);
  }

  const clients = (opt.clientLogos || []).filter((item) => item && String(item.name || '').trim());
  if (clients.length) {
    parts.push(`
      <section class="section section-tight" id="clients" aria-labelledby="clients-heading">
        <div class="wrap">
          <h2 id="clients-heading" class="eyebrow">Clients</h2>
          <ul class="client-row">
            ${clients.map((item) => {
              const usable = safeAsset(item.image);
              return `<li>${usable ? `<img src="${escapeHtml(usable)}" alt="${escapeHtml(item.name)}">` : `<span>${escapeHtml(item.name)}</span>`}</li>`;
            }).join('')}
          </ul>
        </div>
      </section>
    `);
  }

  const quotes = (opt.testimonials || []).filter((item) => item && String(item.quote || '').trim() && String(item.name || '').trim());
  if (quotes.length) {
    parts.push(`
      <section class="section" id="testimonials" aria-labelledby="quotes-heading">
        <div class="wrap">
          <p class="eyebrow">Testimonials</p>
          <h2 id="quotes-heading">From clients</h2>
          <div class="quote-grid">
            ${quotes.map((item) => `
              <figure class="quote">
                <blockquote><p>${escapeHtml(item.quote)}</p></blockquote>
                <figcaption>
                  <span>${escapeHtml(item.name)}</span>
                  ${String(item.role || '').trim() ? `<span>${escapeHtml(item.role)}</span>` : ''}
                </figcaption>
              </figure>
            `).join('')}
          </div>
        </div>
      </section>
    `);
  }

  const bio = String(opt.bio || '').trim();
  if (bio) {
    parts.push(`
      <section class="section" id="about" aria-labelledby="about-heading">
        <div class="wrap bio">
          <div>
            <p class="eyebrow">About</p>
            <h2 id="about-heading">${escapeHtml(data.profile.handle || '')}</h2>
          </div>
          <p>${escapeHtml(bio)}</p>
        </div>
      </section>
    `);
  }

  mount.innerHTML = parts.join('');
}

function renderFooter(data) {
  const el = document.querySelector('[data-role="footer"]');
  if (!el) return;
  const contact = data.contact || {};
  const links = data.socialLinks || [];
  el.innerHTML = `
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <img src="${escapeHtml(data.profile.logo)}" width="48" height="48" alt="">
        <p class="footer-handle">${escapeHtml(data.profile.handle || '')}</p>
        ${data.profile.tagline ? `<p>${escapeHtml(data.profile.tagline)}</p>` : ''}
      </div>
      <div>
        <p class="footer-label">Services</p>
        <ul>
          <li><a href="portfolio.html">Professional Services</a></li>
          <li><a href="portfolio.html#streamer">Streamer Services</a></li>
          <li><a href="portfolio.html#corporate">Corporate Services</a></li>
          <li><a href="${contactHref()}">Work with me</a></li>
        </ul>
      </div>
      <div>
        <p class="footer-label">Connect</p>
        <ul>
          <li><a href="${mailto(contact.email, contact.subject)}">${escapeHtml(contact.email || '')}</a></li>
          ${links.map((link) => {
            const href = safeHttp(link.url);
            if (!href) return '';
            return `<li><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label || '')}${externalSuffix()}</a></li>`;
          }).join('')}
        </ul>
      </div>
    </div>
    <div class="wrap footer-base">
      <p>${escapeHtml((data.footer && data.footer.copyright) || '')}</p>
    </div>
  `;
}

function showLoadError() {
  const main = document.getElementById('content');
  if (!main) return;
  main.innerHTML = `
    <section class="section">
      <div class="wrap">
        <h1>Production &amp; Creative Services</h1>
        <p class="lede">The page could not load its content file.</p>
        <a class="btn btn-primary" href="mailto:hello@ndawg2478.com?subject=Production%20Inquiry">Contact for Production Inquiries</a>
      </div>
    </section>
  `;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadSiteData();
    renderHeader(data);
    if (document.body.dataset.page === 'home') {
      renderCreator(data);
      renderFeeds(data);
      renderShorts(data);
      renderPlatforms(data);
      renderHomeContact(data);
    } else {
      renderHero(data);
      renderServices(data);
      renderOptional(data);
      renderContact(data);
    }
    renderFooter(data);
    document.body.classList.add('is-ready');
  } catch (err) {
    console.error('Site data failed to load:', err);
    showLoadError();
    document.body.classList.add('is-ready');
  }
});
