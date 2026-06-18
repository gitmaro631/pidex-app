import { fetchPools } from './horizon.js';
import { ammOut, priceImpact } from './amm.js';
import { formatToken, formatPctShort } from './util-format.js';
import { showToast } from './app.js';

let pools = [];

export async function renderSwap(container) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">스왑 시뮬레이터 <span class="en">Swap Simulator</span></h2>
      <div class="card">
        <div class="swap-box">
          <div class="form-label">보내는 토큰 <span class="en">Send</span></div>
          <div style="display:flex;gap:8px;">
            <select class="form-input" id="swap-from-asset" style="flex:1;"></select>
            <input type="number" class="form-input" id="swap-from-amount" placeholder="수량 Amount" style="flex:1;" min="0" step="any"/>
          </div>
        </div>
        <div class="swap-arrow" id="btn-swap-dir" style="cursor:pointer;" title="방향 전환">⇅</div>
        <div class="swap-box">
          <div class="form-label">받는 토큰 <span class="en">Receive</span></div>
          <div style="display:flex;gap:8px;">
            <select class="form-input" id="swap-to-asset" style="flex:1;"></select>
            <input type="text" class="form-input swap-receive-amount" id="swap-to-amount"
              placeholder="기대 수량" readonly style="flex:1;color:var(--green);font-weight:600;" />
          </div>
        </div>
      </div>
      <div id="swap-preview" class="card hidden">
        <div class="card-title">스왑 미리보기 <span class="en">Swap Preview</span></div>
        <div id="swap-preview-content"></div>
      </div>
    </div>
  `;

  try {
    pools = await fetchPools(2000);
    const assets = new Set(['Pi']);
    pools.forEach(p => { assets.add(p.assetA); assets.add(p.assetB); });
    const fromSel = container.querySelector('#swap-from-asset');
    const toSel   = container.querySelector('#swap-to-asset');
    [...assets].forEach(a => {
      fromSel.innerHTML += `<option value="${a}">${a}</option>`;
      toSel.innerHTML   += `<option value="${a}">${a}</option>`;
    });
    toSel.selectedIndex = 1;
  } catch { showToast('토큰 목록 조회 실패', 'error'); }

  const update = () => calcSwapPreview(container);
  container.querySelector('#swap-from-asset').addEventListener('change', update);
  container.querySelector('#swap-to-asset').addEventListener('change', update);
  container.querySelector('#swap-from-amount').addEventListener('input', update);
  container.querySelector('#btn-swap-dir').addEventListener('click', () => {
    const fromSel = container.querySelector('#swap-from-asset');
    const toSel   = container.querySelector('#swap-to-asset');
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value   = tmp;
    container.querySelector('#swap-to-amount').value = '';
    update();
  });
}

function calcSwapPreview(container) {
  const from   = container.querySelector('#swap-from-asset').value;
  const to     = container.querySelector('#swap-to-asset').value;
  const amount = parseFloat(container.querySelector('#swap-from-amount').value);
  const preview = container.querySelector('#swap-preview');

  const toAmountEl = container.querySelector('#swap-to-amount');
  if (!amount || amount <= 0 || from === to) {
    preview.classList.add('hidden');
    toAmountEl.value = '';
    return;
  }

  const pool = pools.find(p =>
    (p.assetA === from && p.assetB === to) || (p.assetA === to && p.assetB === from)
  );
  if (!pool) {
    preview.classList.add('hidden');
    toAmountEl.value = '풀 없음';
    return;
  }

  const poolIn  = pool.assetA === from ? pool.reserveA : pool.reserveB;
  const poolOut = pool.assetA === from ? pool.reserveB : pool.reserveA;
  const receive = ammOut(poolIn, poolOut, amount);
  const impact  = priceImpact(poolIn, amount);
  const rate    = receive / amount;

  toAmountEl.value = receive.toFixed(6);

  preview.classList.remove('hidden');
  preview.querySelector('#swap-preview-content').innerHTML = `
    <div class="stat-row"><span class="stat-label">예상 수령 <span class="en">Est. Receive</span></span><span class="stat-value">${formatToken(receive, to)}</span></div>
    <div class="stat-row"><span class="stat-label">환율 <span class="en">Rate</span></span><span class="stat-value">1 ${from} = ${rate.toFixed(6)} ${to}</span></div>
    <div class="stat-row"><span class="stat-label">AMM 수수료 <span class="en">AMM Fee</span></span><span class="stat-value">0.3%</span></div>
    <div class="stat-row"><span class="stat-label">가격충격 <span class="en">Price Impact</span></span><span class="stat-value ${impact > 1 ? 'val-yellow' : ''}">${formatPctShort(impact)}</span></div>
  `;
}
