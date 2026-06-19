import { fetchAccount, fetchPoolById } from './horizon.js';
import { formatPi, formatToken, formatLargeNum } from './util-format.js';
import { showLoading, hideLoading, rerenderPage } from './app.js';

const STORAGE_KEY = 'stellar_pub_key';

export async function renderWallet(container) {
  const pubKey = localStorage.getItem(STORAGE_KEY);

  container.innerHTML = `
    <div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <h2 class="page-title" style="margin-bottom:0;">지갑 현황 <span class="en">Wallet Overview</span></h2>
        <button class="btn-outline btn-sm" id="btn-wallet-refresh" style="width:auto;padding:0 12px;">↻ 새로고침</button>
      </div>
      <div class="wallet-loading">잔액 조회 중... Loading...</div>
    </div>
  `;
  container.querySelector('#btn-wallet-refresh').addEventListener('click', () => rerenderPage('wallet'));

  if (!pubKey) {
    container.querySelector('.wallet-loading').textContent = '정보 탭에서 공개주소를 등록해주세요.';
    return;
  }

  try {
    showLoading('지갑 데이터 로드 중...');
    const account = await fetchAccount(pubKey);

    const lpDetails = await Promise.allSettled(
      account.lpShares.map(s => fetchPoolById(s.liquidity_pool_id))
    );

    hideLoading();

    const subentries   = account.raw.subentry_count ?? 0;
    const baseReserve  = 0.5;
    const minReserve   = (2 + subentries) * baseReserve;
    const availablePi  = Math.max(0, account.pi - minReserve);

    const tokensWithBalance = account.tokens.filter(t => parseFloat(t.balance) > 0);
    const tokensNoBalance   = account.tokens.filter(t => parseFloat(t.balance) === 0);

    container.querySelector('.page-content').innerHTML = `
      <h2 class="page-title">지갑 현황 <span class="en">Wallet Overview</span></h2>
      <p class="wallet-addr">${pubKey.slice(0,8)}...${pubKey.slice(-8)}</p>

      <div class="dash-section-title">테스트 Pi <span class="en">Test Pi Balance</span></div>
      <div class="card">
        <div class="wallet-pi-row main">
          <span>총 보유 <span class="en">Total</span></span>
          <span class="wallet-pi-val">${formatPi(account.pi)}</span>
        </div>
        <div class="wallet-pi-row">
          <span>사용 가능 <span class="en">Available</span></span>
          <span class="val-green">${formatPi(availablePi)}</span>
        </div>
        <div class="wallet-pi-row">
          <span>최소 예비금 <span class="en">Min Reserve</span>
            <span class="hint-inline">(계정 + 트러스트라인 × 0.5)</span>
          </span>
          <span class="val-red">~${formatPi(minReserve)}</span>
        </div>
      </div>

      ${tokensWithBalance.length > 0 ? `
        <div class="dash-section-title">보유 토큰 <span class="en">Token Balances</span></div>
        <div class="card">
          ${tokensWithBalance.map(t => `
            <div class="wallet-pi-row">
              <span class="token-name">${t.asset_code ?? t.asset_type}
                <span class="token-issuer">${(t.asset_issuer ?? '').slice(0,6)}...</span>
              </span>
              <span>${formatToken(t.balance, t.asset_code)}</span>
            </div>`).join('')}
        </div>` : ''}

      <div class="dash-section-title">LP 예치 현황 <span class="en">LP Positions</span></div>
      ${account.lpShares.length === 0
        ? `<div class="card"><p class="empty-msg">예치된 LP 없음 No LP positions</p></div>`
        : `<div class="card">
            ${account.lpShares.map((s, i) => {
              const poolResult = lpDetails[i];
              const pool = poolResult.status === 'fulfilled' ? poolResult.value : null;
              const pairName = pool ? `${pool.assetA} / ${pool.assetB}` : s.liquidity_pool_id.slice(0, 12) + '...';
              const shareRatio = pool && pool.totalShares > 0
                ? ((parseFloat(s.balance) / pool.totalShares) * 100).toFixed(4)
                : null;
              return `
                <div class="wallet-pi-row lp-row">
                  <div>
                    <div class="token-name">${pairName}</div>
                    ${shareRatio ? `<div class="lp-share-pct">풀 점유율 Pool share: ${shareRatio}%</div>` : ''}
                  </div>
                  <span>${parseFloat(s.balance).toFixed(6)} 지분</span>
                </div>`;
            }).join('')}
          </div>`
      }

      ${account.tokens.length > 0 ? `
        <div class="dash-section-title">연결된 토큰 <span class="en">Trustlines</span></div>
        <div class="card">
          ${account.tokens.map(t => `
            <div class="wallet-pi-row">
              <span class="token-name">${t.asset_code ?? t.asset_type}
                <span class="token-issuer">${(t.asset_issuer ?? '').slice(0,6)}...</span>
              </span>
              <span class="${parseFloat(t.balance) > 0 ? '' : 'val-dim'}">${parseFloat(t.balance) > 0 ? formatToken(t.balance, t.asset_code) : '잔액 없음'}</span>
            </div>`).join('')}
          ${tokensNoBalance.length > 0
            ? `<p class="hint-text">연결만 된 토큰 (잔액 없음) ${tokensNoBalance.length}개 포함</p>`
            : ''}
        </div>` : ''}

      <p class="dash-updated">조회 시각: ${new Date().toLocaleTimeString()}</p>
    `;
  } catch (e) {
    hideLoading();
    container.querySelector('.page-content').innerHTML = `
      <h2 class="page-title">지갑 현황 <span class="en">Wallet Overview</span></h2>
      <div class="card">
        <p class="empty-msg" style="color:var(--red)">조회 실패: ${e.message}</p>
        <p class="form-hint">정보 탭에서 공개주소를 다시 확인해주세요.</p>
      </div>
    `;
  }
}
