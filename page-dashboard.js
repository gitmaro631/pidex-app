import { fetchPools, fetchRecommendedFee, fetchTradeStats } from './horizon.js';
import { formatLargeNum } from './util-format.js';
import { showLoading, hideLoading } from './app.js';

function setupPullToRefresh(container, onRefresh) {
  const scrollEl = document.querySelector('.page-container');

  // 중복 등록 방지
  if (scrollEl._ptrAttached) return;
  scrollEl._ptrAttached = true;

  let indicator = container.querySelector('.ptr-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'ptr-indicator';
    indicator.innerHTML = '<span class="ptr-arrow">↓</span><span class="ptr-text">당겨서 새로고침 Pull to refresh</span>';
    container.prepend(indicator);
  }

  let startY = 0;
  let pulling = false;
  const THRESHOLD = 70;

  scrollEl.addEventListener('touchstart', e => {
    if (scrollEl.scrollTop === 0) startY = e.touches[0].clientY;
  }, { passive: true });

  scrollEl.addEventListener('touchmove', e => {
    if (!startY) return;
    const dist = e.touches[0].clientY - startY;
    if (dist > 0 && scrollEl.scrollTop === 0) {
      pulling = true;
      const ind = document.querySelector('.ptr-indicator');
      if (!ind) return;
      const progress = Math.min(dist / THRESHOLD, 1);
      ind.style.height = `${Math.min(dist * 0.5, 50)}px`;
      ind.style.opacity = progress;
      const arrow = ind.querySelector('.ptr-arrow');
      if (arrow) arrow.style.transform = `rotate(${progress * 180}deg)`;
    }
  }, { passive: true });

  scrollEl.addEventListener('touchend', e => {
    if (!startY) return;
    const dist = e.changedTouches[0].clientY - startY;
    const ind  = document.querySelector('.ptr-indicator');
    if (pulling && dist >= THRESHOLD) {
      if (ind) { ind.innerHTML = '<span class="ptr-spinner"></span>'; ind.style.height = '44px'; }
      onRefresh();
    } else {
      if (ind) { ind.style.height = '0'; ind.style.opacity = '0'; }
    }
    startY = 0;
    pulling = false;
  }, { passive: true });
}

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">PiDEX 현황 <span class="en">Network Overview</span></h2>
      <div class="dash-loading">풀 데이터 로드 중... Loading pool data...</div>
    </div>
  `;

  setupPullToRefresh(container, () => renderDashboard(container));

  try {
    showLoading('PiDEX 데이터 로드 중...');
    const [pools, gasFee, tradeStats] = await Promise.all([fetchPools(), fetchRecommendedFee(), fetchTradeStats()]);
    hideLoading();

    const piPools     = pools.filter(p => p.assetAId === 'Pi' || p.assetBId === 'Pi');
    const tokenSet    = new Set();
    pools.forEach(p => { tokenSet.add(p.assetAId); tokenSet.add(p.assetBId); });
    tokenSet.delete('Pi');
    const uniqueTokens = tokenSet.size;
    const avgFee      = pools.length
      ? (pools.reduce((s, p) => s + p.fee_bp, 0) / pools.length / 100).toFixed(2)
      : 0;
    const totalLiq = pools.reduce((s, p) => s + p.reserveA + p.reserveB, 0);

    const topLiq = [...pools].sort((a, b) =>
      Math.min(b.reserveA, b.reserveB) - Math.min(a.reserveA, a.reserveB)
    ).slice(0, 10);

    container.querySelector('.page-content').innerHTML = `
      <h2 class="page-title">PiDEX 현황 <span class="en">Network Overview</span></h2>

      <div class="dash-section-title">네트워크 <span class="en">Network</span></div>
      <div class="dash-grid">
        <div class="dash-stat-card">
          <div class="dash-stat-val">${pools.length.toLocaleString()}</div>
          <div class="dash-stat-label">총 풀 수 <span class="en">Total Pools</span></div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-val">${piPools.length.toLocaleString()}</div>
          <div class="dash-stat-label">Pi 포함 풀 <span class="en">Pi Pairs</span></div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-val">${uniqueTokens.toLocaleString()}</div>
          <div class="dash-stat-label">고유 토큰 <span class="en">Unique Tokens</span></div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-val">${avgFee}%</div>
          <div class="dash-stat-label">AMM 수수료 <span class="en">Avg AMM Fee</span></div>
        </div>
      </div>

      <div class="dash-section-title">거래 현황 <span class="en">Trading Activity</span></div>
      <div class="card dash-trade-table">
        <div class="trade-row trade-header">
          <span>날짜 <span class="en">Date</span></span>
          <span>거래 건수 <span class="en">Trades</span></span>
          <span>Pi 거래량 <span class="en">Volume</span></span>
        </div>
        ${[
          { label: '오늘 Today',     k: 'today'     },
          { label: '어제 Yesterday', k: 'yesterday' },
          { label: '그저께 D-2',     k: 'dayBefore' },
        ].map(r => `
          <div class="trade-row">
            <span class="trade-period">${r.label}</span>
            <span>${tradeStats.counts[r.k].toLocaleString()}</span>
            <span>${formatLargeNum(tradeStats.volumes[r.k])}</span>
          </div>`).join('')}
      </div>

      <div class="dash-section-title">유동성 <span class="en">Liquidity</span></div>
      <div class="dash-grid dash-grid-2">
        <div class="dash-stat-card">
          <div class="dash-stat-val">${formatLargeNum(totalLiq)}</div>
          <div class="dash-stat-label">전체 유동성 합산 <span class="en">Total Liquidity</span></div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-val">${(gasFee / 10000000).toFixed(5)} Pi</div>
          <div class="dash-stat-label">권장 가스비 <span class="en">Recommended Gas</span></div>
        </div>
      </div>
      <div class="card dash-rank-card">
        <div class="card-title">유동성 상위 풀 <span class="en">Top Pools by Liquidity</span></div>
        ${topLiq.map((p, i) => `
          <div class="rank-row">
            <span class="rank-num">${i + 1}</span>
            <span class="rank-name">${p.assetA} / ${p.assetB}</span>
            <span class="rank-val">${formatLargeNum(Math.min(p.reserveA, p.reserveB))}</span>
          </div>`).join('')}
      </div>

      <p class="dash-updated">데이터 기준 시각: ${new Date().toLocaleTimeString()} <span class="en">as of</span></p>
    `;
  } catch (e) {
    container.querySelector('.page-content').innerHTML = `
      <h2 class="page-title">PiDEX 현황 <span class="en">Network Overview</span></h2>
      <div class="card"><p class="empty-msg" style="color:var(--red)">데이터 로드 실패: ${e.message}</p></div>
    `;
  } finally {
    hideLoading();
  }
}
