import { initPiSDK, authenticate } from './pi-sdk.js';
import { renderDashboard }    from './page-dashboard.js';
import { renderLPHelper }     from './page-lp-helper.js';
import { renderArbitrage }    from './page-arbitrage.js';
import { renderSwap }         from './page-swap.js';
import { renderWallet }       from './page-wallet.js';
import { renderSubscription } from './page-subscription.js';
import { t, getLang, setLang } from './i18n.js';

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
  btn.innerHTML = '연결 중... / Connecting...';
  if (errEl) errEl.style.display = 'none';
  try {
    const auth = await authenticate();
    document.getElementById('header-username').textContent = auth.user.username ?? 'unknown';

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    updateNavLabels();
    renderLangSwitch();
    renderHeaderButtons();
    if (localStorage.getItem('stellar_pub_key')) setWalletTabVisible(true);
    switchPage('dashboard');
  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = 'PiDEX 시작하기<br><span class="login-btn-en">Start PiDEX Util</span>';
    if (errEl) { errEl.textContent = '연결 실패. 다시 시도해주세요. / Connection failed.'; errEl.style.display = 'block'; }
    console.error(e);
  }
}

function renderHeaderButtons() {
  const el = document.getElementById('header-buttons');
  if (!el) return;
  el.innerHTML = `
    <button class="header-icon-btn" onclick="window._toggleInfo()">ℹ️ ${t('btn_info')}</button>
    <button class="header-icon-btn" onclick="window._toggleUtils()">🔗 ${t('btn_utils')}</button>
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

    <a class="util-card" href="https://mmstrategylabqge3450.pinet.com/" target="_blank">
      <div class="util-card-icon">
        <svg width="64" height="64" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
          <rect width="72" height="72" rx="16" fill="#f8f8f8"/>
          <path d="M16,47 Q7,25 30,13" stroke="#00BFA5" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M42,11 Q64,22 60,45" stroke="#7B5EA7" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M55,58 Q40,68 17,58" stroke="#4A90D9" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="36" cy="36" r="14" fill="#F5A623"/>
          <rect x="28" y="41" width="4" height="5" fill="white" rx="1"/>
          <rect x="34" y="37" width="4" height="9" fill="white" rx="1"/>
          <rect x="40" y="32" width="4" height="14" fill="white" rx="1"/>
          <polyline points="29,39 34,33 40,30 44,27" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="36" cy="11" r="9" fill="#7B5EA7"/>
          <path d="M29,8 L29,16 Q36,14 36,14 Q36,14 43,16 L43,8 Q36,6 36,6 Q36,6 29,8Z" fill="white" opacity="0.9"/>
          <line x1="36" y1="6" x2="36" y2="14" stroke="#7B5EA7" stroke-width="1.2"/>
          <circle cx="61" cy="53" r="9" fill="#4A90D9"/>
          <line x1="56" y1="50" x2="66" y2="50" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="56" y1="53.5" x2="66" y2="53.5" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="56" y1="57" x2="66" y2="57" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="11" cy="53" r="9" fill="#00BFA5"/>
          <line x1="11" y1="46" x2="11" y2="60" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="6" y1="49" x2="16" y2="49" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M6,49 L4.5,54 L7.5,54 Z" fill="white"/>
          <path d="M16,49 L14.5,54 L17.5,54 Z" fill="white"/>
          <line x1="8.5" y1="60" x2="13.5" y2="60" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="util-card-body">
        <div class="util-card-name">MM Strategy Lab</div>
        <div class="util-card-tags">
          <span class="util-tag">Orderbook MM</span>
          <span class="util-tag">AMM</span>
          <span class="util-tag">자동 최적화</span>
        </div>
        <div class="util-card-desc">마켓메이킹 전략 백테스트 시뮬레이터. Stellar 메인넷과 Pi DEX 에서 실제 거래 데이터를 기반으로 전략을 검증하세요.</div>
        <div class="util-card-link">Pi Browser로 열기 →</div>
      </div>
    </a>
  `;
}

async function init() {
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
