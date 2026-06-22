import { fetchPools } from './horizon.js';
import { calcLPRatio } from './amm.js';
import { formatToken, formatLargeNum } from './util-format.js';

let allPools     = [];
let selectedPool = null;
let piOnly       = false;
let piFirst      = false;
let newPool      = false;
let searchQuery  = '';
let currentPage  = 1;
const PAGE_SIZE  = 30;

function getPiPricePerToken(tokenId) {
  if (tokenId === 'Pi') return 1;
  const pool = allPools.find(p =>
    (p.assetAId === 'Pi' && p.assetBId === tokenId) ||
    (p.assetBId === 'Pi' && p.assetAId === tokenId)
  );
  if (!pool) return null;
  return pool.assetAId === 'Pi'
    ? pool.reserveA / pool.reserveB
    : pool.reserveB / pool.reserveA;
}

function getMissingPairs() {
  const idToName = {};
  allPools.forEach(p => {
    idToName[p.assetAId] = p.assetA;
    idToName[p.assetBId] = p.assetB;
  });
  const tokens   = [...new Set(allPools.flatMap(p => [p.assetAId, p.assetBId]))].sort();
  const existing = new Set(allPools.map(p => [p.assetAId, p.assetBId].sort().join('|')));
  const pairs = [];
  for (let i = 0; i < tokens.length; i++)
    for (let j = i + 1; j < tokens.length; j++) {
      const key = [tokens[i], tokens[j]].sort().join('|');
      if (!existing.has(key))
        pairs.push({ nameA: idToName[tokens[i]], nameB: idToName[tokens[j]], idA: tokens[i], idB: tokens[j] });
    }
  return pairs;
}

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
          <button class="toggle-btn ${newPool ? 'active' : ''}" id="btn-new-pool">
            새풀<br><span class="en-tab">New Pool</span>
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
              <input type="number" class="form-input" id="lp-amount" placeholder="e.g. 100" min="0" step="1" />
              <span class="unit-label">Pi</span>
            </div>
          </div>
          <div id="lp-preview" class="hidden"></div>
        </div>
      </div>
      <div class="lp-bottom" id="lp-page-bar"></div>
    </div>
  `;

  container.querySelector('#btn-pi-only').addEventListener('click', () => {
    piOnly = !piOnly;
    currentPage = 1;
    container.querySelector('#btn-pi-only').classList.toggle('active', piOnly);
    renderPoolList(container);
  });

  container.querySelector('#btn-pi-first').addEventListener('click', () => {
    piFirst = !piFirst;
    currentPage = 1;
    container.querySelector('#btn-pi-first').classList.toggle('active', piFirst);
    renderPoolList(container);
  });

  container.querySelector('#btn-new-pool').addEventListener('click', () => {
    newPool = !newPool;
    currentPage = 1;
    container.querySelector('#btn-new-pool').classList.toggle('active', newPool);
    const btnPiFirst = container.querySelector('#btn-pi-first');
    btnPiFirst.disabled = newPool;
    btnPiFirst.classList.toggle('disabled', newPool);
    if (newPool && piFirst) { piFirst = false; btnPiFirst.classList.remove('active'); }
    renderPoolList(container);
  });

  container.querySelector('#lp-search').addEventListener('input', function () {
    searchQuery = this.value.trim();
    currentPage = 1;
    renderPoolList(container);
  });

  container.querySelector('#btn-search-clear').addEventListener('click', () => {
    searchQuery = '';
    currentPage = 1;
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
  const list = container.querySelector('#pool-list');
  container.querySelector('#lp-form').classList.add('hidden');

  if (newPool) {
    renderNewPoolList(container);
    return;
  }

  const all        = sortedPools();
  const total      = all.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const pools = all.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  renderPageBar(container, total, totalPages);

  if (pools.length === 0) {
    list.innerHTML = '<p style="color:var(--text2);text-align:center;padding:24px;">조건에 맞는 풀 없음</p>';
    return;
  }

  list.innerHTML = pools.map(pool => `
    <div class="pool-card" data-pool-id="${pool.id}">
      <div class="pool-name">${pool.assetA} / ${pool.assetB}</div>
      <div class="pool-reserves">
        <span class="reserve-item"><span class="reserve-token">${pool.assetA}</span> ${formatLargeNum(pool.reserveA)}</span>
        <span class="reserve-sep">·</span>
        <span class="reserve-item"><span class="reserve-token">${pool.assetB}</span> ${formatLargeNum(pool.reserveB)}</span>
      </div>
    </div>`).join('');

  list.querySelectorAll('.pool-card').forEach(card => {
    card.addEventListener('click', () => {
      list.querySelectorAll('.pool-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedPool = allPools.find(p => p.id === card.dataset.poolId);
      showLPForm(container);
    });
  });
}

function renderNewPoolList(container) {
  const list = container.querySelector('#pool-list');
  let pairs  = getMissingPairs();

  if (searchQuery) {
    const q = searchQuery.toUpperCase();
    pairs = pairs.filter(p => p.nameA.toUpperCase().includes(q) || p.nameB.toUpperCase().includes(q));
  }
  if (piOnly) pairs = pairs.filter(p => p.idA === 'Pi' || p.idB === 'Pi');

  const total      = pairs.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const page = pairs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  renderPageBar(container, total, totalPages);

  if (page.length === 0) {
    list.innerHTML = '<p style="color:var(--text2);text-align:center;padding:24px;">조건에 맞는 새풀 조합 없음</p>';
    return;
  }

  list.innerHTML = `
    <p style="color:var(--text2);font-size:12px;padding:8px 4px 4px;">
      아직 풀이 없는 토큰 조합 <span class="en">Pairs without a pool</span> — ${total.toLocaleString()}개
    </p>
    ${page.map((p, i) => `
      <div class="pool-card new-pool-card" data-pair-idx="${i}">
        <div class="pool-name">${p.nameA} / ${p.nameB}</div>
        <div class="pool-reserves" style="color:var(--accent);font-size:12px;">
          풀 없음 · No pool exists
        </div>
      </div>`).join('')}`;

  list.querySelectorAll('.new-pool-card').forEach((card, i) => {
    card.addEventListener('click', () => {
      list.querySelectorAll('.new-pool-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      showNewPoolForm(container, page[i]);
    });
  });
}

function renderPageBar(container, total, totalPages) {
  const bar = container.querySelector('#lp-page-bar');
  if (!bar) return;
  if (totalPages <= 1) { bar.innerHTML = ''; bar.style.display = 'none'; return; }
  bar.style.display = 'flex';

  const WINDOW = 5;
  let start = Math.max(1, currentPage - Math.floor(WINDOW / 2));
  let end   = Math.min(totalPages, start + WINDOW - 1);
  if (end - start < WINDOW - 1) start = Math.max(1, end - WINDOW + 1);

  let html = '';
  if (currentPage > 1)
    html += `<button class="page-btn" data-page="${currentPage - 1}">‹</button>`;
  for (let i = start; i <= end; i++)
    html += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
  if (currentPage < totalPages)
    html += `<button class="page-btn" data-page="${currentPage + 1}">›</button>`;

  bar.innerHTML = html;

  bar.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      renderPoolList(container);
      container.querySelector('#pool-scroll').scrollTop = 0;
    });
  });
}

function showNewPoolForm(container, pair) {
  const form = container.querySelector('#lp-form');
  form.classList.remove('hidden');

  const priceA = getPiPricePerToken(pair.idA);
  const priceB = getPiPricePerToken(pair.idB);

  const priceInfo = (name, price) =>
    price !== null
      ? `1 ${name} ≈ <strong>${price.toFixed(4)} Pi</strong>`
      : `<span style="color:var(--text2);">1 ${name} — Pi 시세 정보 없음</span>`;

  container.querySelector('#lp-pool-name').textContent = `${pair.nameA} / ${pair.nameB} 새 풀`;
  container.querySelector('#lp-pool-info').innerHTML = `
    <div class="pool-info-row" style="margin-bottom:4px;">
      <span>${priceInfo(pair.nameA, priceA)}</span>
      <span>${priceInfo(pair.nameB, priceB)}</span>
    </div>
    <p style="color:var(--yellow);font-size:11px;margin-top:4px;">
      ※ 초기 예치 비율이 곧 시작 가격이 됩니다. 아래는 현재 Pi 시세 기준 추천 비율입니다.
    </p>`;

  form.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const amountInput = container.querySelector('#lp-amount');
  amountInput.oninput = function () {
    const totalPi = parseFloat(this.value);
    const preview = container.querySelector('#lp-preview');
    if (!totalPi || totalPi <= 0) { preview.classList.add('hidden'); return; }

    const canA = priceA !== null;
    const canB = priceB !== null;

    if (!canA && !canB) {
      preview.classList.remove('hidden');
      preview.innerHTML = `<p style="color:var(--text2);font-size:12px;padding:8px 0;">두 토큰 모두 Pi 시세 정보가 없어 계산할 수 없습니다.</p>`;
      return;
    }

    let amountA, amountB, piForA, piForB;
    if (canA && canB) {
      piForA = totalPi / 2;
      piForB = totalPi / 2;
      amountA = piForA / priceA;
      amountB = piForB / priceB;
    } else if (canA) {
      piForA = totalPi;
      amountA = piForA / priceA;
      amountB = null;
    } else {
      piForB = totalPi;
      amountB = piForB / priceB;
      amountA = null;
    }

    const pctA = canA && canB ? 50 : canA ? 100 : 0;
    const pctB = canA && canB ? 50 : canB ? 100 : 0;

    preview.classList.remove('hidden');
    preview.innerHTML = `
      <div class="card" style="background:var(--bg3);margin:8px 0 0;">
        <div class="card-title">예치 미리보기 <span class="en">Deposit Preview</span></div>
        ${amountA !== null ? `
        <div class="stat-row">
          <span class="stat-label">${pair.nameA} <span style="color:var(--accent);font-size:11px;">${pctA}%</span></span>
          <span class="stat-value">${formatToken(amountA, pair.nameA)}</span>
        </div>` : ''}
        ${amountB !== null ? `
        <div class="stat-row">
          <span class="stat-label">${pair.nameB} <span style="color:var(--accent);font-size:11px;">${pctB}%</span></span>
          <span class="stat-value">${formatToken(amountB, pair.nameB)}</span>
        </div>` : ''}
        ${canA && canB ? `
        <div class="stat-row" style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px;">
          <span class="stat-label">수량 비율 <span class="en">Token Ratio</span></span>
          <span class="stat-value">1 ${pair.nameA} : ${(amountB / amountA).toFixed(4)} ${pair.nameB}</span>
        </div>` : ''}
      </div>`;
  };
  if (amountInput.value) amountInput.oninput();
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

  const lpAmountInput = container.querySelector('#lp-amount');
  lpAmountInput.oninput = function () {
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
  if (lpAmountInput.value) lpAmountInput.oninput();
}
