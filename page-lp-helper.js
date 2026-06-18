import { fetchPools } from './horizon.js';
import { calcLPRatio } from './amm.js';
import { formatToken, formatLargeNum } from './util-format.js';

let allPools      = [];
let selectedPool  = null;
let currentFilter = 'volume';
let piOnly        = false;
let searchQuery   = '';

export async function renderLPHelper(container) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">LP 계산기 <span class="en">LP Calculator</span></h2>

      <div class="search-row">
        <input type="text" class="form-input" id="lp-search"
          placeholder="코인 검색 Search token (예: USDT)" style="flex:1;" />
        <button class="btn-outline btn-sm" id="btn-search-clear" style="width:auto;padding:0 12px;">✕</button>
      </div>

      <div class="filter-row">
        <div class="filter-tabs">
          <button class="filter-tab active" data-filter="volume">
            거래 활발<br><span class="en-tab">Active</span>
          </button>
          <button class="filter-tab" data-filter="liquidity">
            유동성 높음<br><span class="en-tab">Liquidity</span>
          </button>
          <button class="filter-tab" data-filter="fee">
            수수료 효율<br><span class="en-tab">Fee Yield</span>
          </button>
        </div>
        <button class="toggle-btn ${piOnly ? 'active' : ''}" id="btn-pi-only">
          Pi 포함만<br><span class="en-tab">Pi Pairs</span>
        </button>
      </div>

      <div class="filter-hint" id="filter-hint"></div>

      <div id="pool-list">
        <p style="color:var(--text2);text-align:center;padding:24px;">풀 목록 불러오는 중...</p>
      </div>

      <div id="lp-form" class="card hidden">
        <div class="card-title" id="lp-pool-name">선택된 풀</div>
        <div id="lp-pool-info" style="font-size:12px;color:var(--text2);margin-bottom:12px;"></div>
        <div class="form-group">
          <label class="form-label">투입할 총 Pi <span class="en">Total Pi to Deposit</span></label>
          <div class="input-unit-row">
            <input type="number" class="form-input" id="lp-amount" placeholder="예: 100" min="0" step="1" />
            <span class="unit-label">Pi</span>
          </div>
        </div>
        <div id="lp-preview" class="hidden"></div>
      </div>
    </div>
  `;

  container.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderPoolList(container);
    });
  });

  container.querySelector('#btn-pi-only').addEventListener('click', () => {
    piOnly = !piOnly;
    container.querySelector('#btn-pi-only').classList.toggle('active', piOnly);
    renderPoolList(container);
  });

  container.querySelector('#lp-search').addEventListener('input', function () {
    searchQuery = this.value.trim();
    renderPoolList(container);
  });

  container.querySelector('#btn-search-clear').addEventListener('click', () => {
    searchQuery = '';
    container.querySelector('#lp-search').value = '';
    renderPoolList(container);
  });

  try {
    allPools = await fetchPools(2000);
    renderPoolList(container);
  } catch {
    container.querySelector('#pool-list').innerHTML =
      '<p style="color:var(--red);text-align:center;padding:24px;">풀 목록 조회 실패</p>';
  }
}

const FILTER_HINTS = {
  volume:    '거래 횟수 기준 정렬 — 수수료 수입 기회가 많은 풀',
  liquidity: '양쪽 중 작은 쪽 잔고 기준 — 병목 유동성이 높은 풀',
  fee:       '수수료율 × 거래수 기준 — 누적 수수료 수입이 높은 풀',
};

function sortedPools() {
  let pools = piOnly
    ? allPools.filter(p => p.assetAId === 'Pi' || p.assetBId === 'Pi')
    : [...allPools];

  if (searchQuery) {
    const q = searchQuery.toUpperCase();
    pools = pools.filter(p =>
      p.assetA.toUpperCase().includes(q) || p.assetB.toUpperCase().includes(q)
    );
    // 검색어가 앞쪽에 있을수록 우선 정렬
    const matchScore = p => {
      const a = p.assetA.toUpperCase().indexOf(q);
      const b = p.assetB.toUpperCase().indexOf(q);
      const best = [a, b].filter(i => i >= 0);
      return best.length ? Math.min(...best) : 999;
    };
    pools.sort((a, b) => matchScore(a) - matchScore(b));
  }

  const liq = p => Math.min(p.reserveA, p.reserveB);
  if (currentFilter === 'volume')
    return pools.sort((a, b) => (b.tradeCount - a.tradeCount) || (liq(b) - liq(a)));
  if (currentFilter === 'liquidity')
    return pools.sort((a, b) => liq(b) - liq(a));
  if (currentFilter === 'fee')
    return pools.sort((a, b) => ((b.fee_bp * b.tradeCount) - (a.fee_bp * a.tradeCount)) || (liq(b) - liq(a)));
  return pools;
}

function renderPoolList(container) {
  container.querySelector('#filter-hint').textContent = FILTER_HINTS[currentFilter] ?? '';
  const list  = container.querySelector('#pool-list');
  const pools = sortedPools().slice(0, 30);

  if (pools.length === 0) {
    list.innerHTML = '<p style="color:var(--text2);text-align:center;padding:24px;">조건에 맞는 풀 없음</p>';
    return;
  }

  list.innerHTML = pools.map(pool => {
    const minLiq   = Math.min(pool.reserveA, pool.reserveB);
    const feeYield = ((pool.fee_bp / 10000) * pool.tradeCount).toFixed(0);
    const ratioA   = ((pool.reserveA / (pool.reserveA + pool.reserveB)) * 100).toFixed(1);
    const ratioB   = (100 - parseFloat(ratioA)).toFixed(1);
    return `
      <div class="pool-card" data-pool-id="${pool.id}">
        <div class="pool-name">${pool.assetA} / ${pool.assetB}</div>
        <div class="pool-reserves">
          <span class="reserve-item"><span class="reserve-token">${pool.assetA}</span> ${formatLargeNum(pool.reserveA)}</span>
          <span class="reserve-sep">·</span>
          <span class="reserve-item"><span class="reserve-token">${pool.assetB}</span> ${formatLargeNum(pool.reserveB)}</span>
        </div>
        <div class="pool-stats">
          <span class="pool-stat">최소 유동성 <span class="en-tag">Min Liq</span>: <span>${formatLargeNum(minLiq)}</span></span>
          <span class="pool-stat">수수료 <span class="en-tag">Fee</span>: <span>${(pool.fee_bp / 100).toFixed(2)}%</span></span>
          <span class="pool-stat">수수료 효율 <span class="en-tag">Yield</span>: <span>${formatLargeNum(parseFloat(feeYield))}</span></span>
          <span class="pool-stat">비율 <span class="en-tag">Ratio</span>: <span>${ratioA}% : ${ratioB}%</span></span>
        </div>
      </div>`;
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
  container.querySelector('#lp-pool-name').textContent =
    `${selectedPool.assetA} / ${selectedPool.assetB} 풀`;

  const ratio  = (selectedPool.reserveA / selectedPool.reserveB).toFixed(4);
  const minLiq = Math.min(selectedPool.reserveA, selectedPool.reserveB);
  container.querySelector('#lp-pool-info').innerHTML = `
    <div class="pool-info-row">
      <span>${selectedPool.assetA}: <strong>${formatLargeNum(selectedPool.reserveA)}</strong></span>
      <span>${selectedPool.assetB}: <strong>${formatLargeNum(selectedPool.reserveB)}</strong></span>
    </div>
    <div class="pool-info-row" style="margin-top:4px;">
      <span>비율: 1 ${selectedPool.assetA} = ${ratio} ${selectedPool.assetB}</span>
      <span>수수료: ${(selectedPool.fee_bp / 100).toFixed(2)}%</span>
    </div>
  `;

  container.querySelector('#lp-amount').oninput = function () {
    const totalPi = parseFloat(this.value);
    const preview = container.querySelector('#lp-preview');
    if (!totalPi || totalPi <= 0) { preview.classList.add('hidden'); return; }
    const { amountA, amountB, ratioA, ratioB } = calcLPRatio(selectedPool, totalPi);
    preview.classList.remove('hidden');
    preview.innerHTML = `
      <div class="card" style="background:var(--bg3);margin:8px 0 0;">
        <div class="card-title">예치 미리보기 <span class="en">Preview</span></div>
        <div class="stat-row">
          <span class="stat-label">${selectedPool.assetA}</span>
          <span class="stat-value">${formatToken(amountA, selectedPool.assetA)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${selectedPool.assetB}</span>
          <span class="stat-value">${formatToken(amountB, selectedPool.assetB)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">비율 <span class="en">Ratio</span></span>
          <span class="stat-value">${(ratioA*100).toFixed(1)}% / ${(ratioB*100).toFixed(1)}%</span>
        </div>
      </div>`;
  };
}
