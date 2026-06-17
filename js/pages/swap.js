// 스왑 페이지

import { fetchPools } from '../horizon.js';
import { ammOut, priceImpact } from '../amm.js';
import { formatToken, formatPctShort, pctClass } from '../utils/format.js';
import { showToast } from '../app.js';

let pools = [];
let fromAsset = 'Pi';
let toAsset   = '';

export async function renderSwap(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title">토큰 스왑</div>
    </div>

    <div class="card">
      <!-- 보내는 토큰 -->
      <div class="swap-box">
        <div class="form-label">보내는 토큰</div>
        <div style="display:flex;gap:8px;">
          <select class="form-input" id="swap-from-asset" style="flex:1;"></select>
          <input type="number" class="form-input" id="swap-from-amount" placeholder="수량" style="flex:1;" min="0" step="any"/>
        </div>
      </div>

      <!-- 방향 전환 -->
      <div class="swap-arrow" id="btn-swap-dir" style="cursor:pointer;" title="방향 전환">⇅</div>

      <!-- 받는 토큰 -->
      <div class="swap-box">
        <div class="form-label">받는 토큰</div>
        <select class="form-input" id="swap-to-asset"></select>
      </div>
    </div>

    <!-- 미리보기 -->
    <div id="swap-preview" class="card hidden">
      <div class="card-title">스왑 미리보기</div>
      <div id="swap-preview-content"></div>
    </div>

    <button class="btn-primary" id="btn-swap-confirm" disabled>스왑 실행</button>
  `;

  await loadSwapAssets(container);
  bindSwapEvents(container);
}

async function loadSwapAssets(container) {
  try {
    pools = await fetchPools(50);
    const assets = new Set(['Pi']);
    pools.forEach(p => { assets.add(p.assetA); assets.add(p.assetB); });

    const fromSel = container.querySelector('#swap-from-asset');
    const toSel   = container.querySelector('#swap-to-asset');
    [...assets].forEach(a => {
      fromSel.innerHTML += `<option value="${a}">${a}</option>`;
      toSel.innerHTML   += `<option value="${a}">${a}</option>`;
    });
    toSel.selectedIndex = 1;
    fromAsset = fromSel.value;
    toAsset   = toSel.value;
  } catch {
    showToast('토큰 목록 조회 실패', 'error');
  }
}

function bindSwapEvents(container) {
  const fromSel    = container.querySelector('#swap-from-asset');
  const toSel      = container.querySelector('#swap-to-asset');
  const fromAmount = container.querySelector('#swap-from-amount');
  const dirBtn     = container.querySelector('#btn-swap-dir');

  const update = () => {
    fromAsset = fromSel.value;
    toAsset   = toSel.value;
    calcSwapPreview(container);
  };

  fromSel.addEventListener('change', update);
  toSel.addEventListener('change', update);
  fromAmount.addEventListener('input', () => calcSwapPreview(container));

  dirBtn.addEventListener('click', () => {
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value   = tmp;
    update();
  });

  container.querySelector('#btn-swap-confirm').addEventListener('click', () => executeSwap(container));
}

function findPool(assetA, assetB) {
  return pools.find(p =>
    (p.assetA === assetA && p.assetB === assetB) ||
    (p.assetA === assetB && p.assetB === assetA)
  );
}

function calcSwapPreview(container) {
  const from   = container.querySelector('#swap-from-asset').value;
  const to     = container.querySelector('#swap-to-asset').value;
  const amount = parseFloat(container.querySelector('#swap-from-amount').value);
  const preview = container.querySelector('#swap-preview');
  const btn     = container.querySelector('#btn-swap-confirm');

  if (!amount || amount <= 0 || from === to) { preview.classList.add('hidden'); btn.disabled = true; return; }

  const pool = findPool(from, to);
  if (!pool) { preview.classList.add('hidden'); btn.disabled = true; showToast('직접 거래 가능한 풀 없음', 'error'); return; }

  const poolIn  = pool.assetA === from ? pool.reserveA : pool.reserveB;
  const poolOut = pool.assetA === from ? pool.reserveB : pool.reserveA;
  const receive = ammOut(poolIn, poolOut, amount);
  const impact  = priceImpact(poolIn, amount);
  const rate    = receive / amount;

  preview.classList.remove('hidden');
  preview.querySelector('#swap-preview-content').innerHTML = `
    <div class="stat-row"><span class="stat-label">예상 수령</span><span class="stat-value">${formatToken(receive, to)}</span></div>
    <div class="stat-row"><span class="stat-label">환율</span><span class="stat-value">1 ${from} = ${rate.toFixed(6)} ${to}</span></div>
    <div class="stat-row"><span class="stat-label">AMM 수수료</span><span class="stat-value">0.3%</span></div>
    <div class="stat-row"><span class="stat-label">가격충격</span><span class="stat-value ${impact > 1 ? 'val-yellow' : ''}">${formatPctShort(impact)}</span></div>
  `;
  btn.disabled = false;
}

async function executeSwap(container) {
  showToast('Pi Browser에서 지갑 서명을 확인해주세요.');
  // 실제 트랜잭션 빌드/제출은 Pi Browser + Stellar SDK 연동 필요
}
