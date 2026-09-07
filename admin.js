/* ==========================================================================
   admin.js — Admin portal logic
   ==========================================================================
   IMPORTANT — read this before relying on this panel:

   This site is hosted on GitHub Pages, which serves static files only —
   there is no server or database to save changes to. This admin panel
   edits an in-browser copy of data/site-data.json:

     1. "Save Draft" stores your edits in this browser's localStorage so
        you can click "Preview site" and see them on index.html/portfolio.html
        immediately. This draft is NOT visible to anyone else and is lost
        if browser storage is cleared.
     2. "Export site-data.json" downloads the edited file. To actually
        publish changes, replace /data/site-data.json in your GitHub repo
        with the downloaded file (upload it via github.com or `git push`)
        and GitHub Pages will redeploy automatically.

   The password gate below is a basic deterrent (keeps casual visitors from
   poking at the form), NOT real security — anyone who views this file's
   source can read the password. Don't store secrets here, and consider
   keeping this admin.html file out of any linked navigation.
   ========================================================================== */

const ADMIN_PASSWORD = 'Daisy20221118'; // <-- change this before publishing
const GATE_SESSION_KEY = 'ndawgAdminUnlocked';
const DRAFT_KEY = 'ndawgSiteDataDraft';
const DATA_PATH = 'data/site-data.json';

let state = null;

/* ---------------- Safe storage ----------------
   Some preview/sandboxed environments (and some browser privacy modes)
   throw on any sessionStorage/localStorage access rather than just
   failing quietly. Any such throw here would previously kill initGate()
   before the Unlock button's click handler was ever attached, silently
   bricking the whole password form. This wrapper falls back to an
   in-memory store so the gate and admin panel always work, even though
   the fallback won't persist across a real page reload. */
const safeStorage = (() => {
  function memoryStore() {
    const mem = {};
    return {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; },
    };
  }
  function test(storage) {
    const key = '__ndawg_test__';
    storage.setItem(key, '1');
    storage.removeItem(key);
    return storage;
  }
  let session, local;
  try { session = test(window.sessionStorage); } catch (e) { session = memoryStore(); }
  try { local = test(window.localStorage); } catch (e) { local = memoryStore(); }
  return { session, local };
})();

/* ---------------- Gate ---------------- */

function initGate() {
  const gate = document.getElementById('gate');
  const app = document.getElementById('app');
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-password');
  const error = document.getElementById('gate-error');

  // Preview-sample-only bypass: never present in the real deployed admin.html,
  // only injected by the standalone preview build so it can be reviewed
  // without needing to fight a sandboxed preview environment's storage/form
  // quirks. See build_previews.py.
  if (window.__PREVIEW_BYPASS_GATE__) {
    gate.hidden = true;
    app.hidden = false;
    initApp();
    return;
  }

  if (safeStorage.session.getItem(GATE_SESSION_KEY) === 'true') {
    gate.hidden = true;
    app.hidden = false;
    initApp();
    return;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value === ADMIN_PASSWORD) {
      safeStorage.session.setItem(GATE_SESSION_KEY, 'true');
      gate.hidden = true;
      app.hidden = false;
      initApp();
    } else {
      error.textContent = 'Incorrect password.';
      input.value = '';
      input.focus();
    }
  });
}

/* ---------------- Data load/save ---------------- */

async function loadData() {
  if (window.__PREVIEW_DATA__) {
    return JSON.parse(JSON.stringify(window.__PREVIEW_DATA__));
  }
  const draft = safeStorage.local.getItem(DRAFT_KEY);
  if (draft) {
    try {
      return JSON.parse(draft);
    } catch (e) {
      console.warn('Draft parse failed, loading published data.json instead.', e);
    }
  }
  const res = await fetch(DATA_PATH);
  if (!res.ok) throw new Error('Could not load ' + DATA_PATH);
  return res.json();
}

function setStatus(msg, saved) {
  const el = document.getElementById('admin-status');
  el.textContent = msg;
  el.classList.toggle('admin-status--saved', !!saved);
}

function saveDraft() {
  safeStorage.local.setItem(DRAFT_KEY, JSON.stringify(state, null, 2));
  setStatus('Draft saved to this browser at ' + new Date().toLocaleTimeString() + '. Click "Preview site" to see it live.', true);
}

function resetDraft() {
  if (!confirm('Discard unsaved draft and reload the published site-data.json?')) return;
  safeStorage.local.removeItem(DRAFT_KEY);
  location.reload();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'site-data.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus('site-data.json downloaded. Replace /data/site-data.json in your repo with this file to publish.', true);
}

/* ---------------- Helpers ---------------- */

function uid(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2, 9);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/* ---------------- Profile & logos ---------------- */

function renderProfileSection() {
  const p = state.profile;

  document.getElementById('profile-handle').value = p.handle || '';
  document.getElementById('profile-tagline').value = p.tagline || '';
  document.getElementById('banner-path').value = p.bannerImage || '';
  document.getElementById('profile-path').value = p.profileImage || '';
  document.getElementById('banner-spec').textContent = p.bannerImageSpec || '';
  document.getElementById('profile-spec').textContent = p.profileImageSpec || '';

  document.getElementById('banner-preview-img').src = p.bannerImage || '';
  document.getElementById('profile-preview-img').src = p.profileImage || '';

  document.getElementById('profile-handle').oninput = (e) => { state.profile.handle = e.target.value; };
  document.getElementById('profile-tagline').oninput = (e) => { state.profile.tagline = e.target.value; };
  document.getElementById('banner-path').oninput = (e) => {
    state.profile.bannerImage = e.target.value;
    document.getElementById('banner-preview-img').src = e.target.value;
  };
  document.getElementById('profile-path').oninput = (e) => {
    state.profile.profileImage = e.target.value;
    document.getElementById('profile-preview-img').src = e.target.value;
  };

  setupUpload('banner-upload', async (file) => {
    const dataUrl = await fileToDataUrl(file);
    state.profile.bannerImage = dataUrl;
    document.getElementById('banner-path').value = '(embedded image — ' + Math.round(file.size / 1024) + ' KB)';
    document.getElementById('banner-preview-img').src = dataUrl;
    checkDimensions(dataUrl, 1920, 1080, 'banner-dim-warning');
  });

  setupUpload('profile-upload', async (file) => {
    const dataUrl = await fileToDataUrl(file);
    state.profile.profileImage = dataUrl;
    document.getElementById('profile-path').value = '(embedded image — ' + Math.round(file.size / 1024) + ' KB)';
    document.getElementById('profile-preview-img').src = dataUrl;
    checkDimensions(dataUrl, 500, 500, 'profile-dim-warning');
  });
}

function setupUpload(inputId, onFile) {
  const input = document.getElementById(inputId);
  input.value = '';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) await onFile(file);
  };
}

async function checkDimensions(dataUrl, recommendedW, recommendedH, warningElId) {
  const dims = await readImageDimensions(dataUrl);
  const warningEl = document.getElementById(warningElId);
  if (!dims) { warningEl.classList.remove('visible'); return; }
  const tolerance = 0.15;
  const wOff = Math.abs(dims.width - recommendedW) / recommendedW;
  const hOff = Math.abs(dims.height - recommendedH) / recommendedH;
  if (wOff > tolerance || hOff > tolerance) {
    warningEl.textContent = `Uploaded image is ${dims.width}\u00d7${dims.height}px — recommended is ${recommendedW}\u00d7${recommendedH}px. It will still work, just may crop or scale differently than expected.`;
    warningEl.classList.add('visible');
  } else {
    warningEl.classList.remove('visible');
  }
}

/* ---------------- Social links ---------------- */

function renderSocialLinks() {
  const container = document.getElementById('social-links-list');
  container.innerHTML = state.socialLinks.map((link, i) => `
    <div class="link-row" data-index="${i}">
      <div class="link-row-grid">
        <div class="field-row" style="margin-bottom:0">
          <label>Label</label>
          <input type="text" data-field="label" value="${escapeAttr(link.label)}" placeholder="e.g. Discord">
        </div>
        <div class="field-row" style="margin-bottom:0">
          <label>URL</label>
          <input type="url" data-field="url" value="${escapeAttr(link.url)}" placeholder="https://...">
        </div>
        <div class="field-row" style="margin-bottom:0">
          <label>Icon path</label>
          <input type="text" data-field="icon" value="${escapeAttr(link.icon)}" placeholder="assets/icons/discord.svg">
        </div>
        <button type="button" class="remove-btn" title="Remove link" aria-label="Remove link">
          ${window.svgIcon('trash-2')}
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.link-row').forEach((row) => {
    const index = Number(row.dataset.index);
    row.querySelectorAll('input[data-field]').forEach((input) => {
      input.oninput = () => {
        state.socialLinks[index][input.dataset.field] = input.value;
      };
    });
    row.querySelector('.remove-btn').onclick = () => {
      state.socialLinks.splice(index, 1);
      renderSocialLinks();
    };
  });
}

function addSocialLink() {
  state.socialLinks.push({ id: uid('link'), label: '', url: '', icon: '' });
  renderSocialLinks();
}

/* ---------------- Services ---------------- */

function renderServiceCategories() {
  const container = document.getElementById('service-categories-list');
  container.innerHTML = state.serviceCategories.map((cat, ci) => `
    <div class="category-block" data-cat-index="${ci}">
      <div class="category-head">
        <div class="field-row">
          <label>Category name</label>
          <input type="text" data-cat-field="title" value="${escapeAttr(cat.title)}" placeholder="e.g. Streamer Services">
        </div>
        <div class="field-row" style="max-width:160px">
          <label>Accent color</label>
          <select data-cat-field="accent">
            <option value="sunset" ${cat.accent === 'sunset' ? 'selected' : ''}>Sunset orange</option>
            <option value="purple" ${cat.accent === 'purple' ? 'selected' : ''}>Purple</option>
          </select>
        </div>
        <button type="button" class="remove-btn category-remove" title="Remove category" aria-label="Remove category">
          ${window.svgIcon('trash-2')}
        </button>
      </div>

      <div data-services-list>
        ${(cat.services || []).map((svc, si) => `
          <div class="service-row" data-svc-index="${si}">
            <div class="field-row">
              <label>Service title</label>
              <input type="text" data-svc-field="title" value="${escapeAttr(svc.title)}" placeholder="Service name">
            </div>
            <div class="field-row">
              <label>Description</label>
              <textarea data-svc-field="description" placeholder="Short description">${escapeHtml(svc.description)}</textarea>
            </div>
            <div class="link-row-grid">
              <div class="field-row" style="margin-bottom:0">
                <label>Icon</label>
                <input type="text" data-svc-field="icon" value="${escapeAttr(svc.icon)}" placeholder="monitor, bot, shirt, scissors, video, presentation, briefcase, star">
              </div>
              <div class="field-row" style="margin-bottom:0">
                <label>Link (optional)</label>
                <input type="url" data-svc-field="link" value="${escapeAttr(svc.link)}" placeholder="https://... (booking page, form, etc.)">
              </div>
              <div></div>
              <button type="button" class="remove-btn" title="Remove service" aria-label="Remove service">
                ${window.svgIcon('trash-2')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      <button type="button" class="add-btn" data-add-service>
        ${window.svgIcon('plus')} Add service to this category
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.category-block').forEach((block) => {
    const ci = Number(block.dataset.catIndex);

    block.querySelectorAll('[data-cat-field]').forEach((input) => {
      input.oninput = () => {
        state.serviceCategories[ci][input.dataset.catField] = input.value;
      };
    });

    block.querySelector('.category-remove').onclick = () => {
      if (!confirm('Remove this whole category and its services?')) return;
      state.serviceCategories.splice(ci, 1);
      renderServiceCategories();
    };

    block.querySelectorAll('.service-row').forEach((row) => {
      const si = Number(row.dataset.svcIndex);
      row.querySelectorAll('[data-svc-field]').forEach((input) => {
        input.oninput = () => {
          state.serviceCategories[ci].services[si][input.dataset.svcField] = input.value;
        };
      });
      row.querySelector('.remove-btn').onclick = () => {
        state.serviceCategories[ci].services.splice(si, 1);
        renderServiceCategories();
      };
    });

    block.querySelector('[data-add-service]').onclick = () => {
      state.serviceCategories[ci].services.push({
        id: uid('svc'), title: '', description: '', icon: 'star', link: ''
      });
      renderServiceCategories();
    };
  });
}

function addCategory() {
  state.serviceCategories.push({
    id: uid('cat'), title: 'New Category', accent: 'sunset', services: []
  });
  renderServiceCategories();
}

/* ---------------- Contact ---------------- */

function renderContact() {
  document.getElementById('contact-email').value = state.contact.email || '';
  document.getElementById('contact-subject').value = state.contact.subject || '';
  document.getElementById('contact-email').oninput = (e) => { state.contact.email = e.target.value; };
  document.getElementById('contact-subject').oninput = (e) => { state.contact.subject = e.target.value; };
}

/* ---------------- Escaping ---------------- */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

/* ---------------- Init ---------------- */

async function initApp() {
  try {
    state = await loadData();
  } catch (err) {
    setStatus('Failed to load site data: ' + err.message, false);
    return;
  }

  renderProfileSection();
  renderSocialLinks();
  renderServiceCategories();
  renderContact();

  document.getElementById('add-social-link').onclick = addSocialLink;
  document.getElementById('add-category').onclick = addCategory;
  document.getElementById('save-draft').onclick = saveDraft;
  document.getElementById('export-json').onclick = exportJson;
  document.getElementById('reset-draft').onclick = resetDraft;

  if (safeStorage.local.getItem(DRAFT_KEY)) {
    setStatus('Showing an unsaved draft from a previous session.', true);
  } else {
    setStatus('Loaded published site-data.json.', false);
  }
}

document.addEventListener('DOMContentLoaded', initGate);
