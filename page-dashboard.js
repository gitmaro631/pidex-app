import { fetchPools, fetchRecommendedFee } from './horizon.js';
import { formatLargeNum } from './util-format.js';
import { showLoading, hideLoading } from './app.js';
import { t } from './i18n.js';

function setupPullToRefresh(container, onRefresh) {
  const scrollEl = document.querySelector('.page-container');

  // 중복 등록 방지
  if (scrollEl._ptrAttached) return;
  scrollEl._ptrAttached = true;

  let indicator = container.querySelector('.ptr-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'ptr-indicator';
    indicator.innerHTML = `<span class="ptr-arrow">↓</span><span class="ptr-text">${t('ptr_pull')}</span>`;
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
      <h2 class="page-title">${t('dash_title')}</h2>
      <div class="dash-loading">${t('dash_loading')}</div>
    </div>
  `;

  setupPullToRefresh(container, () => renderDashboard(container));

  try {
    showLoading(t('loading_pidex'));
    const [pools, gasFee] = await Promise.all([fetchPools(), fetchRecommendedFee()]);
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
      <h2 class="page-title">${t('dash_title')}</h2>

      <div class="dash-section-title">${t('dash_network')}</div>
      <div class="dash-grid">
        <div class="dash-stat-card">
          <div class="dash-stat-val">${pools.length.toLocaleString()}</div>
          <div class="dash-stat-label">${t('dash_total_pools')}</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-val">${piPools.length.toLocaleString()}</div>
          <div class="dash-stat-label">${t('dash_pi_pairs')}</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-val">${uniqueTokens.toLocaleString()}</div>
          <div class="dash-stat-label">${t('dash_tokens')}</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-val">${avgFee}%</div>
          <div class="dash-stat-label">${t('dash_amm_fee')}</div>
        </div>
      </div>

      <div class="dash-section-title">${t('dash_liquidity')}</div>
      <div class="dash-grid dash-grid-2">
        <div class="dash-stat-card">
          <div class="dash-stat-val">${formatLargeNum(totalLiq)}</div>
          <div class="dash-stat-label">${t('dash_total_liq')}</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-val">${(gasFee / 10000000).toFixed(5)} Pi</div>
          <div class="dash-stat-label">${t('dash_gas')}</div>
        </div>
      </div>
      <div class="card dash-rank-card">
        <div class="card-title">${t('dash_top_pools')}</div>
        ${topLiq.map((p, i) => `
          <div class="rank-row">
            <span class="rank-num">${i + 1}</span>
            <span class="rank-name">${p.assetA} / ${p.assetB}</span>
            <span class="rank-val">${formatLargeNum(Math.min(p.reserveA, p.reserveB))}</span>
          </div>`).join('')}
      </div>

      <p class="dash-updated">${t('dash_updated')}: ${new Date().toLocaleTimeString()}</p>
    `;


  } catch (e) {
    container.querySelector('.page-content').innerHTML = `
      <h2 class="page-title">${t('dash_title')}</h2>
      <div class="card"><p class="empty-msg" style="color:var(--red)">${t('dash_fail')}: ${e.message}</p></div>
    `;
  } finally {
    hideLoading();
  }
}
