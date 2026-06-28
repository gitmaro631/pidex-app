import { fetchPools } from './horizon.js';
import { findArbitragePaths } from './amm.js';
import { formatPct, pctClass } from './util-format.js';
import { canUseArbitrage, incrementArbCount, remainingFreeUses, isSubscribed } from './util-storage.js';
import { showLoading, hideLoading, showToast } from './app.js';
import { t } from './i18n.js';

export function renderArbitrage(container) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">${t('arb_title')}</h2>

      <div class="card">
        <div class="card-title">${t('arb_settings')}</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">${t('arb_input')}</label>
            <div class="input-unit-row">
              <input type="number" class="form-input" id="arb-input" value="10" min="0.01" step="0.1" />
              <span class="unit-label">Pi</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t('arb_target')}</label>
            <div class="input-unit-row">
              <input type="number" class="form-input" id="arb-target" value="1.0" min="0" step="0.1" />
              <span class="unit-label">%</span>
            </div>
            <p class="form-hint">${t('arb_target_hint')}</p>
          </div>
          <div class="form-group">
            <label class="form-label">${t('arb_min')}</label>
            <div class="input-unit-row">
              <input type="number" class="form-input" id="arb-min" value="0.5" min="0" step="0.1" />
              <span class="unit-label">%</span>
            </div>
            <p class="form-hint">${t('arb_min_hint')}</p>
          </div>
          <div class="form-group">
            <label class="form-label">${t('arb_liq')}</label>
            <div class="input-unit-row">
              <input type="number" class="form-input" id="arb-liquidity" value="100" min="0" step="100" />
              <span class="unit-label">Pi</span>
            </div>
            <p class="form-hint">${t('arb_liq_hint')}</p>
          </div>
        </div>
        <button id="arb-scan-btn" class="btn-primary">${t('arb_scan_btn')}</button>
      </div>

      <div id="arb-quota" class="quota-bar"></div>
      <div id="arb-results"></div>
    </div>
  `;

  updateQuota(container);
  container.querySelector('#arb-scan-btn').addEventListener('click', () => runScan(container));
}

function updateQuota(container) {
  const quotaEl  = container.querySelector('#arb-quota');
  const scanBtn  = container.querySelector('#arb-scan-btn');
  if (!quotaEl) return;
  if (isSubscribed()) {
    quotaEl.innerHTML = `<span class="quota-ok">⭐ ${t('arb_subscribed')}</span>`;
    scanBtn.disabled = false;
  } else {
    const remaining = remainingFreeUses();
    const canUse    = remaining > 0;
    quotaEl.innerHTML = `<span class="${canUse ? 'quota-ok' : 'quota-over'}">
      ${t('arb_remaining')}: ${remaining} / 100
      ${!canUse ? ` — ${t('arb_resets')}` : ''}
    </span>`;
    scanBtn.disabled = !canUse;
  }
}

async function runScan(container) {
  if (!canUseArbitrage()) {
    showToast(t('arb_over'), 'error');
    return;
  }
  const inputAmt     = parseFloat(container.querySelector('#arb-input').value)     || 10;
  const targetPct    = parseFloat(container.querySelector('#arb-target').value)    || 1.0;
  const minPct       = parseFloat(container.querySelector('#arb-min').value)       || 0.5;
  const minLiquidity = parseFloat(container.querySelector('#arb-liquidity').value) || 0;

  const resultsEl = container.querySelector('#arb-results');
  resultsEl.innerHTML = `<p class="scan-msg">${t('arb_scanning')}</p>`;

  try {
    showLoading(t('arb_loading_pools'));
    const allPools = await fetchPools();
    hideLoading();
    incrementArbCount();
    updateQuota(container);

    const filteredPools = minLiquidity > 0
      ? allPools.filter(p => Math.min(p.reserveA, p.reserveB) >= minLiquidity)
      : allPools;

    if (filteredPools.length === 0) {
      resultsEl.innerHTML = `
        <div class="card">
          <p class="empty-msg">${t('arb_no_liq').replace('\n', '<br>')}</p>
          <p class="form-hint">${t('arb_total_pools')}: ${allPools.length}</p>
        </div>`;
      return;
    }

    const paths     = findArbitragePaths(filteredPools, inputAmt, 0.01, 0);
    const displayed = paths.filter(p => p.netPct >= targetPct);
    const positiveAll = paths.filter(p => p.netPct > 0);

    const header = `<div class="results-summary">
      ${t('arb_total_pools')} ${allPools.length} → ${t('arb_liq_pass')} ${filteredPools.length} → ${t('arb_paths')} ${paths.length} ${t('arb_scanned')}
    </div>`;

    if (displayed.length === 0) {
      resultsEl.innerHTML = header + `
        <div class="card">
          <p class="empty-msg">${t('arb_no_result')} (≥ ${targetPct}%)</p>
          ${positiveAll.length > 0
            ? `<p class="form-hint">${t('arb_found')} ${positiveAll.length} — ${t('arb_lower')}</p>`
            : `<p class="form-hint">${t('arb_none')}</p>`}
        </div>`;
      return;
    }

    resultsEl.innerHTML = header + displayed.map(p => renderPath(p, inputAmt, minPct)).join('');
  } catch (e) {
    resultsEl.innerHTML = `<div class="card"><p class="empty-msg" style="color:var(--red)">${t('arb_error')}: ${e.message}</p></div>`;
    showToast(e.message, 'error');
  } finally {
    hideLoading();
  }
}

function renderPath(p, inputAmt, minPct) {
  const recommend = p.netPct >= minPct;
  const gasPct    = (0.01 / inputAmt) * 100;

  return `
    <div class="card path-card ${recommend ? '' : 'path-low'}">
      <div class="path-route">${p.route}</div>
      <div class="path-metrics">
        <div class="metric-row">
          <span class="metric-label">${t('arb_amm_fee')}</span>
          <span class="metric-val val-red">-${p.ammFeePct.toFixed(3)}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">${t('arb_gas')}</span>
          <span class="metric-val val-red">-${gasPct.toFixed(3)}% (0.01 Pi)</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">${t('arb_impact')}</span>
          <span class="metric-val val-red">-${p.totalImpact.toFixed(3)}%</span>
        </div>
        <div class="metric-row metric-net">
          <span class="metric-label">${t('arb_net')}</span>
          <span class="metric-val ${pctClass(p.netPct)}">${formatPct(p.netPct)}</span>
        </div>
      </div>
      <div class="path-footer">
        <span class="path-detail">${inputAmt} Pi → ${p.returned.toFixed(4)} Pi
          (${p.netPnl >= 0 ? '+' : ''}${p.netPnl.toFixed(4)} Pi)</span>
        ${recommend
          ? `<span class="badge badge-good">${t('arb_scan_btn')}</span>`
          : `<span class="badge badge-low">${t('arb_caution')}</span>`}
      </div>
    </div>`;
}
