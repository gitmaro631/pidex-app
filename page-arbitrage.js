import { fetchPools } from './horizon.js';
import { findArbitragePaths } from './amm.js';
import { formatPct, pctClass } from './util-format.js';
import { canUseArbitrage, incrementArbCount, remainingFreeUses, isSubscribed } from './util-storage.js';
import { showLoading, hideLoading, showToast } from './app.js';

export function renderArbitrage(container) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">차익 탐색 <span class="en">Arbitrage Finder</span></h2>

      <div class="card">
        <div class="card-title">탐색 설정 <span class="en">Scan Settings</span></div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">투입금액 <span class="en">Input Amount</span></label>
            <div class="input-unit-row">
              <input type="number" class="form-input" id="arb-input" value="10" min="0.01" step="0.1" />
              <span class="unit-label">Pi</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">기대 수익률 <span class="en">Target Return</span></label>
            <div class="input-unit-row">
              <input type="number" class="form-input" id="arb-target" value="1.0" min="0" step="0.1" />
              <span class="unit-label">%</span>
            </div>
            <p class="form-hint">이 수익률 이상인 경로만 표시</p>
          </div>
          <div class="form-group">
            <label class="form-label">최소 수익률 <span class="en">Min Return</span></label>
            <div class="input-unit-row">
              <input type="number" class="form-input" id="arb-min" value="0.5" min="0" step="0.1" />
              <span class="unit-label">%</span>
            </div>
            <p class="form-hint">이 미만은 실행 비추천으로 표시</p>
          </div>
          <div class="form-group">
            <label class="form-label">최소 유동성 <span class="en">Min Liquidity</span></label>
            <div class="input-unit-row">
              <input type="number" class="form-input" id="arb-liquidity" value="1000" min="0" step="100" />
              <span class="unit-label">Pi</span>
            </div>
            <p class="form-hint">풀 양쪽 중 작은 쪽 기준으로 필터</p>
          </div>
        </div>
        <button id="arb-scan-btn" class="btn-primary">경로 탐색 Find Paths</button>
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
    quotaEl.innerHTML = `<span class="quota-ok">⭐ 구독 중 — 무제한 탐색 Unlimited</span>`;
    scanBtn.disabled = false;
  } else {
    const remaining = remainingFreeUses();
    const canUse    = remaining > 0;
    quotaEl.innerHTML = `<span class="${canUse ? 'quota-ok' : 'quota-over'}">
      오늘 남은 탐색 횟수 Daily remaining: ${remaining} / 30
      ${!canUse ? ' — 내일 초기화됩니다 Resets tomorrow' : ''}
    </span>`;
    scanBtn.disabled = !canUse;
  }
}

async function runScan(container) {
  if (!canUseArbitrage()) {
    showToast('오늘 탐색 횟수(30회)를 모두 사용했습니다. 내일 초기화됩니다.', 'error');
    return;
  }
  const inputAmt     = parseFloat(container.querySelector('#arb-input').value)     || 10;
  const targetPct    = parseFloat(container.querySelector('#arb-target').value)    || 1.0;
  const minPct       = parseFloat(container.querySelector('#arb-min').value)       || 0.5;
  const minLiquidity = parseFloat(container.querySelector('#arb-liquidity').value) || 0;

  const resultsEl = container.querySelector('#arb-results');
  resultsEl.innerHTML = '<p class="scan-msg">풀 스캔 중... Scanning pools...</p>';

  try {
    showLoading('전체 풀 로드 중... (페이지네이션)');
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
          <p class="empty-msg">유동성 조건을 만족하는 풀이 없습니다.<br>최소 유동성 값을 낮춰보세요.</p>
          <p class="form-hint">전체 풀: ${allPools.length}개</p>
        </div>`;
      return;
    }

    const paths     = findArbitragePaths(filteredPools, inputAmt, 0.01, 0);
    const displayed = paths.filter(p => p.netPct >= targetPct);
    const positiveAll = paths.filter(p => p.netPct > 0);

    const header = `<div class="results-summary">
      전체 풀 ${allPools.length}개 → 유동성 통과 ${filteredPools.length}개 → 경로 ${paths.length}개 탐색
    </div>`;

    if (displayed.length === 0) {
      resultsEl.innerHTML = header + `
        <div class="card">
          <p class="empty-msg">기대 수익률 ${targetPct}% 이상인 경로 없음</p>
          ${positiveAll.length > 0
            ? `<p class="form-hint">수익 가능 경로 ${positiveAll.length}개 발견 — 기대 수익률을 낮춰보세요</p>`
            : `<p class="form-hint">수익 가능 경로 없음 (테스트넷 풀 유동성이 부족할 수 있습니다)</p>`}
        </div>`;
      return;
    }

    resultsEl.innerHTML = header + displayed.map(p => renderPath(p, inputAmt, minPct)).join('');
  } catch (e) {
    resultsEl.innerHTML = `<div class="card"><p class="empty-msg" style="color:var(--red)">오류: ${e.message}</p></div>`;
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
          <span class="metric-label">AMM 수수료 <span class="en">AMM Fee</span></span>
          <span class="metric-val val-red">-${p.ammFeePct.toFixed(3)}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">가스비 <span class="en">Gas Fee</span></span>
          <span class="metric-val val-red">-${gasPct.toFixed(3)}% (0.01 Pi)</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">가격충격 <span class="en">Price Impact</span></span>
          <span class="metric-val val-red">-${p.totalImpact.toFixed(3)}%</span>
        </div>
        <div class="metric-row metric-net">
          <span class="metric-label">순 수익률 <span class="en">Net Return</span></span>
          <span class="metric-val ${pctClass(p.netPct)}">${formatPct(p.netPct)}</span>
        </div>
      </div>
      <div class="path-footer">
        <span class="path-detail">${inputAmt} Pi → ${p.returned.toFixed(4)} Pi
          (${p.netPnl >= 0 ? '+' : ''}${p.netPnl.toFixed(4)} Pi)</span>
        ${recommend
          ? '<span class="badge badge-good">추천 Recommended</span>'
          : '<span class="badge badge-low">최소수익률 미달 Below Min</span>'}
      </div>
    </div>`;
}
