import { fetchPools, fetchRecommendedFee } from './horizon.js';
import { ammOut, priceImpact } from './amm.js';
import { formatToken, formatPctShort } from './util-format.js';
import { showToast } from './app.js';
import { t } from './i18n.js';

const GAS_PI = 0.00001;

let pools   = [];
let gasFee  = GAS_PI;

export async function renderSwap(container) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">${t('swap_title')}</h2>

      <div class="card">
        <div class="swap-box">
          <div class="form-label">${t('swap_send')}</div>
          <div style="display:flex;gap:8px;">
            <select class="form-input" id="swap-from-asset" style="flex:1;"></select>
            <input type="number" class="form-input" id="swap-from-amount"
              placeholder="${t('swap_amount')}" style="flex:1;" min="0" step="any"/>
          </div>
        </div>
        <div class="swap-arrow" id="btn-swap-dir" style="cursor:pointer;" title="${t('swap_dir')}">⇅</div>
        <div class="swap-box">
          <div class="form-label">${t('swap_receive')}</div>
          <select class="form-input" id="swap-to-asset"></select>
        </div>
      </div>

      <div id="swap-breakdown" class="card hidden">
        <div class="card-title">${t('swap_breakdown')}</div>
        <div id="swap-breakdown-content"></div>
      </div>

      <h2 class="page-title" style="margin-top:20px;">${t('lpsplit_title')}</h2>
      <div class="card">
        <p class="form-hint">${t('lpsplit_hint')}</p>
        <div class="form-group">
          <label class="form-label">${t('lpsplit_token')}</label>
          <div style="display:flex;gap:8px;">
            <select class="form-input" id="lp-split-token" style="flex:1;"></select>
            <input type="number" class="form-input" id="lp-split-amount"
              placeholder="${t('swap_amount')}" style="flex:1;" min="0" step="any"/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('lpsplit_target')}</label>
          <select class="form-input" id="lp-split-target"></select>
        </div>
        <div class="form-group">
          <label class="form-label">
            ${t('lpsplit_pct')}
            <span id="lp-split-pct-label" style="color:var(--accent);font-weight:700;margin-left:8px;">50%</span>
          </label>
          <input type="range" id="lp-split-pct" min="1" max="99" value="50"
            style="width:100%;accent-color:var(--accent);" />
        </div>
      </div>

      <div id="lp-split-breakdown" class="card hidden">
        <div class="card-title">${t('lpsplit_result')}</div>
        <div id="lp-split-content"></div>
      </div>
    </div>
  `;

  try {
    [pools, gasFee] = await Promise.all([fetchPools(2000), fetchRecommendedFee()]);
    gasFee = gasFee / 10000000; // stroops → Pi

    const assets = [...new Set(['Pi', ...pools.map(p => p.assetA), ...pools.map(p => p.assetB)])];
    ['#swap-from-asset','#swap-to-asset','#lp-split-token','#lp-split-target'].forEach(sel => {
      const el = container.querySelector(sel);
      assets.forEach(a => { el.innerHTML += `<option value="${a}">${a}</option>`; });
    });
    container.querySelector('#swap-to-asset').selectedIndex = 1;
    container.querySelector('#lp-split-target').selectedIndex = 1;
  } catch { showToast(t('swap_token_fail'), 'error'); }

  // 스왑 이벤트
  const updateSwap = () => calcSwapBreakdown(container);
  container.querySelector('#swap-from-asset').addEventListener('change', updateSwap);
  container.querySelector('#swap-to-asset').addEventListener('change', updateSwap);
  container.querySelector('#swap-from-amount').addEventListener('input', updateSwap);
  container.querySelector('#btn-swap-dir').addEventListener('click', () => {
    const fromSel = container.querySelector('#swap-from-asset');
    const toSel   = container.querySelector('#swap-to-asset');
    const tmp = fromSel.value; fromSel.value = toSel.value; toSel.value = tmp;
    updateSwap();
  });

  // LP Split 이벤트
  const updateSplit = () => calcLPSplit(container);
  container.querySelector('#lp-split-token').addEventListener('change', updateSplit);
  container.querySelector('#lp-split-target').addEventListener('change', updateSplit);
  container.querySelector('#lp-split-amount').addEventListener('input', updateSplit);
  container.querySelector('#lp-split-pct').addEventListener('input', function () {
    container.querySelector('#lp-split-pct-label').textContent = `${this.value}%`;
    updateSplit();
  });
}

function findPool(from, to) {
  return pools.find(p =>
    (p.assetA === from && p.assetB === to) || (p.assetA === to && p.assetB === from)
  );
}

function calcSwapBreakdown(container) {
  const from    = container.querySelector('#swap-from-asset').value;
  const to      = container.querySelector('#swap-to-asset').value;
  const amount  = parseFloat(container.querySelector('#swap-from-amount').value);
  const breakEl = container.querySelector('#swap-breakdown');

  if (!amount || amount <= 0 || from === to) { breakEl.classList.add('hidden'); return; }

  const pool = findPool(from, to);
  if (!pool) {
    breakEl.classList.remove('hidden');
    container.querySelector('#swap-breakdown-content').innerHTML =
      `<p class="empty-msg">${t('swap_no_pool')}</p>`;
    return;
  }

  const feePct    = pool.fee_bp / 10000;
  const feeAmt    = amount * feePct;
  const netSend   = amount - feeAmt;
  const poolIn    = pool.assetA === from ? pool.reserveA : pool.reserveB;
  const poolOut   = pool.assetA === from ? pool.reserveB : pool.reserveA;
  const receive   = ammOut(poolIn, poolOut, amount, feePct);
  const impact    = priceImpact(poolIn, amount, feePct);
  const rate      = receive / netSend;
  const impactCls = impact > 2 ? 'val-red' : impact > 0.5 ? 'val-yellow' : 'val-green';

  breakEl.classList.remove('hidden');
  container.querySelector('#swap-breakdown-content').innerHTML = `
    <div class="stat-row">
      <span class="stat-label">${t('swap_send_lbl')}</span>
      <span class="stat-value">${formatToken(amount, from)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">${t('swap_amm_fee')} (${(feePct*100).toFixed(2)}%)</span>
      <span class="stat-value val-red">− ${formatToken(feeAmt, from)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">${t('swap_gas')}</span>
      <span class="stat-value val-red">− ${gasFee.toFixed(5)} Pi</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">${t('swap_impact')}</span>
      <span class="stat-value ${impactCls}">${formatPctShort(impact)}</span>
    </div>
    <div class="swap-divider"></div>
    <div class="stat-row">
      <span class="stat-label">${t('swap_net_in')}</span>
      <span class="stat-value">${formatToken(netSend, from)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">${t('swap_recv_lbl')}</span>
      <span class="stat-value" style="color:var(--green);font-weight:700;">${formatToken(receive, to)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">${t('swap_rate')}</span>
      <span class="stat-value">1 ${from} ≈ ${rate.toFixed(4)} ${to}</span>
    </div>
  `;
}

function calcLPSplit(container) {
  const from    = container.querySelector('#lp-split-token').value;
  const to      = container.querySelector('#lp-split-target').value;
  const amount  = parseFloat(container.querySelector('#lp-split-amount').value);
  const pct     = parseFloat(container.querySelector('#lp-split-pct').value) / 100;
  const breakEl = container.querySelector('#lp-split-breakdown');

  if (!amount || amount <= 0 || from === to) { breakEl.classList.add('hidden'); return; }

  const pool = findPool(from, to);
  if (!pool) {
    breakEl.classList.remove('hidden');
    container.querySelector('#lp-split-content').innerHTML =
      `<p class="empty-msg">${t('swap_no_pool')}</p>`;
    return;
  }

  const swapAmt   = amount * pct;
  const keepAmt   = amount * (1 - pct);
  const feePct    = pool.fee_bp / 10000;
  const feeAmt    = swapAmt * feePct;
  const poolIn    = pool.assetA === from ? pool.reserveA : pool.reserveB;
  const poolOut   = pool.assetA === from ? pool.reserveB : pool.reserveA;
  const received  = ammOut(poolIn, poolOut, swapAmt, feePct);
  const impact    = priceImpact(poolIn, swapAmt, feePct);
  const impactCls = impact > 2 ? 'val-red' : impact > 0.5 ? 'val-yellow' : 'val-green';

  breakEl.classList.remove('hidden');
  container.querySelector('#lp-split-content').innerHTML = `
    <div class="stat-row">
      <span class="stat-label">${t('lpsplit_total')}</span>
      <span class="stat-value">${formatToken(amount, from)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">${t('lpsplit_portion')} (${(pct*100).toFixed(0)}%)</span>
      <span class="stat-value">${formatToken(swapAmt, from)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">${t('swap_amm_fee')}</span>
      <span class="stat-value val-red">− ${formatToken(feeAmt, from)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">${t('swap_impact')}</span>
      <span class="stat-value ${impactCls}">${formatPctShort(impact)}</span>
    </div>
    <div class="swap-divider"></div>
    <div class="split-result-title">${t('lpsplit_ready')}</div>
    <div class="stat-row">
      <span class="stat-label" style="color:var(--accent);font-weight:600;">${from} ${t('lpsplit_remain')}</span>
      <span class="stat-value" style="color:var(--accent);font-weight:700;">${formatToken(keepAmt, from)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label" style="color:var(--accent2);font-weight:600;">${to} ${t('lpsplit_received')}</span>
      <span class="stat-value" style="color:var(--accent2);font-weight:700;">${formatToken(received, to)}</span>
    </div>
  `;
}
