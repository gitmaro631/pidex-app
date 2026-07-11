import { initPiSDK, authenticate } from './pi-sdk.js';
import { renderDashboard }    from './page-dashboard.js';
import { renderTools }        from './page-tools.js';
import { renderArbitrage }    from './page-arbitrage.js';
import { renderMM }           from './page-mm.js';
import { renderWallet }       from './page-wallet.js';
import { renderSubscription } from './page-subscription.js';
import { t, getLang, setLang } from './i18n.js';
const NOTICE = {
  version: '2026-07-12',
  ko: '📢 업데이트 안내 (2026-07-12)\n\n① 지갑 별칭이 퀴즈파이 앱과 통합되어, 어디서 등록한 별칭이든 거래내역에 자동으로 표시됩니다',
  en: "📢 Update Notice (2026-07-12)\n\n① Wallet aliases are now unified with the PiDEX Quiz app — any alias you've registered will automatically show in transaction history",
  id: "📢 Pemberitahuan Pembaruan (2026-07-12)\n\n① Alias dompet kini terpadu dengan aplikasi PiDEX Quiz — alias apa pun yang Anda daftarkan akan otomatis muncul di riwayat transaksi",
  zh: '📢 更新通知 (2026-07-12)\n\n① 钱包别名现已与PiDEX Quiz应用统一，无论在哪里注册的别名都会自动显示在交易记录中',
  ja: '📢 アップデートのお知らせ (2026-07-12)\n\n① ウォレットのエイリアスがPiDEX Quizアプリと統合され、どこで登録したエイリアスでも取引履歴に自動で表示されます',
  es: "📢 Aviso de actualización (2026-07-12)\n\n① Los alias de cartera ahora están unificados con la app PiDEX Quiz — cualquier alias que registre aparecerá automáticamente en el historial de transacciones",
  vi: "📢 Thông báo cập nhật (2026-07-12)\n\n① Biệt danh ví giờ đã hợp nhất với ứng dụng PiDEX Quiz — bất kỳ biệt danh nào bạn đăng ký sẽ tự động hiển thị trong lịch sử giao dịch",
  hi: "📢 अपडेट सूचना (2026-07-12)\n\n① वॉलेट उपनाम अब PiDEX Quiz ऐप के साथ एकीकृत हो गए हैं — आपने जहां भी उपनाम पंजीकृत किया हो, वह लेनदेन इतिहास में अपने आप दिखेगा",
  pt: "📢 Aviso de atualização (2026-07-12)\n\n① Os apelidos de carteira agora estão unificados com o app PiDEX Quiz — qualquer apelido que você registrar aparecerá automaticamente no histórico de transações",
  tl: "📢 Abiso sa Update (2026-07-12)\n\n① Pinagsama na ang alias ng wallet sa PiDEX Quiz app — anumang alias na na-register mo ay awtomatikong lalabas sa transaction history",
  fr: "📢 Avis de mise à jour (2026-07-12)\n\n① Les alias de portefeuille sont désormais unifiés avec l'application PiDEX Quiz — tout alias que vous enregistrez apparaît automatiquement dans l'historique des transactions",
};
import { isSubscribed } from './util-storage.js';
import { getDb } from './firebase-wallet.js';

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

const NAV_KEYS = ['dex','arb','tools','mm','wallet','info'];

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
  arbitrage: (c) => renderArbitrage(c),
  tools:     (c) => renderTools(c),
  mm:        (c) => renderMM(c),
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
    showNoticeIfNeeded();
    switchPage('dashboard');
  } catch (e) {
    btn.disabled = false;
    btn.textContent = t('login_btn');
    if (errEl) { errEl.textContent = t('login_fail'); errEl.style.display = 'block'; }
    console.error(e);
  }
}

const _NOTICE_COL = 'notices_pidex_app';

async function showNoticeIfNeeded() {
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  let notices = [];
  try {
    const db = getDb();
    if (db) {
      if (NOTICE) {
        const ref  = db.collection(_NOTICE_COL).doc(NOTICE.version);
        const snap = await ref.get();
        if (!snap.exists) await ref.set({ ...NOTICE, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      const q = await db.collection(_NOTICE_COL).orderBy('createdAt', 'asc').get();
      notices = q.docs.map(d => d.data());
    }
  } catch {}
  if (!notices.length && NOTICE) notices = [NOTICE];
  if (!notices.length) return;
  const latest = notices[notices.length - 1];
  const skipUntil   = parseInt(localStorage.getItem(SKIP_KEY) || '0', 10);
  const skipVersion = localStorage.getItem(VERSION_KEY) || '';
  if (skipVersion === latest.version && Date.now() < skipUntil) return;
  _showNoticePopup(notices, notices.length - 1);
}

function _showNoticePopup(notices, idx) {
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  const latest  = notices[notices.length - 1];
  const notice  = notices[idx];
  const lang    = getLang();
  const text    = notice[lang] || notice.en;
  const total   = notices.length;
  document.getElementById('notice-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'notice-overlay';
  overlay.className = 'notice-overlay';
  overlay.innerHTML = `
    <div class="notice-box">
      <div class="notice-body">${text.replace(/\n/g, '<br>')}</div>
      ${total > 1 ? `
      <div class="notice-nav">
        <button class="notice-nav-btn" id="notice-prev"${idx === 0 ? ' disabled' : ''}>←</button>
        <span class="notice-nav-page">${idx + 1} / ${total}</span>
        <button class="notice-nav-btn" id="notice-next"${idx === total - 1 ? ' disabled' : ''}>→</button>
      </div>` : ''}
      <label class="notice-skip-label">
        <input type="checkbox" id="notice-skip-check">
        <span>${t('notice_skip_week')}</span>
      </label>
      <button class="notice-close-btn" id="notice-close-btn">${t('notice_confirm')}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#notice-prev')?.addEventListener('click', () => { overlay.remove(); _showNoticePopup(notices, idx - 1); });
  overlay.querySelector('#notice-next')?.addEventListener('click', () => { overlay.remove(); _showNoticePopup(notices, idx + 1); });
  overlay.querySelector('#notice-close-btn').addEventListener('click', () => {
    if (overlay.querySelector('#notice-skip-check').checked) {
      localStorage.setItem(SKIP_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      localStorage.setItem(VERSION_KEY, latest.version);
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
