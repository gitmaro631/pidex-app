import { initPiSDK, authenticate } from './pi-sdk.js';
import { renderDashboard }    from './page-dashboard.js';
import { renderLPHelper }     from './page-lp-helper.js';
import { renderArbitrage }    from './page-arbitrage.js';
import { renderSwap }         from './page-swap.js';
import { renderWallet }       from './page-wallet.js';
import { renderSubscription } from './page-subscription.js';

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

let activePage = 'dashboard';

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

function switchPage(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const pageEl = document.getElementById(`page-${pageKey}`);
  const tabEl  = document.querySelector(`.nav-tab[data-page="${pageKey}"]`);
  pageEl.classList.remove('hidden');
  tabEl.classList.add('active');
  activePage = pageKey;
  PAGE_RENDERERS[pageKey]?.(pageEl);
}

async function doLogin() {
  showLoading('Pi 지갑 연결 중...');
  try {
    const auth = await authenticate();
    document.getElementById('header-username').textContent = auth.user.username ?? 'unknown';

    const { isSubscribed } = await import('./util-storage.js');
    if (isSubscribed()) document.getElementById('header-sub-badge').classList.remove('hidden');

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    hideLoading();
    if (localStorage.getItem('stellar_pub_key')) setWalletTabVisible(true);
    switchPage('dashboard');
  } catch (e) {
    hideLoading();
    showToast('로그인 실패. Pi Browser에서 실행해주세요.', 'error');
    console.error(e);
  }
}

async function init() {
  initPiSDK();

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });

  document.getElementById('btn-login').addEventListener('click', doLogin);

  // 앱 시작 시 자동 인증 시도
  await doLogin();
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    hideLoading();
  }
});

init();
