import { initPiSDK, authenticate } from './pi-sdk.js';
import { renderDashboard }    from './page-dashboard.js';
import { renderLPHelper }     from './page-lp-helper.js';
import { renderArbitrage }    from './page-arbitrage.js';
import { renderSwap }         from './page-swap.js';
import { renderWallet }       from './page-wallet.js';
import { renderSubscription } from './page-subscription.js';
import { t, getLang, setLang } from './i18n.js';
import { NOTICE } from './notice.js';
import { isSubscribed } from './util-storage.js';
import { importPendingWallets } from './firebase-wallet.js';

export function showLoading(msg = '처리 중...') {
  document.getElementById('loading-msg').textContent = msg;
  document.getElementById('loading-overlay').classList.remove('hidden');
}
export function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

let toastTimer = null;
export function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

const NAV_KEYS = ['dex','lp','arb','swap','wallet','info'];

export function updateNavLabels() {
  document.querySelectorAll('.nav-tab').forEach((btn, i) => {
    const key = NAV_KEYS[i];
    const labelEl = btn.querySelector('.nav-label-main');
    if (labelEl) labelEl.textContent = t(`nav_${key}`);
  });
  const badge = document.getElementById('header-sub-badge');
  if (badge && !badge.classList.contains('hidden')) badge.textContent = t('sub_active');
}

export function switchLang(lang) {
  setLang(lang);
  updateNavLabels();
  renderLangSwitch();
  renderHeaderButtons();
  renderedPages.clear();
  switchPage(activePage);
}

const _LANG_META = {
  ko: { flag: '🇰🇷', name: '한국어' },
  en: { flag: '🇺🇸', name: 'English' },
  id: { flag: '🇮🇩', name: 'Indonesia' },
  zh: { flag: '🇨🇳', name: '中文' },
  ja: { flag: '🇯🇵', name: '日本語' },
  es: { flag: '🇪🇸', name: 'Español' },
  vi: { flag: '🇻🇳', name: 'Tiếng Việt' },
  hi: { flag: '🇮🇳', name: 'हिन्दी' },
  pt: { flag: '🇧🇷', name: 'Português' },
  tl: { flag: '🇵🇭', name: 'Filipino' },
  fr: { flag: '🇫🇷', name: 'Français' },
};

function renderLangSwitch() {
  const el = document.getElementById('lang-switch');
  if (!el) return;
  const cur = getLang();
  const m = _LANG_META[cur] || _LANG_META.en;
  el.innerHTML = `<div class="lang-dropdown">
    <button class="lang-selected" onclick="window._toggleLangMenu()">
      <span class="lang-flag">${m.flag}</span><span>${m.name}</span><span class="lang-arrow">▾</span>
    </button>
    <div class="lang-menu" id="lang-menu">
      ${Object.keys(_LANG_META).map(l => {
        const lm = _LANG_META[l];
        return `<div class="lang-option${l === cur ? ' active' : ''}" onclick="window._switchLang('${l}')">
          <span class="lang-flag">${lm.flag}</span><span>${lm.name}</span></div>`;
      }).join('')}
    </div>
  </div>`;
}

let activePage = 'dashboard';
const renderedPages = new Set();

const PAGE_RENDERERS = {
  dashboard: (c) => renderDashboard(c),
  lp:        (c) => renderLPHelper(c),
  arbitrage: (c) => renderArbitrage(c),
  swap:      (c) => renderSwap(c),
  wallet:    (c) => renderWallet(c),
  sub:       (c) => renderSubscription(c),
};

export function setWalletTabVisible(visible) {
  const tab = document.querySelector('.nav-tab[data-page="wallet"]');
  if (!tab) return;
  if (visible) tab.classList.remove('nav-tab-hidden');
  else         tab.classList.add('nav-tab-hidden');
}

export function rerenderPage(pageKey) {
  const pageEl = document.getElementById(`page-${pageKey}`);
  if (!pageEl) return;
  PAGE_RENDERERS[pageKey]?.(pageEl);
}

function switchPage(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const pageEl = document.getElementById(`page-${pageKey}`);
  const tabEl  = document.querySelector(`.nav-tab[data-page="${pageKey}"]`);
  pageEl.classList.remove('hidden');
  tabEl.classList.add('active');
  activePage = pageKey;
  if (!renderedPages.has(pageKey)) {
    renderedPages.add(pageKey);
    PAGE_RENDERERS[pageKey]?.(pageEl);
  }
}

async function doLogin() {
  const btn    = document.getElementById('btn-login');
  const errEl  = document.getElementById('login-error');
  btn.disabled = true;
  btn.textContent = t('connecting');
  if (errEl) errEl.style.display = 'none';
  try {
    const auth = await authenticate();
    document.getElementById('header-username').textContent = auth.user.username ?? 'unknown';

    if (auth.user.wallet_address) {
      localStorage.setItem('stellar_pub_key', auth.user.wallet_address);
    }

    // 구독 뱃지 — 로컬 먼저, 백그라운드 동기화 완료 시 갱신
    const badge = document.getElementById('header-sub-badge');
    function updateSubBadge() {
      if (!badge) return;
      if (isSubscribed()) { badge.textContent = t('sub_active'); badge.classList.remove('hidden'); }
      else { badge.classList.add('hidden'); }
    }
    updateSubBadge();
    window.addEventListener('sub:synced', updateSubBadge, { once: true });

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    updateNavLabels();
    renderLangSwitch();
    renderHeaderButtons();
    setWalletTabVisible(true);
    switchPage('dashboard');
    showNoticeIfNeeded();

    // hack_tracker에서 등록 요청한 pending 지갑 임포트
    const username = auth.user.username;
    if (username) {
      importPendingWallets(username).then(pending => {
        if (!pending.length) return;
        const WALLETS_KEY = 'pidex_wallets';
        const genId = () => `w${Date.now()}${Math.random().toString(36).slice(2,6)}`;
        let wallets = [];
        try { wallets = JSON.parse(localStorage.getItem(WALLETS_KEY) || '[]'); } catch {}
        let added = 0;
        for (const p of pending) {
          if (!wallets.some(w => w.address === p.address)) {
            wallets.push({ id: genId(), address: p.address, alias: p.alias });
            added++;
          }
        }
        if (added > 0) {
          localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
          showToast(t('wallet_pending_imported').replace('{n}', added));
        }
      }).catch(() => {});
    }
  } catch (e) {
    btn.disabled = false;
    btn.textContent = t('login_btn');
    if (errEl) { errEl.textContent = t('login_fail'); errEl.style.display = 'block'; }
    console.error(e);
  }
}

function showNoticeIfNeeded() {
  if (!NOTICE) return;
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  const skipUntil   = parseInt(localStorage.getItem(SKIP_KEY) || '0', 10);
  const skipVersion = localStorage.getItem(VERSION_KEY) || '';
  if (skipVersion === NOTICE.version && Date.now() < skipUntil) return;

  const lang = getLang();
  const text = NOTICE[lang] || NOTICE['en'];

  const overlay = document.createElement('div');
  overlay.id = 'notice-overlay';
  overlay.className = 'notice-overlay';
  overlay.innerHTML = `
    <div class="notice-box">
      <div class="notice-body">${text.replace(/\n/g, '<br>')}</div>
      <label class="notice-skip-label">
        <input type="checkbox" id="notice-skip-check">
        <span>${t('notice_skip_week')}</span>
      </label>
      <button class="notice-close-btn" id="notice-close-btn">${t('notice_confirm')}</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('notice-close-btn').addEventListener('click', () => {
    if (document.getElementById('notice-skip-check').checked) {
      localStorage.setItem(SKIP_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      localStorage.setItem(VERSION_KEY, NOTICE.version);
    }
    overlay.remove();
  });
}

function renderHeaderButtons() {
  const el = document.getElementById('header-buttons');
  if (!el) return;
  el.innerHTML = `
    <button class="btn-header-action" onclick="window._toggleInfo()">ℹ️ ${t('btn_info')}</button>
    <button class="btn-header-action" onclick="window._toggleUtils()">🔗 ${t('btn_utils')}</button>
  `;
}

function renderUtilsOverlay() {
  const panel = document.getElementById('utils-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="utils-header">
      <span class="utils-title">🔗 ${t('utils_title')}</span>
      <button class="utils-close-btn" onclick="window._toggleUtils()">${t('btn_close')}</button>
    </div>
    <div class="utils-body">

    <a class="util-card" href="#" onclick="window.open('https://mmstrategylabqge3450.pinet.com/', '_hub_'+Date.now());return false;">
      <div class="util-card-icon">
        <img src="icons/mmlab.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="MM Strategy Lab">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">MM Strategy Lab</div>
        <div class="util-card-tags">
          <span class="util-tag">Orderbook MM</span>
          <span class="util-tag">AMM</span>
          <span class="util-tag">Auto Optimize</span>
        </div>
        <div class="util-card-desc">${t('hub_mmlab_desc')}</div>
        <div class="util-card-link">${t('hub_open')}</div>
      </div>
    </a>

    <a class="util-card" href="#" onclick="window.open('https://quizpisgn2184.pinet.com', '_hub_'+Date.now());return false;">
      <div class="util-card-icon">
        <img src="icons/pidex-quiz.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="PiDEX Quiz">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">PiDEX Quiz</div>
        <div class="util-card-tags">
          <span class="util-tag">DEX Quiz</span>
          <span class="util-tag">Leaderboard</span>
          <span class="util-tag">Survey</span>
        </div>
        <div class="util-card-desc">${t('hub_quiz_desc')}</div>
        <div class="util-card-link">${t('hub_open')}</div>
      </div>
    </a>

    <a class="util-card" href="#" onclick="return false;" style="opacity:0.6;cursor:default;">
      <div class="util-card-icon">
        <img src="icons/hack-tracker.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="Pi Hack Tracker">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">Pi Hack Tracker</div>
        <div class="util-card-tags">
          <span class="util-tag">Hack Report</span>
          <span class="util-tag">Wallet Trace</span>
          <span class="util-tag">Community</span>
        </div>
        <div class="util-card-desc">${t('hub_hack_desc')}</div>
        <div class="util-card-link" style="color:#888;">${t('hub_coming_soon')}</div>
      </div>
    </a>

    <a class="util-card" href="#" onclick="return false;" style="opacity:0.6;cursor:default;">
      <div class="util-card-icon">
        <img src="icons/survival.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="Pi Survival Game">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">Pi Survival Game</div>
        <div class="util-card-tags">
          <span class="util-tag">Survival</span>
          <span class="util-tag">Text RPG</span>
          <span class="util-tag">11 Maps</span>
        </div>
        <div class="util-card-desc">${t('hub_survival_desc')}</div>
        <div class="util-card-link" style="color:#888;">${t('hub_coming_soon')}</div>
      </div>
    </a>
    </div>
  `;
}

async function init() {
  // Apply detected language to login screen before login
  const loginBtn  = document.getElementById('btn-login');
  const loginNote = document.querySelector('.login-note');
  if (loginBtn)  loginBtn.textContent  = t('login_btn');
  if (loginNote) loginNote.textContent = t('login_note');

  initPiSDK();
  window._switchLang = switchLang;
  window._toggleLangMenu = () => document.getElementById('lang-menu')?.classList.toggle('open');
  window._toggleInfo  = () => switchPage('sub');
  window._toggleUtils = () => {
    const overlay = document.getElementById('utils-overlay');
    overlay.classList.toggle('hidden');
    if (!overlay.classList.contains('hidden')) renderUtilsOverlay();
  };
  document.addEventListener('click', e => {
    if (!e.target.closest('.lang-dropdown')) document.getElementById('lang-menu')?.classList.remove('open');
  });

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });

  document.getElementById('btn-login').addEventListener('click', doLogin);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    hideLoading();
  }
});

init();
