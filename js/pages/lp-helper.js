// LP 예치 도우미 페이지

import { fetchPools } from '../horizon.js';
import { calcLPRatio, ammOut } from '../amm.js';
import { formatPi, formatToken, formatLargeNum, formatPctShort } from '../utils/format.js';
import { submitTransaction } from '../horizon.js';
import { buildSwapTransaction, buildLPDepositTransaction } from '../stellar.js';
import { showLoading, hideLoading, showToast } from '../app.js';

let allPools = [];
let selectedPool = null;
let currentFilter = 'volume';

export async function renderLPHelper(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title">LP 예치 도우미</div>
      <p style="color:var(--text2);font-size:13px;">풀을 선택하고 투입할 Pi를 입력하면, 비율에 맞게 자동 스왑 후 예치합니다.</p>
    </div>

    <!-- 풀 필터 -->
    <div class="filter-tabs">
      <button class="filter-tab active" data-filter="volume">거래 활발</button>
      <button class="filter-tab" data-filter="liquidity">유동성 풍부</button>
      <button class="filter-tab" data-filter="stable">비율 안정</button>
    </div>

    <div id="pool-list">
      <p style="color:var(--text2);text-align:center;padding:24px;">풀 목록 불러오는 중...</p>
    </div>

    <!-- 예치 입력 -->
    <div id="lp-form" class="card hidden">
      <div class="card-title" id="lp-pool-name">선택된 풀</div>
      <div id="lp-pool-ratio" style="font-size:13px;color:var(--text2);margin-bottom:12px;"></div>
      <div class="form-group">
        <label class="form-label">투입할 총 Pi</label>
        <input type="number" class="form-input" id="lp-amount" placeholder="예: 100" min="0" step="1" />
      </div>
      <div id="lp-preview" class="hidden" style="margin-bottom:12px;"></div>
      <button class="btn-primary" id="btn-lp-deposit">예치하기</button>
    </div>
  `;

  bindFilterTabs(container);
  await loadPools(container);
}

function bindFilterTabs(container) {
  container.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderPoolList(container);
    });
  });
}

async function loadPools(container) {
  try {
    allPools = await fetchPools(50);
    renderPoolList(container);
  } catch {
    container.querySelector('#pool-list').innerHTML =
      '<p style="color:var(--red);text-align:center;padding:24px;">풀 목록 조회 실패</p>';
  }
}

function sortedPools() {
  const p = [...allPools];
  if (currentFilter === 'volume')    return p.sort((a, b) => b.tradeCount - a.tradeCount);
  if (currentFilter === 'liquidity') return p.sort((a, b) => (b.reserveA + b.reserveB) - (a.reserveA + a.reserveA));
  if (currentFilter === 'stable')    return p.sort((a, b) => {
    const ratioA = a.reserveA / (a.reserveA + a.reserveB);
    const ratioB = b.reserveA / (b.reserveA + b.reserveB);
    return Math.abs(ratioA - 0.5) - Math.abs(ratioB - 0.5); // 50:50에 가까운 순
  });
  return p;
}

function renderPoolList(container) {
  const list  = container.querySelector('#pool-list');
  const pools = sortedPools().slice(0, 20);

  if (pools.length === 0) {
    list.innerHTML = '<p style="color:var(--text2);text-align:center;padding:24px;">풀 없음</p>';
    return;
  }

  list.innerHTML = pools.map(pool => {
    const totalLiq  = pool.reserveA + pool.reserveB;
    const ratioA    = ((pool.reserveA / totalLiq) * 100).toFixed(1);
    const ratioB    = ((pool.reserveB / totalLiq) * 100).toFixed(1);
    const feePct    = (pool.fee_bp / 100).toFixed(1);
    return `
      <div class="pool-card" data-pool-id="${pool.id}">
        <div class="pool-name">${pool.assetA} / ${pool.assetB}</div>
        <div class="pool-stats">
          <span class="pool-stat">유동성: <span>${formatLargeNum(totalLiq)}</span></span>
          <span class="pool-stat">비율: <span>${ratioA}% : ${ratioB}%</span></span>
          <span class="pool-stat">수수료: <span>${feePct}%</span></span>
          <span class="pool-stat">거래수: <span>${pool.tradeCount.toLocaleString()}</span></span>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.pool-card').forEach(card => {
    card.addEventListener('click', () => {
      list.querySelectorAll('.pool-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedPool = allPools.find(p => p.id === card.dataset.poolId);
      showLPForm(container);
    });
  });
}

function showLPForm(container) {
  const form = container.querySelector('#lp-form');
  form.classList.remove('hidden');
  container.querySelector('#lp-pool-name').textContent = `${selectedPool.assetA} / ${selectedPool.assetB} 풀 예치`;
  const ratio = (selectedPool.reserveA / selectedPool.reserveB).toFixed(4);
  container.querySelector('#lp-pool-ratio').textContent = `현재 풀 비율: 1 ${selectedPool.assetA} = ${ratio} ${selectedPool.assetB}`;

  const input = container.querySelector('#lp-amount');
  input.addEventListener('input', () => updateLPPreview(container, parseFloat(input.value)));

  container.querySelector('#btn-lp-deposit').addEventListener('click', () => executeLPDeposit(container));
}

function updateLPPreview(container, totalPi) {
  const preview = container.querySelector('#lp-preview');
  if (!totalPi || totalPi <= 0 || !selectedPool) { preview.classList.add('hidden'); return; }

  const { amountA, amountB, ratioA, ratioB } = calcLPRatio(selectedPool, totalPi);
  preview.classList.remove('hidden');
  preview.innerHTML = `
    <div class="card" style="background:var(--bg3);margin:0;">
      <div class="card-title">예치 미리보기</div>
      <div class="stat-row"><span class="stat-label">${selectedPool.assetA}</span><span class="stat-value">${formatToken(amountA, selectedPool.assetA)}</span></div>
      <div class="stat-row"><span class="stat-label">${selectedPool.assetB}</span><span class="stat-value">${formatToken(amountB, selectedPool.assetB)}</span></div>
      <div class="stat-row"><span class="stat-label">비율</span><span class="stat-value">${(ratioA*100).toFixed(1)}% / ${(ratioB*100).toFixed(1)}%</span></div>
    </div>
  `;
}

async function executeLPDeposit(container) {
  const amount = parseFloat(container.querySelector('#lp-amount').value);
  if (!amount || amount <= 0) { showToast('금액을 입력해주세요', 'error'); return; }
  if (!selectedPool) { showToast('풀을 선택해주세요', 'error'); return; }
  showToast('지갑 서명이 필요합니다 (Pi Browser에서 확인)');
  // 실제 서명은 Pi Browser + Stellar SDK 키로 처리
  // 여기서는 흐름 확인용 알림만 표시
}
