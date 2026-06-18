import { fetchPools } from './horizon.js';
import { calcLPRatio } from './amm.js';
import { formatToken, formatLargeNum } from './util-format.js';

let allPools     = [];
let selectedPool = null;
let piOnly       = false;
let piFirst      = false;
let searchQuery  = '';

export async function renderLPHelper(container) {
  container.innerHTML = `
    <div class="lp-wrapper">
      <div class="lp-sticky">
        <h2 class="page-title" style="margin-bottom:10px;">LP 계산기 <span class="en">LP Calculator</span></h2>
        <div class="search-row">
          <input type="text" class="form-input" id="lp-search"
            placeholder="코인 검색 Search token (예: USDT)" style="flex:1;" />
          <button class="btn-outline btn-sm" id="btn-search-clear" style="width:auto;padding:0 12px;">✕</button>
        </div>
        <div class="lp-filter-row">
          <span class="sort-badge">유동성 높음 <span class="en-tag">Liquidity</span></span>
          <button class="toggle-btn ${piOnly  ? 'active' : ''}" id="btn-pi-only">
            파이포함만<br><span class="en-tab">Pi Pairs</span>
          </button>
          <button class="toggle-btn ${piFirst ? 'active' : ''}" id="btn-pi-first">
            파이우선<br><span class="en-tab">Pi First</span>
          </button>
        </div>
      </div>

      <div class="pool-scroll-frame" id="pool-scroll">
        <div id="pool-list"></div>
        <div id="lp-form" class="card hidden" style="margin:10px 0 0;">
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
    </div>
  `;

  container.querySelector('#btn-pi-only').addEventListener('click', () => {
    piOnly = !piOnly;
    container.querySelector('#btn-pi-only').classList.toggle('active', piOnly);
    renderPoolList(container);
  });

  container.querySelector('#btn-pi-first').addEventListener('click', () => {
    piFirst = !piFirst;
    container.querySelector('#btn-pi-first').classList.toggle('active', piFirst);
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

  container.querySelector('#pool-list').innerHTML =
    '<p style="color:var(--text2);text-align:center;padding:24px;">풀 목록 불러오는 중...</p>';

  try {
    allPools = await fetchPools(2000);
    renderPoolList(container);
  } catch {
    container.querySelector('#pool-list').innerHTML =
      '<p style="color:var(--red);text-align:center;padding:24px;">풀 목록 조회 실패</p>';
  }
}

function sortedPools() {
  let pools = [...allPools];

  // 파이포함만 필터
  if (piOnly) pools = pools.filter(p => p.assetAId === 'Pi' || p.assetBId === 'Pi');

  // 검색 필터
  if (searchQuery) {
    const q = searchQuery.toUpperCase();
    pools = pools.filter(p =>
      p.assetA.toUpperCase().includes(q) || p.assetB.toUpperCase().includes(q)
    );
    const matchScore = p => {
      const scores = [p.assetA, p.assetB]
        .map(s => s.toUpperCase().indexOf(q))
        .filter(i => i >= 0);
      return scores.length ? Math.min(...scores) : 999;
    };
    pools.sort((a, b) => matchScore(a) - matchScore(b));
    return pools;
  }

  // 파이우선: 파이 쪽 reserve 기준 정렬
  if (piFirst) {
    const piRes = p => p.assetAId === 'Pi' ? p.reserveA : p.assetBId === 'Pi' ? p.reserveB : 0;
    return pools.sort((a, b) => piRes(b) - piRes(a));
  }

  // 기본: 유동성 높음 (min reserve)
  return pools.sort((a, b) => Math.min(b.reserveA, b.reserveB) - Math.min(a.reserveA, a.reserveB));
}

function renderPoolList(container) {
  const list  = container.querySelector('#pool-list');
  const pools = sortedPools().slice(0, 30);

  if (pools.length === 0) {
    list.innerHTML = '<p style="color:var(--text2);text-align:center;padding:24px;">조건에 맞는 풀 없음</p>';
    return;
  }

  list.innerHTML = pools.map(pool => {
    const piSide  = pool.assetAId === 'Pi' ? pool.reserveA : pool.assetBId === 'Pi' ? pool.reserveB : null;
    const minLiq  = Math.min(pool.reserveA, pool.reserveB);
    const ratioA  = ((pool.reserveA / (pool.reserveA + pool.reserveB)) * 100).toFixed(1);
    const ratioB  = (100 - parseFloat(ratioA)).toFixed(1);
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
          ${piSide !== null ? `<span class="pool-stat">Pi 유동성 <span class="en-tag">Pi Liq</span>: <span>${formatLargeNum(piSide)}</span></span>` : ''}
          <span class="pool-stat">수수료 <span class="en-tag">Fee</span>: <span>${(pool.fee_bp / 100).toFixed(2)}%</span></span>
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

  const ratio = (selectedPool.reserveA / selectedPool.reserveB).toFixed(4);
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

  form.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
