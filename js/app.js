// 앱 진입점 — 초기화, 탭 라우팅, 전역 유틸

import { initPiSDK, authenticate, currentUser } from './pi-sdk.js';
import { renderDashboard }    from './pages/dashboard.js';
import { renderLPHelper }     from './pages/lp-helper.js';
import { renderArbitrage }    from './pages/arbitrage.js';
import { renderSwap }         from './pages/swap.js';
import { renderSubscription } from './pages/subscription.js';

// ── 전역 유틸 (다른 모듈에서 import) ──────────────────
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

// ── 앱 상태 ──────────────────────────────────────────
let userAddress = null;
let activePage  = 'dashboard';

const PAGE_RENDERERS = {
  dashboard: (c) => renderDashboard(c, userAddress),
  lp:        (c) => renderLPHelper(c),
  arbitrage: (c) => renderArbitrage(c),
  swap:      (c) => renderSwap(c),
  sub:       (c) => renderSubscription(c),
};

// ── 탭 전환 ──────────────────────────────────────────
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

// ── 초기화 ────────────────────────────────────────────
async function init() {
  initPiSDK();

  // 탭 클릭 이벤트 등록
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });

  // 로그인 버튼
  document.getElementById('btn-login').addEventListener('click', async () => {
    showLoading('Pi 지갑 연결 중...');
    try {
      const auth  = await authenticate();

      // Stellar 공개키 추출 (Pi SDK 버전에 따라 위치가 다름)
      userAddress = auth.user.walletPublicKey
                 ?? auth.user.wallet_public_key
                 ?? auth.user.credentials?.scopes?.includes('wallet_address') && auth.user.walletAddress
                 ?? null;

      // 콘솔에서 실제 구조 확인용 (배포 후 제거 가능)
      console.log('Pi auth user:', JSON.stringify(auth.user, null, 2));

      userAddress = auth.user.uid; // Stellar 주소는 대시보드에서 직접 입력
      document.getElementById('header-username').textContent = auth.user.username ?? 'unknown';

      // 구독 배지 표시
      const { isSubscribed } = await import('./utils/storage.js');
      if (isSubscribed()) document.getElementById('header-sub-badge').classList.remove('hidden');

      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('app-screen').classList.remove('hidden');
      hideLoading();

      switchPage('dashboard');
    } catch (e) {
      hideLoading();
      showToast('로그인 실패. Pi Browser에서 실행해주세요.', 'error');
      console.error(e);
    }
  });
}

init();
