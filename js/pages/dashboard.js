// 지갑 대시보드 페이지

import { fetchAccount } from '../horizon.js';
import { formatPi, formatToken, formatLargeNum } from '../utils/format.js';
import { isSubscribed, getSubscriptionExpiry } from '../utils/storage.js';
import { showToast } from '../app.js';

const STORAGE_KEY = 'stellar_address';

export async function renderDashboard(container, userAddress) {
  const savedAddress = localStorage.getItem(STORAGE_KEY) ?? '';

  container.innerHTML = `
    <!-- Stellar 주소 입력 -->
    <div class="card">
      <div class="card-title">Stellar 지갑 주소</div>
      <p style="color:var(--text2);font-size:12px;margin-bottom:8px;">
        Pi 앱 → 지갑 → 주소 복사 후 붙여넣으세요 (G로 시작하는 56자리)
      </p>
      <div style="display:flex;gap:8px;">
        <input type="text" class="form-input" id="stellar-addr-input"
          placeholder="GXXXX..." value="${savedAddress}" style="flex:1;font-size:12px;" />
        <button class="btn-primary btn-sm" id="btn-load-wallet" style="width:auto;white-space:nowrap;">조회</button>
      </div>
    </div>

    <div id="dash-content">
      ${savedAddress.startsWith('G')
        ? '<p style="color:var(--text2);text-align:center;padding:24px;">불러오는 중...</p>'
        : '<p style="color:var(--text2);text-align:center;padding:24px;">위에 지갑 주소를 입력해주세요</p>'
      }
    </div>
  `;

  container.querySelector('#btn-load-wallet').addEventListener('click', () => {
    const addr = container.querySelector('#stellar-addr-input').value.trim();
    if (!addr.startsWith('G') || addr.length !== 56) {
      showToast('올바른 Stellar 주소를 입력해주세요 (G로 시작, 56자리)', 'error');
      return;
    }
    localStorage.setItem(STORAGE_KEY, addr);
    loadWallet(container, addr);
  });

  // 저장된 주소가 있으면 자동 조회
  if (savedAddress.startsWith('G') && savedAddress.length === 56) {
    loadWallet(container, savedAddress);
  }
}

async function loadWallet(container, address) {
  const content = container.querySelector('#dash-content');
  content.innerHTML = '<p style="color:var(--text2);text-align:center;padding:24px;">불러오는 중...</p>';

  try {
    const account = await fetchAccount(address);
    renderAccountData(container, content, account, address);
  } catch (e) {
    content.innerHTML = `
      <div class="card" style="text-align:center;">
        <p style="color:var(--red);margin-bottom:12px;">잔액 조회 실패</p>
        <p style="color:var(--text2);font-size:12px;">주소를 다시 확인하거나 테스트넷에 계정이 있는지 확인해주세요</p>
        <button class="btn-outline btn-sm" style="margin-top:12px;width:auto;"
          onclick="this.closest('#page-dashboard') && window.__reloadDash?.()">다시 시도</button>
      </div>
    `;
  }

  window.__reloadDash = () => loadWallet(container, address);
}

function renderAccountData(container, content, account, address) {
  const subExpiry = getSubscriptionExpiry();
  const subText   = isSubscribed()
    ? `구독 중 (${new Date(subExpiry).toLocaleDateString()} 만료)`
    : '무료 (하루 3회)';

  content.innerHTML = `
    <!-- Pi 잔액 -->
    <div class="card">
      <div class="card-title">테스트 Pi 잔액</div>
      <div style="font-size:32px;font-weight:700;color:var(--accent);">${formatPi(account.pi)}</div>
      <div style="margin-top:4px;font-size:12px;color:var(--text2);word-break:break-all;">${address}</div>
      <div style="margin-top:8px;">
        <span class="badge ${isSubscribed() ? 'badge-green' : 'badge-yellow'}">${subText}</span>
      </div>
    </div>

    <!-- 토큰 보유량 -->
    <div class="card">
      <div class="card-title">보유 토큰</div>
      ${account.tokens.length === 0
        ? '<p style="color:var(--text2);font-size:13px;">보유 토큰 없음</p>'
        : account.tokens.map(t => `
            <div class="stat-row">
              <span class="stat-label">${t.asset_code ?? t.asset_type}</span>
              <span class="stat-value">${formatToken(t.balance, t.asset_code, 4)}</span>
            </div>`).join('')
      }
    </div>

    <!-- LP 예치 현황 -->
    <div class="card">
      <div class="card-title">LP 예치 현황 (묶인 자산)</div>
      ${account.lpShares.length === 0
        ? '<p style="color:var(--text2);font-size:13px;">예치된 LP 없음</p>'
        : account.lpShares.map(s => `
            <div class="stat-row">
              <span class="stat-label" style="font-size:11px;word-break:break-all;">${s.liquidity_pool_id?.slice(0, 12)}...</span>
              <span class="stat-value">${formatToken(s.balance, '주식', 6)}</span>
            </div>`).join('')
      }
    </div>

    <button class="btn-outline btn-sm" onclick="window.__reloadDash?.()">새로고침</button>
  `;
}
