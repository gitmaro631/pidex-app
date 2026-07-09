import { initPiSDK, authenticate } from './pi-sdk.js';
import { renderDashboard }    from './page-dashboard.js';
import { renderTools }        from './page-tools.js';
import { renderArbitrage }    from './page-arbitrage.js';
import { renderMM }           from './page-mm.js';
import { renderWallet }       from './page-wallet.js';
import { renderSubscription } from './page-subscription.js';
import { t, getLang, setLang } from './i18n.js';
const NOTICE = {
  version: '2026-07-10',
  ko: '📢 업데이트 안내\n\n① 지갑 목록이 서버에 저장되어 기기를 바꿔도 유지됩니다 (최대 30개)\n② 지갑마다 수정 · 퀴즈파이 메인넷지갑 전송 · 삭제 버튼이 추가되었습니다\n③ 새로고침 버튼으로 서버 최신 목록을 바로 불러올 수 있습니다',
  en: "📢 Update Notice\n\n① Your wallet list is now stored on the server, so it stays even if you switch devices (up to 30)\n② Added edit, send-to-PiDEX-Quiz-mainnet-wallet, and delete buttons for each wallet\n③ Use the refresh button to fetch the latest list from the server anytime",
  id: "📢 Pemberitahuan Pembaruan\n\n① Daftar dompet kini disimpan di server, jadi tetap ada meski ganti perangkat (maks 30)\n② Ditambahkan tombol edit, kirim ke dompet mainnet PiDEX Quiz, dan hapus untuk setiap dompet\n③ Gunakan tombol refresh untuk mengambil daftar terbaru dari server kapan saja",
  zh: '📢 更新通知\n\n① 钱包列表现已存储在服务器上，更换设备后依然保留（最多30个）\n② 每个钱包新增了编辑、发送到PiDEX Quiz主网钱包、删除按钮\n③ 使用刷新按钮可随时从服务器获取最新列表',
  ja: '📢 アップデートのお知らせ\n\n① ウォレットリストがサーバーに保存されるようになり、端末を変更しても保持されます（最大30個）\n② 各ウォレットに編集・PiDEX Quizメインネットウォレットへ送信・削除ボタンが追加されました\n③ 更新ボタンでサーバーの最新リストをいつでも取得できます',
  es: "📢 Aviso de actualización\n\n① Tu lista de carteras ahora se guarda en el servidor, así que se mantiene aunque cambies de dispositivo (hasta 30)\n② Se añadieron botones de editar, enviar a la cartera mainnet de PiDEX Quiz y eliminar en cada cartera\n③ Usa el botón de actualizar para obtener la lista más reciente del servidor en cualquier momento",
  vi: "📢 Thông báo cập nhật\n\n① Danh sách ví giờ được lưu trên server, nên vẫn còn dù bạn đổi thiết bị (tối đa 30)\n② Đã thêm nút sửa, gửi đến ví mainnet PiDEX Quiz, và xóa cho mỗi ví\n③ Dùng nút làm mới để lấy danh sách mới nhất từ server bất cứ lúc nào",
  hi: "📢 अपडेट सूचना\n\n① वॉलेट सूची अब सर्वर पर सहेजी जाती है, इसलिए डिवाइस बदलने पर भी बनी रहती है (अधिकतम 30)\n② प्रत्येक वॉलेट के लिए संपादित करें, PiDEX Quiz मेननेट वॉलेट में भेजें, और हटाएं बटन जोड़े गए\n③ रीफ्रेश बटन से कभी भी सर्वर से नवीनतम सूची प्राप्त करें",
  pt: "📢 Aviso de atualização\n\n① Sua lista de carteiras agora é salva no servidor, então permanece mesmo trocando de dispositivo (até 30)\n② Adicionados botões de editar, enviar para a carteira mainnet do PiDEX Quiz, e excluir em cada carteira\n③ Use o botão de atualizar para buscar a lista mais recente do servidor a qualquer momento",
  tl: "📢 Abiso sa Update\n\n① Ang listahan ng wallet ay naka-save na sa server, kaya nananatili kahit magpalit ka ng device (hanggang 30)\n② Idinagdag ang edit, ipadala sa PiDEX Quiz mainnet wallet, at delete na button sa bawat wallet\n③ Gamitin ang refresh button para makuha ang pinakabagong listahan mula sa server anumang oras",
  fr: "📢 Avis de mise à jour\n\n① Votre liste de portefeuilles est désormais enregistrée sur le serveur, elle persiste donc même si vous changez d'appareil (jusqu'à 30)\n② Ajout de boutons modifier, envoyer vers le portefeuille mainnet PiDEX Quiz et supprimer pour chaque portefeuille\n③ Utilisez le bouton d'actualisation pour récupérer la liste la plus récente du serveur à tout moment",
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
    switchPage('dashboard');
    showNoticeIfNeeded();
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
