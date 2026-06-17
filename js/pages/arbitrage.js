// 차익거래 탐색기 페이지

import { fetchPools } from '../horizon.js';
import { findArbitragePaths } from '../amm.js';
import { formatPi, formatPctShort, formatToken, pctClass } from '../utils/format.js';
import { canUseArbitrage, incrementArbCount, remainingFreeUses, isSubscribed } from '../utils/storage.js';
import { showToast } from '../app.js';

let lastResults = [];
let selectedPath = null;

export async function renderArbitrage(container) {
  const remaining = remainingFreeUses();
  const subText   = isSubscribed() ? '무제한 구독 중' : `오늘 ${remaining}회 남음 (무료 3회/일)`;

  container.innerHTML = `
    <div class="card">
      <div class="card-title">차익거래 탐색기</div>
      <p style="color:var(--text2);font-size:13px;">경로를 탐색하고 실행 여부를 직접 판단하세요.</p>
      <div style="margin-top:8px;"><span class="badge ${isSubscribed() ? 'badge-green' : 'badge-yellow'}">${subText}</span></div>
    </div>

    <!-- 투입 금액 설정 -->
    <div class="card">
      <div class="card-title">투입 Pi 설정</div>
      <div class="form-group" style="margin-bottom:0;">
        <input type="number" class="form-input" id="arb-amount" value="100" min="1" step="10" />
      </div>
    </div>

    <button class="btn-primary" id="btn-search-arb" ${!canUseArbitrage() ? 'disabled' : ''}>
      ${canUseArbitrage() ? '경로 탐색' : '오늘 사용량 초과 (구독으로 무제한)'}
    </button>

    <div id="arb-results" style="margin-top:16px;"></div>

    <!-- 실행 패널 -->
    <div id="arb-execute-panel" class="card hidden" style="margin-top:12px;">
      <div class="card-title">선택된 경로 실행</div>
      <div id="arb-selected-summary"></div>
      <div class="form-group" style="margin-top:12px;">
        <label class="form-label">최소수익률 (%) — 이 수익률을 밑돌면 블록체인이 자동 취소</label>
        <input type="number" class="form-input" id="arb-min-pct" value="0.3" min="0" step="0.1" />
      </div>
      <button class="btn-primary btn-green" id="btn-execute-arb">거래 실행</button>
    </div>
  `;

  container.querySelector('#btn-search-arb').addEventListener('click', () => searchPaths(container));
}

async function searchPaths(container) {
  if (!canUseArbitrage()) { showToast('오늘 사용량 초과입니다', 'error'); return; }

  const amount  = parseFloat(container.querySelector('#arb-amount').value) || 100;
  const btn     = container.querySelector('#btn-search-arb');
  const results = container.querySelector('#arb-results');

  btn.disabled = true;
  btn.textContent = '탐색 중...';
  results.innerHTML = '';

  try {
    const pools = await fetchPools(50);
    lastResults = findArbitragePaths(pools, amount);
    incrementArbCount();

    if (lastResults.length === 0) {
      results.innerHTML = '<p style="color:var(--text2);text-align:center;padding:24px;">현재 수익성 있는 경로 없음</p>';
    } else {
      renderResults(container, lastResults);
    }

    const remaining = remainingFreeUses();
    if (!isSubscribed()) {
      btn.textContent = remaining > 0 ? `경로 탐색 (오늘 ${remaining}회 남음)` : '오늘 사용량 초과';
      btn.disabled = remaining <= 0;
    } else {
      btn.disabled = false;
      btn.textContent = '경로 탐색';
    }
  } catch {
    results.innerHTML = '<p style="color:var(--red);text-align:center;padding:24px;">탐색 실패. 다시 시도해주세요.</p>';
    btn.disabled = false;
    btn.textContent = '경로 탐색';
  }
}

function renderResults(container, results) {
  const el = container.querySelector('#arb-results');
  el.innerHTML = `<p style="color:var(--text2);font-size:13px;margin-bottom:8px;">탐색 결과 ${results.length}개 경로</p>` +
    results.slice(0, 10).map((r, i) => `
      <div class="arb-path" data-index="${i}">
        <div class="arb-route">${r.route}</div>
        <div class="arb-stats">
          <div class="arb-stat"><div class="arb-stat-label">AMM 수수료</div><div>~${r.ammFeePct.toFixed(2)}%</div></div>
          <div class="arb-stat"><div class="arb-stat-label">가격충격</div><div>${r.totalImpact.toFixed(3)}%</div></div>
          <div class="arb-stat"><div class="arb-stat-label">가스비</div><div>${r.gasFeePI} Pi</div></div>
          <div class="arb-stat"><div class="arb-stat-label">투입</div><div>${formatPi(r.sendAmount)}</div></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
          <span style="font-size:12px;color:var(--text2);">예상 순수익</span>
          <span class="arb-profit-big ${pctClass(r.netPct)}">${formatPctShort(r.netPct)}</span>
        </div>
        ${r.profitable
          ? '<div class="badge badge-green" style="margin-top:6px;">수익 가능</div>'
          : '<div class="badge badge-gray" style="margin-top:6px;">손실 예상</div>'}
      </div>
    `).join('');

  el.querySelectorAll('.arb-path').forEach(card => {
    card.addEventListener('click', () => {
      el.querySelectorAll('.arb-path').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedPath = lastResults[parseInt(card.dataset.index)];
      showExecutePanel(container, selectedPath);
    });
  });
}

function showExecutePanel(container, path) {
  const panel = container.querySelector('#arb-execute-panel');
  panel.classList.remove('hidden');
  container.querySelector('#arb-selected-summary').innerHTML = `
    <div class="stat-row"><span class="stat-label">경로</span><span class="stat-value" style="font-size:12px;">${path.route}</span></div>
    <div class="stat-row"><span class="stat-label">예상 반환</span><span class="stat-value">${formatPi(path.returned)}</span></div>
    <div class="stat-row"><span class="stat-label">예상 순수익률</span><span class="stat-value ${pctClass(path.netPct)}">${formatPctShort(path.netPct)}</span></div>
  `;
  container.querySelector('#btn-execute-arb').onclick = () => executeArbitrage(container, path);
}

async function executeArbitrage(container, path) {
  const minPct = parseFloat(container.querySelector('#arb-min-pct').value) || 0.3;
  const minReturn = path.sendAmount * (1 + minPct / 100);
  showToast(`최소수익률 ${minPct}% 조건으로 제출합니다. Pi Browser에서 서명해주세요.`);
  // 실제 트랜잭션 빌드/제출은 Pi Browser + 지갑 키 연동 필요
}
