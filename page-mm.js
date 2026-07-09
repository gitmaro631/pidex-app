// ═══════════════════════════════════════════════════════
//  MM Backtest tab — ported from standalone "Mm backtest/app.js"
// ═══════════════════════════════════════════════════════
import { getLang } from './i18n.js';
import { isSubscribed } from './util-storage.js';

// ── i18n (local, ko/en only) ──────────────────────────
const S = {
  steps: [
    { ko:'네트워크', en:'Network' },
    { ko:'전략', en:'Strategy' },
    { ko:'풀 선택', en:'Pool' },
    { ko:'파라미터', en:'Parameters' },
    { ko:'실행', en:'Run' },
    { ko:'결과', en:'Results' },
  ],
  btn_next:   { ko:'다음', en:'Next' },
  btn_prev:   { ko:'이전', en:'Back' },
  btn_run:    { ko:'백테스트 시작', en:'Start Backtest' },
  btn_retry:  { ko:'다시 시도', en:'Retry' },
  btn_stop:   { ko:'수신 중단', en:'Stop' },
  btn_new:    { ko:'새 백테스트', en:'New Backtest' },
  btn_params: { ko:'← 파라미터', en:'← Parameters' },
  btn_net:    { ko:'← 네트워크 변경', en:'← Change Network' },

  net_title:    { ko:'네트워크 선택', en:'Select Network' },
  stellar_name: { ko:'Stellar 메인넷', en:'Stellar Mainnet' },
  stellar_desc: { ko:'Stellar 공식 메인넷 · XLM/USDC 등 풍부한 유동성', en:'Official Stellar mainnet · Rich liquidity' },
  pi_name:      { ko:'Pi DEX 테스트넷', en:'Pi DEX Testnet' },
  pi_desc:      { ko:'Pi 네트워크 DEX · Pi 테스트넷 기반 (메인넷 거래 데이터 없음)', en:'Pi Network DEX · Pi testnet based (mainnet has no trade data yet)' },

  str_title: { ko:'전략 선택', en:'Select Strategy' },
  ob_name:   { ko:'오더북 마켓메이킹', en:'Orderbook Market Making' },
  ob_desc:   { ko:'Bid/Ask 주문으로 스프레드 수익 시뮬레이션', en:'Simulate spread profit via bid/ask orders' },
  amm_name:  { ko:'AMM 유동성 공급', en:'AMM Liquidity Provision' },
  amm_desc:  { ko:'풀에 예치 후 수수료 + 비영구적 손실 시뮬레이션', en:'Fee income & impermanent loss simulation' },
  auto_name: { ko:'자동 최적화 🔍', en:'Auto Optimize 🔍' },
  auto_desc: { ko:'상위 풀을 자동 분석해 최적 파라미터 조합을 추천합니다', en:'Scans top pools to find the best parameter combination' },

  pool_title:    { ko:'풀 선택', en:'Select Pool' },
  pair_title:    { ko:'페어 선택', en:'Select Pair' },
  loading_pools: { ko:'풀 목록 불러오는 중', en:'Loading pools' },
  loading_pairs: { ko:'거래 페어 불러오는 중', en:'Loading pairs' },
  sec:           { ko:'초', en:'sec' },
  search_ph:     { ko:'토큰 이름 검색...', en:'Search token...' },
  sort_lp:       { ko:'XLM 전체 풀 · 7일 거래 횟수 90% + LP 수 10% 순', en:'All XLM pools · 7d trade count 90% + LP 10%' },
  sort_tvl:      { ko:'XLM 전체 풀 · 거래량/TVL 비율 (수수료 APY) 순', en:'All XLM pools · Volume/TVL ratio (fee APY)' },
  sort_pi_amm:   { ko:'Pi DEX 테스트넷 AMM 풀 · LP 수 순 정렬', en:'Pi DEX Testnet AMM pools · Sorted by LP count' },
  pi_info:       { ko:'Pi DEX 테스트넷 · 오더북 거래 데이터 · 거래량 순 정렬', en:'Pi DEX Testnet · Orderbook data · Sorted by volume' },
  recent_trades: { ko:'최근 거래', en:'Recent trades' },
  no_results:    { ko:'검색 결과 없음', en:'No results' },
  pool_fail:     { ko:'풀 목록 로드 실패', en:'Pool load failed' },
  pair_fail:     { ko:'페어 로드 실패', en:'Pair load failed' },
  no_trade_data: { ko:'거래 데이터 없음', en:'No trade data' },

  param_title:   { ko:'파라미터 설정', en:'Parameter Settings' },
  p_records:     { ko:'데이터 건수 (5,000~10,000)', en:'Data count (5,000~10,000)' },
  p_capital:     { ko:'초기 자본', en:'Initial Capital' },
  p_split:       { ko:'네이티브 초기 비율 (%)', en:'Native ratio (%)' },
  p_spread:      { ko:'스프레드 (%)', en:'Spread (%)' },
  p_order_size:  { ko:'주문 크기 (총자산 %)', en:'Order size (% of total)' },
  p_layers:      { ko:'주문 레이어 수', en:'Order layers' },
  p_stop:        { ko:'재고 중단 (%)', en:'Inventory stop (%)' },
  p_fee:         { ko:'수수료 (%)', en:'Fee (%)' },
  p_surge_ticks: { ko:'급변 감지 틱', en:'Surge window (ticks)' },
  p_surge_pct:   { ko:'급변 감지 (%)', en:'Surge threshold (%)' },
  p_deposit:     { ko:'예치 금액', en:'Deposit amount' },
  p_max_il:      { ko:'최대 비영구적 손실 (%)', en:'Max impermanent loss (%)' },
  p_target_roi:  { ko:'목표 수익률 (%)', en:'Target ROI (%)' },
  p_rec:         { ko:'권장', en:'Rec' },

  run_title:    { ko:'데이터 수집 및 백테스트', en:'Fetching Data & Backtesting' },
  run_start:    { ko:'시작 중...', en:'Starting...' },
  run_running:  { ko:'백테스트 실행 중...', en:'Running backtest...' },
  run_done:     { ko:'완료!', en:'Done!' },
  run_req:      { ko:'건 요청', en:'records requested' },
  run_received: { ko:'건 수신', en:'records received' },
  run_valid:    { ko:'유효 거래', en:'valid trades' },
  run_complete: { ko:'완료', en:'complete' },
  run_too_few:  { ko:'데이터가 너무 적습니다 (10건 미만)', en:'Too little data (under 10 records)' },
  run_error:    { ko:'오류', en:'Error' },
  run_live_roi: { ko:'실시간 예상 수익률', en:'Live ROI Preview' },

  res_summary:   { ko:'종합 결과', en:'Summary' },
  res_pnl:       { ko:'총 손익', en:'Total P&L' },
  res_spread:    { ko:'스프레드 수익', en:'Spread profit' },
  res_inv:       { ko:'재고 평가손익', en:'Inventory P&L' },
  res_fees:      { ko:'수수료 합계', en:'Total fees' },
  res_stats:     { ko:'거래 통계', en:'Trade Statistics' },
  res_fills:     { ko:'체결 횟수', en:'Fill count' },
  res_ticks:     { ko:'분석 틱 수', en:'Ticks analyzed' },
  res_price_chg: { ko:'가격 변화', en:'Price change' },
  res_stop:      { ko:'중단 사유', en:'Stop reason' },
  res_log:       { ko:'거래 로그 (최근 20건)', en:'Trade log (last 20)' },
  res_no_fills:  { ko:'체결 없음', en:'No fills' },
  res_asset_chart:{ ko:'총 자산 추이 (USDC)', en:'Total Asset Trend (USDC)' },
  res_lp_title:  { ko:'LP 수익 결과', en:'LP Return Summary' },
  res_lp_pnl:    { ko:'LP 총 손익', en:'LP Total P&L' },
  res_fee_inc:   { ko:'수수료 수익', en:'Fee income' },
  res_il:        { ko:'비영구적 손실', en:'Impermanent loss' },
  res_vs_hodl:   { ko:'HODL 대비', en:'vs HODL' },
  res_lp_share:  { ko:'내 LP 지분', en:'My LP share' },
  res_exit:      { ko:'종료 사유', en:'Exit reason' },
  res_lp_chart:  { ko:'LP vs HODL 자산 추이 (USDC)', en:'LP vs HODL Trend (USDC)' },
  res_none:      { ko:'결과 없음', en:'No result' },

  ana_no_fills: { ko:'⚠️ 체결 0회 — 스프레드를 줄이거나 레이어를 늘려보세요', en:'⚠️ 0 fills — Try reducing spread or adding layers' },
  ana_good:     { ko:'✅ 스프레드 수익과 전체 손익 모두 플러스', en:'✅ Both spread profit and total P&L are positive' },
  ana_inv_loss: { ko:'⚠️ 스프레드 수익은 났지만 가격 변동으로 재고 손실이 더 큼', en:'⚠️ Spread profit positive but inventory loss exceeded it' },
  ana_bad:      { ko:'❌ 체결 부족 또는 수수료가 수익 초과', en:'❌ Too few fills or fees exceeded profit' },
  ana_amm_good: { ko:'✅ 수수료 수익이 비영구적 손실을 상쇄', en:'✅ Fee income offsets impermanent loss' },
  ana_amm_bad:  { ko:'⚠️ 비영구적 손실이 수수료 수익보다 큼', en:'⚠️ Impermanent loss exceeds fee income' },

  chart_total: { ko:'총 자산', en:'Total Asset' },
  chart_lp:    { ko:'LP 자산', en:'LP Asset' },
  chart_hodl:  { ko:'HODL', en:'HODL' },

  auto_pool_title: { ko:'분석할 풀 선택', en:'Select Pools to Scan' },
  auto_sel_all:    { ko:'이 페이지 전체 선택', en:'Select This Page' },
  auto_desel_all:  { ko:'이 페이지 전체 해제', en:'Deselect This Page' },
  auto_selected:   { ko:'개 선택됨', en:'selected' },
  scan_title:      { ko:'스캔 설정', en:'Scan Settings' },
  scan_simulating: { ko:'시뮬 중...', en:'Simulating...' },
  scan_sub_strat:  { ko:'분석 전략', en:'Strategy to Test' },
  scan_records:    { ko:'풀당 거래 건수', en:'Records per Pool' },
  scan_spreads:    { ko:'스프레드 옵션 (%)', en:'Spread Options (%)' },
  scan_running:    { ko:'분석 중', en:'Scanning' },
  scan_done:       { ko:'스캔 완료', en:'Scan Complete' },
  res_scan_title:  { ko:'최적화 결과', en:'Optimization Results' },
  res_scan_use:    { ko:'이 설정으로 백테스트', en:'Backtest this setup' },
  res_scan_empty:  { ko:'결과 없음 — 다시 시도해주세요', en:'No results — please retry' },
  scan_data_short: { ko:'데이터 부족', en:'Insufficient data' },
  scan_interrupted:{ ko:'중단됨', en:'interrupted' },

  auto_quota:      { ko:'자동최적화 남은 횟수', en:'Auto-optimize remaining' },
  auto_quota_over: { ko:'오늘 자동최적화 횟수를 모두 사용했습니다. 이용권 구매 시 더 이용 가능합니다.', en:'Daily auto-optimize limit reached. Subscribe for more.' },
  auto_sub_info:   { ko:'정보 탭에서 이용권 구매 →', en:'Buy Pass in Info panel →' },
  sub_active_s:    { ko:'⭐ 이용권 활성', en:'⭐ Pass Active' },

  stop_surge:     { ko:'급변 감지', en:'Surge detected' },
  stop_inv_hi:    { ko:'네이티브 재고', en:'Native inventory' },
  stop_inv_lo:    { ko:'USDC 재고', en:'USDC inventory' },
  stop_exceeded:  { ko:'초과', en:'exceeded' },
  log_buy:        { ko:'매수', en:'Buy' },
  log_sell:       { ko:'매도', en:'Sell' },
  amm_reached:    { ko:'도달', en:'reached' },
  amm_achieved:   { ko:'달성', en:'achieved' },
  amm_target_roi: { ko:'목표 수익률', en:'Target ROI' },

  pool_7d_trades: { ko:'7d거래', en:'7d trades' },
  pool_count_unit:{ ko:'건', en:'' },
  pool_est_apy:   { ko:'예상APY', en:'Est.APY' },

  opt_spread: { ko:'스프레드', en:'Spread' },
  opt_ratio:  { ko:'비율', en:'Ratio' },
  opt_fills:  { ko:'체결', en:'fills' },
};

function tr(s) { return s?.[getLang()] ?? s?.en ?? s?.ko ?? ''; }

// ── Networks (Pi DEX = testnet for now — mainnet has zero trade activity) ──
const NETWORKS = {
  stellar: { name: 'Stellar Mainnet', horizon: 'https://horizon.stellar.org', native: 'XLM' },
  pi:      { name: 'Pi DEX Testnet',  horizon: 'https://api.testnet.minepi.com', native: 'PI' },
};

// ── Auto-optimize quota (own keys, not shared with arbitrage) ──
const MM_KEYS = { AUTO_COUNT: 'mm_auto_count', AUTO_DATE: 'mm_auto_date' };
const MM_FREE_LIMIT = 30;
const MM_SUB_LIMIT  = 100;

function mmGetAutoCount() {
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(MM_KEYS.AUTO_DATE) !== today) {
    localStorage.setItem(MM_KEYS.AUTO_DATE, today);
    localStorage.setItem(MM_KEYS.AUTO_COUNT, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(MM_KEYS.AUTO_COUNT) ?? '0', 10);
}
function mmIncrementAutoCount() {
  const count = mmGetAutoCount() + 1;
  localStorage.setItem(MM_KEYS.AUTO_COUNT, String(count));
  return count;
}
function mmCanUseAuto() {
  const count = mmGetAutoCount();
  return isSubscribed() ? count < MM_FREE_LIMIT + MM_SUB_LIMIT : count < MM_FREE_LIMIT;
}
function mmRemainingAuto() {
  const count = mmGetAutoCount();
  return isSubscribed() ? Math.max(0, MM_FREE_LIMIT + MM_SUB_LIMIT - count) : Math.max(0, MM_FREE_LIMIT - count);
}

// ── CSS injection ──────────────────────────────────────
function ensureStyles() {
  if (document.getElementById('mm-styles')) return;
  const style = document.createElement('style');
  style.id = 'mm-styles';
  style.textContent = `
.mm-container .step-dots { display:flex; gap:6px; margin-bottom:6px; }
.mm-container .step-dot { flex:1; height:4px; border-radius:2px; background:var(--bg3); }
.mm-container .step-dot.active { background:var(--accent); }
.mm-container .step-dot.done { background:var(--accent2); }
.mm-container .step-label { font-size:11px; color:var(--text2); margin-bottom:14px; }
.mm-container .mm-alert { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px 12px; font-size:12px; color:var(--text2); margin-bottom:10px; }
.mm-container .mm-alert.info { border-color:var(--accent2); color:var(--text); }
.mm-container .mm-alert.error { border-color:var(--red); color:var(--red); }
.mm-container .status-text { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text2); padding:10px 0; }
.mm-container .mm-progress-bar { width:100%; height:6px; background:var(--bg3); border-radius:3px; overflow:hidden; margin:8px 0; }
.mm-container .mm-progress-fill { height:100%; background:var(--accent); width:0%; transition:width .2s ease; }
.mm-container .mm-log-list { max-height:220px; overflow-y:auto; font-size:11px; color:var(--text2); font-family:monospace; line-height:1.6; }
.mm-container .mm-log-list .log-buy  { color:var(--green); }
.mm-container .mm-log-list .log-sell { color:var(--red); }
.mm-container .mm-log-list .log-stop { color:var(--yellow); }
.mm-container .mm-chart-container { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:14px; margin-bottom:12px; }
.mm-container .mm-chart-title { font-size:12px; color:var(--text2); margin-bottom:8px; }
.mm-container .mm-chart-container canvas { max-width:100%; }
.mm-container .mm-pager { display:flex; align-items:center; justify-content:center; gap:10px; margin-top:8px; }
.mm-container .mm-pager-info { font-size:12px; color:var(--text2); }
.mm-container .param-hint { font-size:11px; color:var(--text2); margin-left:6px; font-weight:400; }
.mm-container .mm-live-roi-box { text-align:center; background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:14px 10px; margin-bottom:10px; }
.mm-container .mm-live-roi-val { font-size:1.7rem; font-weight:700; color:var(--text2); transition:color .4s; }
.mm-container .mm-live-roi-lbl { font-size:0.72rem; color:var(--text2); margin-top:3px; }
.mm-container .mm-strategy-tag { color:#fff; font-size:0.78rem; font-weight:700; padding:3px 12px; border-radius:12px; }
.mm-container .mm-form-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.mm-container .mm-nav-row { display:flex; gap:8px; margin-top:12px; }
.mm-container .mm-nav-row .btn-primary, .mm-container .mm-nav-row .btn-outline { width:auto; flex:1; }
.mm-container .mm-radio-row { display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.92rem; margin-bottom:8px; }
.mm-container .mm-radio-row input { accent-color:var(--accent); width:16px; height:16px; flex-shrink:0; }
.mm-container .mm-check-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px; }
.mm-container .mm-scan-result-row { display:flex; flex-direction:column; gap:5px; padding:12px 0; border-bottom:1px solid var(--border); }
.mm-container .mm-scan-result-row:last-child { border-bottom:none; }
.mm-container .mm-scan-result-head { display:flex; justify-content:space-between; width:100%; align-items:center; }
.mm-container .mm-scan-result-meta { font-size:0.78rem; color:var(--text2); }
`;
  document.head.appendChild(style);
}

// ── Chart.js lazy loader ───────────────────────────────
let _chartLoadPromise = null;
function loadChartJs() {
  if (window.Chart) return Promise.resolve();
  if (_chartLoadPromise) return _chartLoadPromise;
  _chartLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Chart.js load failed'));
    document.head.appendChild(s);
  });
  return _chartLoadPromise;
}

// ── Module state ───────────────────────────────────────
let rootContainer = null;
let state = null;
let poolSearchQuery = '';
let poolPage = 0;
const POOL_PAGE_SIZE = 10;
let activeChart = null;
let _fetchStop = false;
let scanSelectedIds = new Set();
let scanSelectionSet = false;
let piTotalFetched = 0;

function freshState() {
  return {
    step: 1, network: null, strategy: null, pool: null,
    params: {}, result: null, pools: [], scanParams: {}, scanResults: [],
  };
}

// ═══════════════════════════════════════════════════════
//  HORIZON API
// ═══════════════════════════════════════════════════════

function horizonBase() { return NETWORKS[state.network].horizon; }

function apiFetch(url) { return fetch(url); }

function strKeyToHex(strKey) {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = [];
  let buf = 0, bufLen = 0;
  for (const c of strKey) {
    const idx = ALPHA.indexOf(c);
    if (idx < 0) continue;
    buf = (buf << 5) | idx;
    bufLen += 5;
    if (bufLen >= 8) {
      bufLen -= 8;
      bytes.push((buf >> bufLen) & 0xff);
      buf &= (1 << bufLen) - 1;
    }
  }
  return bytes.slice(1, 33).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchPools() {
  const expertResp = await fetch('https://api.stellar.expert/explorer/public/liquidity-pool?sort=volume&order=desc&limit=200');
  if (!expertResp.ok) throw new Error(`Stellar Expert API ${expertResp.status}`);
  const expertJson = await expertResp.json();
  const expertPools = expertJson._embedded?.records || [];
  if (!expertPools.length) throw new Error('Stellar Expert empty result');

  const xlmPools = expertPools.filter(p => p.assets?.some(a => a.asset === 'XLM'));
  if (!xlmPools.length) throw new Error('No XLM pools');

  if (state.strategy === 'orderbook' || state.strategy === 'auto') {
    const active = xlmPools.filter(p => (p.trades?.['7d'] || 0) >= 100);
    const candidates = active.length >= 10 ? active : xlmPools;
    const maxTrades = Math.max(...candidates.map(p => p.trades?.['7d'] || 0)) || 1;
    const maxAcc    = Math.max(...candidates.map(p => p.accounts || 0)) || 1;
    candidates.sort((a, b) => {
      const score = p => 0.9 * ((p.trades?.['7d'] || 0) / maxTrades) + 0.1 * ((p.accounts || 0) / maxAcc);
      return score(b) - score(a);
    });
    xlmPools.length = 0;
    xlmPools.push(...candidates);
  } else {
    xlmPools.sort((a, b) => {
      const ratio = p => (p.volume_value?.['7d'] || 0) / Math.max(p.total_value_locked || 1, 1);
      return ratio(b) - ratio(a);
    });
  }

  const top50 = xlmPools.slice(0, 50);
  const expertMap = new Map(top50.map((p, i) => [strKeyToHex(p.id), { ex: p, rank: i }]));
  const base = horizonBase();
  const details = await Promise.all(
    top50.map(p => {
      const hexId = strKeyToHex(p.id);
      return apiFetch(`${base}/liquidity_pools/${hexId}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);
    })
  );

  return details.filter(p => p && hasNative(p))
    .map(p => {
      const info = expertMap.get(p.id);
      if (info) {
        p._rank     = info.rank;
        p._vol7d    = info.ex.volume_value?.['7d'] || 0;
        p._tvl      = info.ex.total_value_locked || 0;
        p._trades7d = info.ex.trades?.['7d'] || 0;
        p._accounts = info.ex.accounts || 0;
      }
      return p;
    })
    .sort((a, b) => (a._rank ?? 999) - (b._rank ?? 999));
}

function hasNative(pool) {
  return pool.reserves?.some(r => r.asset === 'native');
}

async function fetchTradesForPair(pool, total, onProgress) {
  const r0 = pool.reserves[0];
  const r1 = pool.reserves[1];
  const isNative0 = r0.asset === 'native';
  const other = isNative0 ? r1 : r0;
  const [code, issuer] = other.asset.split(':');

  const params = new URLSearchParams({
    base_asset_type:      'native',
    counter_asset_type:   code.length <= 4 ? 'credit_alphanum4' : 'credit_alphanum12',
    counter_asset_code:   code,
    counter_asset_issuer: issuer || '',
    limit: '200', order: 'desc',
  });
  return paginate(`${horizonBase()}/trades`, params, total, onProgress);
}

async function fetchTradesForPool(pool, total, onProgress) {
  const params = new URLSearchParams({ limit: '200', order: 'desc' });
  return paginate(`${horizonBase()}/liquidity_pools/${pool.id}/trades`, params, total, onProgress);
}

async function fetchWithRetry(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const r = await apiFetch(url);
    if (r.ok) return r;
    if (r.status === 503 || r.status === 429) {
      await sleep(2000 * (i + 1));
      continue;
    }
    throw new Error(`HTTP ${r.status}`);
  }
  throw new Error('HTTP 503 (retry failed)');
}

async function paginate(url, params, total, onProgress) {
  const pages = Math.ceil(total / 200);
  const all = [];
  let cursor = null;

  for (let i = 0; i < pages; i++) {
    if (_fetchStop) break;
    if (cursor) params.set('cursor', cursor);
    const r = await fetchWithRetry(`${url}?${params}`);
    const records = (await r.json())._embedded?.records || [];
    if (!records.length) break;
    all.push(...records);
    cursor = records.at(-1).paging_token;
    onProgress(all.length, total, all);
    await sleep(150);
  }
  return all.reverse();
}

function parseTrades(records) {
  return records.map(r => {
    try {
      const price = parseFloat(r.price.n) / parseFloat(r.price.d);
      return { ts: r.ledger_close_time, price, baseAmt: parseFloat(r.base_amount), counterAmt: parseFloat(r.counter_amount) };
    } catch { return null; }
  }).filter(Boolean);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPiPairs() {
  const allRecords = [];
  let cursor = null;
  for (let i = 0; i < 25; i++) {
    const url = `${horizonBase()}/trades?limit=200&order=desc${cursor ? `&cursor=${cursor}` : ''}`;
    const r = await apiFetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const records = (await r.json())._embedded?.records || [];
    if (!records.length) break;
    allRecords.push(...records);
    cursor = records.at(-1).paging_token;
    await sleep(150);
  }

  const counts = {};
  const pairMap = {};
  const records = allRecords;

  for (const rec of records) {
    const baseAsset = rec.base_asset_type === 'native' ? 'native' : `${rec.base_asset_code}:${rec.base_asset_issuer}`;
    const counterAsset = rec.counter_asset_type === 'native' ? 'native' : `${rec.counter_asset_code}:${rec.counter_asset_issuer}`;
    const id = [baseAsset, counterAsset].sort().join('|');
    counts[id] = (counts[id] || 0) + 1;
    if (!pairMap[id]) {
      pairMap[id] = { id, reserves: [{ asset: baseAsset }, { asset: counterAsset }], tradeCount: 0 };
    }
    pairMap[id].tradeCount = counts[id];
  }

  piTotalFetched = allRecords.length;
  return Object.values(pairMap).sort((a, b) => b.tradeCount - a.tradeCount);
}

async function fetchPiPools() {
  const base = horizonBase();
  const resp = await apiFetch(`${base}/liquidity_pools?limit=200&order=desc`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  const pools = (json._embedded?.records || []).filter(p => {
    if (!hasNative(p)) return false;
    const nativeAmt = parseFloat(p.reserves?.find(r => r.asset === 'native')?.amount || '0');
    return nativeAmt > 0;
  });
  if (!pools.length) throw new Error(tr(S.no_results));
  pools.sort((a, b) => {
    const nativeAmt = p => parseFloat(p.reserves?.find(r => r.asset === 'native')?.amount || '0');
    const lpDiff = (parseInt(b.total_trustlines) || 0) - (parseInt(a.total_trustlines) || 0);
    const amtDiff = nativeAmt(b) - nativeAmt(a);
    return lpDiff !== 0 ? lpDiff : amtDiff;
  });
  return pools;
}

// ═══════════════════════════════════════════════════════
//  BACKTEST: Orderbook Market Making (ported verbatim)
// ═══════════════════════════════════════════════════════

function runOrderbookBacktest(trades, p) {
  const halfSpread = p.spreadPct / 100 / 2;
  const fee        = p.feePct / 100;
  const mid0       = trades[0].price;

  let usdc   = p.totalUsdc * (p.splitRatio / 100);
  let native = (p.totalUsdc * (1 - p.splitRatio / 100)) / mid0;
  let profit = 0, fees = 0, fills = 0;
  let stopped = false, stopReason = '';
  const log = [], snapshots = [], priceWin = [];
  let stopIdx = trades.length - 1;

  for (let i = 0; i < trades.length; i++) {
    if (stopped) break;
    const mid = trades[i].price;
    priceWin.push(mid);
    if (priceWin.length > p.surgeTicks) priceWin.shift();

    if (priceWin.length >= 2) {
      const chg = Math.abs(priceWin.at(-1) - priceWin[0]) / priceWin[0] * 100;
      if (chg >= p.surgePct) {
        stopped = true; stopReason = `${tr(S.stop_surge)} (${chg.toFixed(2)}%)`;
        stopIdx = i;
        log.push({ type: 'stop', msg: stopReason }); break;
      }
    }

    const total = usdc + native * mid;
    const nativeRatio = (native * mid) / total * 100;

    if (nativeRatio > p.stopRatio) {
      stopped = true; stopReason = `${tr(S.stop_inv_hi)} ${nativeRatio.toFixed(1)}% ${tr(S.stop_exceeded)}`;
      stopIdx = i;
      log.push({ type: 'stop', msg: stopReason }); break;
    }
    if (nativeRatio < (100 - p.stopRatio)) {
      stopped = true; stopReason = `${tr(S.stop_inv_lo)} ${(100 - nativeRatio).toFixed(1)}% ${tr(S.stop_exceeded)}`;
      stopIdx = i;
      log.push({ type: 'stop', msg: stopReason }); break;
    }

    stopIdx = i;

    if (i > 0) {
      const priceUp  = mid >= trades[i - 1].price;
      const orderAmt = total * (p.orderSizePct / 100);

      for (let layer = 1; layer <= p.layers; layer++) {
        const bid      = mid * (1 - halfSpread * layer);
        const ask      = mid * (1 + halfSpread * layer);
        const layerAmt = orderAmt / p.layers;

        if (!priceUp && mid <= bid && usdc >= layerAmt) {
          const bought = layerAmt / bid;
          const f      = layerAmt * fee;
          usdc -= (layerAmt + f); native += bought; fees += f; fills++;
          log.push({ type: 'buy', msg: `↓ ${tr(S.log_buy)} ${bought.toFixed(2)} @ ${bid.toFixed(5)} (L${layer})` });
        }

        if (priceUp && mid >= ask && native * mid >= layerAmt) {
          const sold = layerAmt / ask;
          const f    = layerAmt * fee;
          usdc += (layerAmt - f); native -= sold; fees += f; fills++;
          profit += layerAmt * (p.spreadPct / 100 / p.layers) - f;
          log.push({ type: 'sell', msg: `↑ ${tr(S.log_sell)} ${sold.toFixed(2)} @ ${ask.toFixed(5)} (L${layer})` });
        }
      }
    }

    const tv = usdc + native * mid;
    snapshots.push({ i, price: mid, totalVal: tv, profit });
  }

  const finalPx  = trades[stopIdx].price;
  const totalNow = usdc + native * finalPx;
  const pnl      = totalNow - p.totalUsdc;

  return {
    type: 'orderbook',
    ticks: stopIdx + 1, fills,
    priceStart: trades[0].price, priceEnd: finalPx,
    priceChg: (finalPx - trades[0].price) / trades[0].price * 100,
    totalStart: p.totalUsdc, totalNow,
    pnl, roi: pnl / p.totalUsdc * 100,
    spreadProfit: profit, fees,
    inventoryPnl: pnl - profit,
    stopped, stopReason, log, snapshots,
  };
}

// ═══════════════════════════════════════════════════════
//  BACKTEST: AMM Liquidity Provision (ported verbatim)
// ═══════════════════════════════════════════════════════

function runAMMBacktest(pool, trades, p) {
  const r0 = pool.reserves[0], r1 = pool.reserves[1];
  const isNative0 = r0.asset === 'native';
  const nativeAmt = parseFloat(isNative0 ? r0.amount : r1.amount);
  const usdcAmt   = parseFloat(isNative0 ? r1.amount : r0.amount);

  const p0      = trades[0].price;
  const poolVal = usdcAmt + nativeAmt * p0;
  const lpShare = p.depositUsdc / poolVal;

  let totalFees = 0, exitReason = null, exitTick = trades.length - 1;
  const snapshots = [];

  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    totalFees += t.counterAmt * 0.003 * lpShare;

    const k  = t.price / p0;
    const il = (2 * Math.sqrt(k) / (1 + k) - 1) * 100;

    if (!exitReason) {
      if (Math.abs(il) >= p.maxILPct) {
        exitReason = `IL ${il.toFixed(2)}% ${tr(S.amm_reached)}`; exitTick = i; break;
      }
      const curRoi = (totalFees / p.depositUsdc * 100) + il;
      if (curRoi >= p.targetRoiPct) {
        exitReason = `${tr(S.amm_target_roi)} ${curRoi.toFixed(2)}% ${tr(S.amm_achieved)}`; exitTick = i; break;
      }
    }

    if (i % Math.max(1, Math.floor(trades.length / 100)) === 0) {
      const k2    = t.price / p0;
      const il2   = (2 * Math.sqrt(k2) / (1 + k2) - 1) * 100;
      const lpVal = p.depositUsdc * (2 * Math.sqrt(k2) / (1 + k2)) + totalFees;
      const hodl  = p.depositUsdc * (0.5 + 0.5 * k2);
      snapshots.push({ i, price: t.price, il: il2, lpVal, hodlVal: hodl });
    }
  }

  const finalPx   = trades[exitTick].price;
  const k         = finalPx / p0;
  const il        = (2 * Math.sqrt(k) / (1 + k) - 1) * 100;
  const lpFinal   = p.depositUsdc * (2 * Math.sqrt(k) / (1 + k)) + totalFees;
  const hodlFinal = p.depositUsdc * (0.5 + 0.5 * k);
  const pnl       = lpFinal - p.depositUsdc;

  return {
    type: 'amm',
    ticks: exitTick + 1,
    priceStart: p0, priceEnd: finalPx,
    priceChg: (finalPx - p0) / p0 * 100,
    totalStart: p.depositUsdc, lpFinal, hodlFinal,
    pnl, roi: pnl / p.depositUsdc * 100,
    feeIncome: totalFees, il,
    lpShare: lpShare * 100,
    exitReason, snapshots,
  };
}

// ── Helpers ────────────────────────────────────────────
function assetLabel(a) {
  return a === 'native' ? (NETWORKS[state.network]?.native || 'XLM') : a.split(':')[0];
}
function poolLabel(pool) {
  if (!pool?.reserves?.length) return pool?.id || '';
  return pool.reserves.map(r => assetLabel(r.asset)).join(' / ');
}
function fmt(n, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function valClass(n) { return n > 0 ? 'val-green' : n < 0 ? 'val-red' : ''; }
function fmtPct(n) {
  const sign = n > 0 ? '+' : '';
  return `<span class="${valClass(n)}">${sign}${fmt(n)}%</span>`;
}
function fmtUsdc(n) {
  const sign = n > 0 ? '+' : '';
  return `<span class="${valClass(n)}">${sign}${fmt(n)} USDC</span>`;
}

// ═══════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════

function renderApp() {
  if (!rootContainer) return;
  const el  = rootContainer.querySelector('#mm-content');
  const nav = rootContainer.querySelector('#mm-nav-buttons');
  renderStepIndicator();
  el.innerHTML = '';
  nav.innerHTML = '';
  if (activeChart) { activeChart.destroy(); activeChart = null; }

  const steps = [null, renderNetworkStep, renderStrategyStep, renderPoolStep,
                       renderParamsStep,  renderRunStep,      renderResultStep];
  steps[state.step]?.(el, nav);
}

function renderStepIndicator() {
  const cur = S.steps[state.step - 1];
  rootContainer.querySelector('#mm-step-indicator').innerHTML = `
    <div class="step-dots">
      ${S.steps.map((_, i) => `<div class="step-dot ${i + 1 < state.step ? 'done' : i + 1 === state.step ? 'active' : ''}"></div>`).join('')}
    </div>
    <div class="step-label">${state.step} / ${S.steps.length} — ${tr(cur)}</div>
  `;
}

function navBtns(nav, back, nextFn, nextLabel = null, disabled = false) {
  const label = nextLabel ?? `${tr(S.btn_next)} →`;
  nav.innerHTML = `
    <div class="mm-nav-row">
      ${back ? `<button class="btn-outline" onclick="window.mm_prevStep()">← ${tr(S.btn_prev)}</button>` : ''}
      ${nextFn ? `<button class="btn-primary" onclick="window.${nextFn}()" ${disabled ? 'disabled' : ''}>${label}</button>` : ''}
    </div>
  `;
}

// ── Step 1: Network ───────────────────────────────────

function renderNetworkStep(el, nav) {
  el.innerHTML = `
    <div class="page-title">${tr(S.net_title)}</div>
    <div class="pool-card ${state.network === 'stellar' ? 'selected' : ''}" onclick="window.mm_selectNetwork('stellar')">
      <div class="pool-name">${tr(S.stellar_name)}</div>
      <div class="pool-stat">${tr(S.stellar_desc)}</div>
    </div>
    <div class="pool-card ${state.network === 'pi' ? 'selected' : ''}" onclick="window.mm_selectNetwork('pi')">
      <div class="pool-name">${tr(S.pi_name)}</div>
      <div class="pool-stat">${tr(S.pi_desc)}</div>
    </div>
  `;
  navBtns(nav, false, 'mm_nextStep', null, !state.network);
}

function selectNetwork(k) {
  state.network = k; state.pool = null; state.pools = []; poolPage = 0; poolSearchQuery = '';
  renderApp();
}

// ── Step 2: Strategy ───────────────────────────────────

function renderStrategyStep(el, nav) {
  el.innerHTML = `
    <div class="page-title">${tr(S.str_title)}</div>
    <div class="pool-card ${state.strategy === 'orderbook' ? 'selected' : ''}" onclick="window.mm_selectStrategy('orderbook')">
      <div class="pool-name">${tr(S.ob_name)}</div>
      <div class="pool-stat">${tr(S.ob_desc)}</div>
    </div>
    <div class="pool-card ${state.strategy === 'amm' ? 'selected' : ''}" onclick="window.mm_selectStrategy('amm')">
      <div class="pool-name">${tr(S.amm_name)}</div>
      <div class="pool-stat">${tr(S.amm_desc)}</div>
    </div>
    <div class="pool-card ${state.strategy === 'auto' ? 'selected' : ''}" onclick="window.mm_selectStrategy('auto')">
      <div class="pool-name">${tr(S.auto_name)}</div>
      <div class="pool-stat">${tr(S.auto_desc)}</div>
    </div>
  `;
  navBtns(nav, true, 'mm_nextStep', null, !state.strategy);
}

function selectStrategy(k) {
  state.strategy = k; state.pool = null; state.pools = []; poolPage = 0;
  scanSelectedIds.clear(); scanSelectionSet = false;
  renderApp();
}

// ── Step 3: Pool / Pair selection ─────────────────────

function renderPoolStep(el, nav) {
  if (state.strategy === 'auto') { renderAutoPoolSelectStep(el, nav); return; }
  const isPi = state.network === 'pi';

  if (isPi && state.strategy === 'amm') {
    if (state.pools.length === 0) {
      el.innerHTML = `
        <div class="page-title">${tr(S.pool_title)}</div>
        <div class="status-text"><span class="spinner"></span> ${tr(S.loading_pools)}... <span id="mm-load-timer">0</span>${tr(S.sec)}</div>
      `;
      navBtns(nav, true, null);
      loadPiPools();
      return;
    }
    el.innerHTML = `
      <div class="page-title">${tr(S.pool_title)}</div>
      <div class="mm-alert info">${tr(S.sort_pi_amm)}</div>
      <input class="form-input" id="mm-pool-search" placeholder="${tr(S.search_ph)}" oninput="window.mm_filterPools()" value="${poolSearchQuery}">
      <div id="mm-pool-list" style="margin-top:10px">${poolListHtml()}</div>
    `;
    navBtns(nav, true, 'mm_nextStep', null, !state.pool);
    return;
  }

  if (isPi) {
    if (state.pools.length === 0) {
      el.innerHTML = `
        <div class="page-title">${tr(S.pair_title)}</div>
        <div class="status-text"><span class="spinner"></span> ${tr(S.loading_pairs)}... <span id="mm-load-timer">0</span>${tr(S.sec)}</div>
      `;
      navBtns(nav, true, null);
      loadPiPairs();
      return;
    }
    el.innerHTML = `
      <div class="page-title">${tr(S.pair_title)}</div>
      <div class="mm-alert info">${tr(S.pi_info)}</div>
      <div id="mm-pool-list">${piPairsHtml()}</div>
    `;
    navBtns(nav, true, 'mm_nextStep', null, !state.pool);
    return;
  }

  const sortDesc = state.strategy === 'orderbook' ? tr(S.sort_lp) : tr(S.sort_tvl);

  el.innerHTML = state.pools.length === 0
    ? `<div class="page-title">${tr(S.pool_title)}</div><div class="status-text"><span class="spinner"></span> ${tr(S.loading_pools)}... <span id="mm-load-timer">0</span>${tr(S.sec)}</div>`
    : `
      <div class="page-title">${tr(S.pool_title)}</div>
      <div class="mm-alert info">${sortDesc}</div>
      <input class="form-input" id="mm-pool-search" placeholder="${tr(S.search_ph)}" oninput="window.mm_filterPools()" value="${poolSearchQuery}">
      <div id="mm-pool-list" style="margin-top:10px">${poolListHtml()}</div>
    `;
  navBtns(nav, true, 'mm_nextStep', null, !state.pool);
  if (state.pools.length === 0) loadPools();
}

function startLoadTimer() {
  let sec = 0;
  return setInterval(() => {
    sec++;
    const elTimer = rootContainer.querySelector('#mm-load-timer');
    if (elTimer) elTimer.textContent = sec;
  }, 1000);
}

async function loadPiPairs() {
  const timer = startLoadTimer();
  try {
    const pairs = await fetchPiPairs();
    clearInterval(timer);
    if (!pairs.length) throw new Error(tr(S.no_trade_data));
    state.pools = pairs;
    renderApp();
  } catch (e) {
    clearInterval(timer);
    rootContainer.querySelector('#mm-content').innerHTML = `
      <div class="page-title">${tr(S.pair_title)}</div>
      <div class="mm-alert error">${tr(S.pair_fail)}: ${e.message}</div>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_goToStep(3)">${tr(S.btn_retry)}</button>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_goToStep(1)">${tr(S.btn_net)}</button>
    `;
  }
}

async function loadPiPools() {
  const timer = startLoadTimer();
  try {
    const pools = await fetchPiPools();
    clearInterval(timer);
    state.pools = pools;
    renderApp();
  } catch (e) {
    clearInterval(timer);
    rootContainer.querySelector('#mm-content').innerHTML = `
      <div class="page-title">${tr(S.pool_title)}</div>
      <div class="mm-alert error">${tr(S.pool_fail)}: ${e.message}</div>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_loadPiPools()">${tr(S.btn_retry)}</button>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_goToStep(1)">${tr(S.btn_net)}</button>
    `;
  }
}

async function loadPools() {
  const timer = startLoadTimer();
  try {
    const pools = await fetchPools();
    clearInterval(timer);
    if (!pools.length) throw new Error(`${tr(S.pool_fail)} (0 pools)`);
    state.pools = pools;
    renderApp();
  } catch (e) {
    clearInterval(timer);
    rootContainer.querySelector('#mm-content').innerHTML = `
      <div class="page-title">${tr(S.pool_title)}</div>
      <div class="mm-alert error">${tr(S.pool_fail)}: ${e.message}</div>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_loadPools()">${tr(S.btn_retry)}</button>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_goToStep(1)">${tr(S.btn_net)}</button>
    `;
  }
}

function selectPool(id) {
  state.pool = state.pools.find(p => p.id === id);
  renderApp();
}
function selectPiPair(encodedId) {
  const id = decodeURIComponent(encodedId);
  state.pool = state.pools.find(p => p.id === id);
  renderApp();
}

function filterPools() {
  poolSearchQuery = rootContainer.querySelector('#mm-pool-search')?.value?.toLowerCase() || '';
  poolPage = 0;
  rootContainer.querySelector('#mm-pool-list').innerHTML = poolListHtml();
}

function pagerHtml(totalItems) {
  const totalPages = Math.ceil(totalItems / POOL_PAGE_SIZE);
  if (totalPages <= 1) return '';
  return `
    <div class="mm-pager">
      <button class="page-btn" onclick="window.mm_changePage(-1)" ${poolPage === 0 ? 'disabled' : ''}>◀</button>
      <span class="mm-pager-info">${poolPage + 1} / ${totalPages}</span>
      <button class="page-btn" onclick="window.mm_changePage(1)" ${poolPage >= totalPages - 1 ? 'disabled' : ''}>▶</button>
    </div>`;
}

function changePage(dir) {
  const isPiOrderbook = state.network === 'pi' && state.strategy !== 'amm' && state.strategy !== 'auto';
  const filtered = isPiOrderbook
    ? state.pools
    : state.pools.filter(p => !poolSearchQuery || poolLabel(p).toLowerCase().includes(poolSearchQuery));
  const totalPages = Math.ceil(filtered.length / POOL_PAGE_SIZE);
  poolPage = Math.max(0, Math.min(poolPage + dir, totalPages - 1));
  if (state.strategy === 'auto') {
    rootContainer.querySelector('#mm-auto-pool-list').innerHTML = autoPoolListHtml();
  } else if (isPiOrderbook) {
    rootContainer.querySelector('#mm-pool-list').innerHTML = piPairsHtml();
  } else {
    rootContainer.querySelector('#mm-pool-list').innerHTML = poolListHtml();
  }
}

function piPairsHtml() {
  const items = state.pools;
  const start = poolPage * POOL_PAGE_SIZE;
  const page  = items.slice(start, start + POOL_PAGE_SIZE);
  return page.map(p => `
      <div class="pool-card ${state.pool?.id === p.id ? 'selected' : ''}" onclick="window.mm_selectPiPair('${encodeURIComponent(p.id)}')">
        <div class="pool-name">${poolLabel(p)}</div>
        <div class="pool-stat">${tr(S.recent_trades)}: <span style="color:var(--text)">${p.tradeCount}</span> / ${piTotalFetched.toLocaleString()}</div>
      </div>`).join('') + pagerHtml(items.length);
}

function poolListHtml() {
  const filtered = state.pools.filter(p => !poolSearchQuery || poolLabel(p).toLowerCase().includes(poolSearchQuery));
  if (!filtered.length) return `<div class="status-text">${tr(S.no_results)}</div>`;
  const start = poolPage * POOL_PAGE_SIZE;
  const page  = filtered.slice(start, start + POOL_PAGE_SIZE);
  return page.map(p => {
    const lp  = p._accounts || p.total_trustlines || '?';
    const fee = ((parseFloat(p.fee_bp || 30)) / 100).toFixed(1);
    let meta;
    if (state.network === 'pi') {
      const nativeAmt = parseFloat(p.reserves?.find(r => r.asset === 'native')?.amount || '0');
      meta = `PI ${nativeAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })} · LP <span style="color:var(--text)">${lp}</span> · ${fee}%`;
    } else if (state.strategy === 'orderbook') {
      meta = `${tr(S.pool_7d_trades)} <span style="color:var(--text)">${(p._trades7d || 0).toLocaleString()}</span>${tr(S.pool_count_unit)} · LP <span style="color:var(--text)">${lp}</span> · ${fee}%`;
    } else {
      const apy = p._tvl > 0 ? (p._vol7d / p._tvl * 0.003 * 52 * 100).toFixed(1) : '?';
      meta = `${tr(S.pool_est_apy)} <span class="val-green">${apy}%</span> · LP <span style="color:var(--text)">${lp}</span> · ${tr(S.pool_7d_trades)} ${(p._trades7d || 0).toLocaleString()}${tr(S.pool_count_unit)}`;
    }
    return `
      <div class="pool-card ${state.pool?.id === p.id ? 'selected' : ''}" onclick="window.mm_selectPool('${p.id}')">
        <div class="pool-name">${poolLabel(p)}</div>
        <div class="pool-stat">${meta}</div>
      </div>`;
  }).join('') + pagerHtml(filtered.length);
}

// ── Step 4: Parameters ─────────────────────────────────

function renderParamsStep(el, nav) {
  if (state.strategy === 'auto') { renderScanParamsStep(el, nav); return; }
  const isOB = state.strategy === 'orderbook';
  const p    = state.params;
  el.innerHTML = `
    <div class="page-title">${tr(S.param_title)}</div>
    <div class="mm-alert info">📊 ${poolLabel(state.pool)} · ${NETWORKS[state.network].name}</div>

    <div class="form-group">
      <label class="form-label">${tr(S.p_records)} <span class="param-hint">${tr(S.p_rec)}: 5,000</span></label>
      <input class="form-input" type="number" id="mm-p-records" value="${p.records || 5000}" min="200" max="10000" step="100">
    </div>

    ${isOB ? `
    <div class="form-group">
      <label class="form-label">${tr(S.p_capital)} (USDC) <span class="param-hint">${tr(S.p_rec)}: 500</span></label>
      <input class="form-input" type="number" id="mm-p-totalUsdc" value="${p.totalUsdc || 500}" min="10">
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_split)} <span class="param-hint">${tr(S.p_rec)}: 50</span></label>
        <input class="form-input" type="number" id="mm-p-splitRatio" value="${p.splitRatio || 50}" min="10" max="90">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_spread)} <span class="param-hint">${tr(S.p_rec)}: 0.3~0.5</span></label>
        <input class="form-input" type="number" id="mm-p-spreadPct" value="${p.spreadPct || 0.5}" step="0.1" min="0.1">
      </div>
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_order_size)} <span class="param-hint">${tr(S.p_rec)}: 3~5</span></label>
        <input class="form-input" type="number" id="mm-p-orderSizePct" value="${p.orderSizePct || 3}" step="0.5" min="0.5">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_layers)} <span class="param-hint">${tr(S.p_rec)}: 1~3</span></label>
        <input class="form-input" type="number" id="mm-p-layers" value="${p.layers || 1}" min="1" max="5">
      </div>
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_stop)} <span class="param-hint">${tr(S.p_rec)}: 70</span></label>
        <input class="form-input" type="number" id="mm-p-stopRatio" value="${p.stopRatio || 70}" min="51" max="99">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_fee)} <span class="param-hint">${tr(S.p_rec)}: 0 (Stellar)</span></label>
        <input class="form-input" type="number" id="mm-p-feePct" value="${p.feePct !== undefined ? p.feePct : 0}" step="0.05" min="0">
      </div>
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_surge_ticks)} <span class="param-hint">${tr(S.p_rec)}: 3~5</span></label>
        <input class="form-input" type="number" id="mm-p-surgeTicks" value="${p.surgeTicks || 3}" min="2" max="20">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_surge_pct)} <span class="param-hint">${tr(S.p_rec)}: 1~2</span></label>
        <input class="form-input" type="number" id="mm-p-surgePct" value="${p.surgePct || 1.5}" step="0.1" min="0.1">
      </div>
    </div>
    ` : `
    <div class="form-group">
      <label class="form-label">${tr(S.p_deposit)} (USDC) <span class="param-hint">${tr(S.p_rec)}: 500</span></label>
      <input class="form-input" type="number" id="mm-p-depositUsdc" value="${p.depositUsdc || 500}" min="10">
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_max_il)} <span class="param-hint">${tr(S.p_rec)}: 5~10</span></label>
        <input class="form-input" type="number" id="mm-p-maxILPct" value="${p.maxILPct || 10}" min="1" max="50">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_target_roi)} <span class="param-hint">${tr(S.p_rec)}: 3~5</span></label>
        <input class="form-input" type="number" id="mm-p-targetRoiPct" value="${p.targetRoiPct || 5}" min="0.1">
      </div>
    </div>
    `}
  `;
  navBtns(nav, true, 'mm_goToRun', `▶ ${tr(S.btn_run)}`);
}

function goToRun() {
  const isOB  = state.strategy === 'orderbook';
  const n     = id => parseFloat(rootContainer.querySelector(`#${id}`)?.value || '0');
  const ni    = id => parseInt(rootContainer.querySelector(`#${id}`)?.value || '0', 10);
  const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

  state.params = isOB ? {
    records:      clamp(ni('mm-p-records'), 200, 10000),
    totalUsdc:    n('mm-p-totalUsdc'),
    splitRatio:   n('mm-p-splitRatio'),
    spreadPct:    n('mm-p-spreadPct'),
    orderSizePct: n('mm-p-orderSizePct'),
    layers:       ni('mm-p-layers'),
    stopRatio:    n('mm-p-stopRatio'),
    feePct:       n('mm-p-feePct'),
    surgeTicks:   ni('mm-p-surgeTicks'),
    surgePct:     n('mm-p-surgePct'),
  } : {
    records:      clamp(ni('mm-p-records'), 200, 10000),
    depositUsdc:  n('mm-p-depositUsdc'),
    maxILPct:     n('mm-p-maxILPct'),
    targetRoiPct: n('mm-p-targetRoiPct'),
  };
  nextStep();
}

// ── Step 5: Run ────────────────────────────────────────

function renderRunStep(el, nav) {
  _fetchStop = false;
  if (state.strategy === 'auto') { renderAutoRunStep(el, nav); return; }
  const isOB       = state.strategy === 'orderbook';
  const stratLabel = isOB ? tr(S.ob_name) : tr(S.amm_name);
  const stratColor = isOB ? 'var(--green)' : 'var(--accent)';
  el.innerHTML = `
    <div class="page-title">${tr(S.run_title)}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <span class="mm-strategy-tag" style="background:${stratColor}">${stratLabel}</span>
      <span style="font-size:0.97rem;font-weight:600">${poolLabel(state.pool)}</span>
    </div>
    <div class="mm-live-roi-box">
      <div id="mm-live-roi" class="mm-live-roi-val">—</div>
      <div class="mm-live-roi-lbl">${tr(S.run_live_roi)}</div>
    </div>
    <div id="mm-run-status" class="status-text"><span class="spinner"></span> ${tr(S.run_start)}</div>
    <div class="mm-progress-bar"><div class="mm-progress-fill" id="mm-run-prog"></div></div>
    <div class="card" style="margin-top:12px">
      <div class="mm-log-list" id="mm-run-log"></div>
    </div>
  `;
  nav.innerHTML = `<button class="btn-outline" id="mm-btn-stop-fetch" onclick="window.mm_stopFetch()">${tr(S.btn_stop)}</button>`;
  runBacktest();
}

function stopFetch() {
  _fetchStop = true;
  const btn = rootContainer.querySelector('#mm-btn-stop-fetch');
  if (btn) btn.disabled = true;
}

async function runBacktest() {
  const log = msg => {
    const elLog = rootContainer.querySelector('#mm-run-log');
    if (elLog) elLog.innerHTML += `<div>${msg}</div>`;
  };
  const status = msg => {
    const elStatus = rootContainer.querySelector('#mm-run-status');
    if (elStatus) elStatus.innerHTML = msg;
  };
  const progress = (cur, tot, currentAll) => {
    const elProg = rootContainer.querySelector('#mm-run-prog');
    if (elProg) elProg.style.width = `${Math.min(100, cur / tot * 100)}%`;
    status(`<span class="spinner"></span> ${cur} / ${tot} ${tr(S.run_received)}`);
    if (currentAll && cur >= 100) {
      try {
        const pt = parseTrades([...currentAll].reverse());
        if (pt.length >= 10) {
          const pv = state.strategy === 'orderbook'
            ? runOrderbookBacktest(pt, state.params)
            : runAMMBacktest(state.pool, pt, state.params);
          const roi = pv.roi;
          const color = roi >= 0 ? 'var(--green)' : 'var(--red)';
          const lv = rootContainer.querySelector('#mm-live-roi');
          if (lv) lv.innerHTML = `<span style="color:${color}">${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%</span>`;
        }
      } catch (_) {}
    }
  };

  try {
    const total = state.params.records;
    log(`→ ${poolLabel(state.pool)} · ${total} ${tr(S.run_req)}`);

    const fetchFn = state.strategy === 'amm' ? fetchTradesForPool : fetchTradesForPair;
    const records = await fetchFn(state.pool, total, progress);

    rootContainer.querySelector('#mm-nav-buttons').innerHTML = '';

    if (_fetchStop) {
      log(`⚠ ${records.length} ${tr(S.run_received)} (${tr(S.scan_interrupted)})`);
    } else {
      log(`✓ ${records.length} ${tr(S.run_received)}`);
    }

    const trades = parseTrades(records);
    log(`✓ ${tr(S.run_valid)} ${trades.length}`);

    if (trades.length < 10) throw new Error(tr(S.run_too_few));

    status(`<span class="spinner"></span> ${tr(S.run_running)}`);
    await sleep(30);

    state.result = state.strategy === 'orderbook'
      ? runOrderbookBacktest(trades, state.params)
      : runAMMBacktest(state.pool, trades, state.params);

    log(`✓ ${tr(S.run_complete)}`);
    rootContainer.querySelector('#mm-run-prog').style.width = '100%';
    status(tr(S.run_done));
    await sleep(400);
    nextStep();

  } catch (e) {
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = '';
    status(`<div class="mm-alert error">${tr(S.run_error)}: ${e.message}</div>`);
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = `
      <div class="mm-nav-row">
        <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
        <button class="btn-primary" onclick="window.mm_goToStep(5)">${tr(S.btn_retry)}</button>
      </div>
    `;
  }
}

// ── Step 6: Results ────────────────────────────────────

function renderResultStep(el, nav) {
  if (state.strategy === 'auto') { renderScanResultStep(el, nav); return; }
  const r = state.result;
  if (!r) { el.innerHTML = `<div class="mm-alert error">${tr(S.res_none)}</div>`; return; }

  el.innerHTML = r.type === 'orderbook' ? obResultHtml(r) : ammResultHtml(r);
  nav.innerHTML = `
    <div class="mm-nav-row">
      <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
      <button class="btn-primary" onclick="window.mm_goToStep(1)">${tr(S.btn_new)}</button>
    </div>
  `;

  requestAnimationFrame(() => drawChart(r));
}

function obResultHtml(r) {
  return `
    <div class="mm-alert info">📊 ${poolLabel(state.pool)} · ${NETWORKS[state.network].name}</div>
    <div class="card">
      <div class="card-title">${tr(S.res_summary)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_pnl)}</span><div>${fmtPct(r.roi)} &nbsp; ${fmtUsdc(r.pnl)}</div></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_spread)}</span>${fmtUsdc(r.spreadProfit)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_inv)}</span>${fmtUsdc(r.inventoryPnl)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_fees)}</span><span class="${r.fees >= 0.005 ? 'val-red' : ''}">${r.fees >= 0.005 ? '-' : ''}${fmt(r.fees)} USDC</span></div>
    </div>
    <div class="card">
      <div class="card-title">${tr(S.res_stats)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_fills)}</span><span class="stat-value">${r.fills}</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_ticks)}</span><span class="stat-value">${r.ticks}</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_price_chg)}</span>${fmtPct(r.priceChg)}</div>
      ${r.stopped ? `<div class="stat-row"><span class="stat-label">${tr(S.res_stop)}</span><span class="val-red">${r.stopReason}</span></div>` : ''}
    </div>
    <div class="mm-chart-container">
      <div class="mm-chart-title">${tr(S.res_asset_chart)}</div>
      <canvas id="mm-result-chart"></canvas>
    </div>
    <div class="card">
      <div class="card-title">${tr(S.res_log)}</div>
      <div class="mm-log-list">
        ${r.log.slice(-20).map(l => `<div class="log-${l.type}">${l.msg}</div>`).join('') || `<div>${tr(S.res_no_fills)}</div>`}
      </div>
    </div>
    ${analysisHtml(r)}
  `;
}

function ammResultHtml(r) {
  const hodlRoi = (r.hodlFinal - r.totalStart) / r.totalStart * 100;
  return `
    <div class="mm-alert info">📊 ${poolLabel(state.pool)} · ${NETWORKS[state.network].name}</div>
    <div class="card">
      <div class="card-title">${tr(S.res_lp_title)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_lp_pnl)}</span><div>${fmtPct(r.roi)} &nbsp; ${fmtUsdc(r.pnl)}</div></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_fee_inc)}</span><span class="val-green">+${fmt(r.feeIncome)} USDC</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_il)}</span><span class="${r.il < 0 ? 'val-red' : ''}">${fmt(r.il)}%</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_vs_hodl)}</span>${fmtPct(r.roi - hodlRoi)}</div>
    </div>
    <div class="card">
      <div class="card-title">${tr(S.res_stats)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_ticks)}</span><span class="stat-value">${r.ticks}</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_price_chg)}</span>${fmtPct(r.priceChg)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_lp_share)}</span><span class="stat-value">${fmt(r.lpShare, 4)}%</span></div>
      ${r.exitReason ? `<div class="stat-row"><span class="stat-label">${tr(S.res_exit)}</span><span class="stat-value">${r.exitReason}</span></div>` : ''}
    </div>
    <div class="mm-chart-container">
      <div class="mm-chart-title">${tr(S.res_lp_chart)}</div>
      <canvas id="mm-result-chart"></canvas>
    </div>
    ${analysisHtml(r)}
  `;
}

function analysisHtml(r) {
  let s;
  if (r.type === 'orderbook') {
    if (r.fills === 0) s = S.ana_no_fills;
    else if (r.roi > 0 && r.spreadProfit > 0) s = S.ana_good;
    else if (r.spreadProfit > 0 && r.roi < 0) s = S.ana_inv_loss;
    else s = S.ana_bad;
  } else {
    s = r.feeIncome > Math.abs(r.il / 100 * r.totalStart) ? S.ana_amm_good : S.ana_amm_bad;
  }
  return `<div class="mm-alert info">${tr(s)}</div>`;
}

async function drawChart(r) {
  const canvas = rootContainer?.querySelector('#mm-result-chart');
  if (!canvas || !r.snapshots?.length) return;
  try { await loadChartJs(); } catch { return; }
  if (!window.Chart) return;

  const raw  = r.snapshots;
  const step = Math.max(1, Math.floor(raw.length / 200));
  const snaps = raw.filter((_, i) => i % step === 0);

  const labels = snaps.map(s => s.i);
  const datasets = r.type === 'orderbook'
    ? [{ label: tr(S.chart_total), data: snaps.map(s => s.totalVal), borderColor: '#7c6af7', tension: 0.3, pointRadius: 0 }]
    : [
        { label: tr(S.chart_lp),   data: snaps.map(s => s.lpVal),   borderColor: '#7c6af7', tension: 0.3, pointRadius: 0 },
        { label: tr(S.chart_hodl), data: snaps.map(s => s.hodlVal), borderColor: '#f5c542', tension: 0.3, pointRadius: 0, borderDash: [5, 5] },
      ];

  if (activeChart) activeChart.destroy();
  activeChart = new window.Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#8b90a8', font: { size: 11 } } } },
      scales: {
        x: { display: false },
        y: { ticks: { color: '#8b90a8', font: { size: 10 } }, grid: { color: '#2e3248' } },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════
//  AUTO OPTIMIZE
// ═══════════════════════════════════════════════════════

function renderAutoPoolSelectStep(el, nav) {
  if (state.pools.length === 0) {
    el.innerHTML = `
      <div class="page-title">${tr(S.auto_pool_title)}</div>
      <div class="status-text"><span class="spinner"></span> ${tr(S.loading_pools)}... <span id="mm-load-timer">0</span>${tr(S.sec)}</div>
    `;
    navBtns(nav, true, null);
    if (state.network === 'pi') loadPiPairs(); else loadPools();
    return;
  }
  if (!scanSelectionSet) {
    state.pools.slice(0, 10).forEach(p => scanSelectedIds.add(p.id));
    scanSelectionSet = true;
  }
  const selCount = scanSelectedIds.size;
  el.innerHTML = `
    <div class="page-title">${tr(S.auto_pool_title)}</div>
    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
      <button class="btn-outline" style="width:auto;padding:5px 12px;font-size:0.8rem" onclick="window.mm_scanSelectAll()">${tr(S.auto_sel_all)}</button>
      <button class="btn-outline" style="width:auto;padding:5px 12px;font-size:0.8rem" onclick="window.mm_scanDeselectAll()">${tr(S.auto_desel_all)}</button>
      <span id="mm-scan-sel-badge" style="font-size:0.82rem;color:var(--accent2)"><strong>${selCount}</strong> ${tr(S.auto_selected)}</span>
    </div>
    <input class="form-input" id="mm-pool-search" placeholder="${tr(S.search_ph)}" oninput="window.mm_filterAutoPool()" value="${poolSearchQuery}">
    <div id="mm-auto-pool-list" style="margin-top:10px">${autoPoolListHtml()}</div>
  `;
  navBtns(nav, true, 'mm_nextStep', null, selCount === 0);
}

function autoPoolListHtml() {
  const filtered = state.pools.filter(p => !poolSearchQuery || poolLabel(p).toLowerCase().includes(poolSearchQuery));
  if (!filtered.length) return `<div class="status-text">${tr(S.no_results)}</div>`;
  const start = poolPage * POOL_PAGE_SIZE;
  const page  = filtered.slice(start, start + POOL_PAGE_SIZE);
  return page.map(p => `
    <div class="pool-card ${scanSelectedIds.has(p.id) ? 'selected' : ''}" onclick="window.mm_toggleScanPool('${p.id}')">
      <div style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" ${scanSelectedIds.has(p.id) ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent);flex-shrink:0;pointer-events:none">
        <div>
          <div class="pool-name">${poolLabel(p)}</div>
          <div class="pool-stat">${state.network === 'pi'
            ? `${tr(S.recent_trades)}: <span style="color:var(--text)">${p.tradeCount}</span> / ${piTotalFetched.toLocaleString()}`
            : `${tr(S.pool_7d_trades)} <span style="color:var(--text)">${(p._trades7d || 0).toLocaleString()}</span>${tr(S.pool_count_unit)} · LP <span style="color:var(--text)">${p._accounts || '?'}</span>`
          }</div>
        </div>
      </div>
    </div>`).join('') + pagerHtml(filtered.length);
}

function filterAutoPool() {
  poolSearchQuery = rootContainer.querySelector('#mm-pool-search')?.value?.toLowerCase() || '';
  poolPage = 0;
  rootContainer.querySelector('#mm-auto-pool-list').innerHTML = autoPoolListHtml();
  const badge = rootContainer.querySelector('#mm-scan-sel-badge');
  if (badge) badge.innerHTML = `<strong>${scanSelectedIds.size}</strong> ${tr(S.auto_selected)}`;
  navBtns(rootContainer.querySelector('#mm-nav-buttons'), true, 'mm_nextStep', null, scanSelectedIds.size === 0);
}

function toggleScanPool(id) {
  if (scanSelectedIds.has(id)) scanSelectedIds.delete(id);
  else scanSelectedIds.add(id);
  rootContainer.querySelector('#mm-auto-pool-list').innerHTML = autoPoolListHtml();
  const badge = rootContainer.querySelector('#mm-scan-sel-badge');
  if (badge) badge.innerHTML = `<strong>${scanSelectedIds.size}</strong> ${tr(S.auto_selected)}`;
  navBtns(rootContainer.querySelector('#mm-nav-buttons'), true, 'mm_nextStep', null, scanSelectedIds.size === 0);
}

function currentPagePools() {
  const filtered = state.pools.filter(p => !poolSearchQuery || poolLabel(p).toLowerCase().includes(poolSearchQuery));
  return filtered.slice(poolPage * POOL_PAGE_SIZE, (poolPage + 1) * POOL_PAGE_SIZE);
}
function scanSelectAll() {
  currentPagePools().forEach(p => scanSelectedIds.add(p.id));
  scanSelectionSet = true;
  renderApp();
}
function scanDeselectAll() {
  currentPagePools().forEach(p => scanSelectedIds.delete(p.id));
  scanSelectionSet = true;
  renderApp();
}

// ── Step 4 (auto): Scan settings ──────────────────────

function quotaBarHtml() {
  const subbed = isSubscribed();
  const remaining = mmRemainingAuto();
  const total = subbed ? MM_FREE_LIMIT + MM_SUB_LIMIT : MM_FREE_LIMIT;
  const cls = subbed ? 'info' : remaining > 0 ? 'info' : 'error';
  const text = subbed
    ? `${tr(S.sub_active_s)}: ${remaining} / ${total}`
    : remaining > 0
      ? `${tr(S.auto_quota)}: ${remaining} / ${total}`
      : `${tr(S.auto_quota_over)}<br><button onclick="window._toggleInfo && window._toggleInfo()" style="margin-top:6px;background:none;border:none;color:var(--accent2);cursor:pointer;font-size:0.8rem;padding:0;">${tr(S.auto_sub_info)}</button>`;
  return `<div id="mm-auto-quota-bar" class="mm-alert ${cls}" style="margin-top:12px">${text}</div>`;
}

function renderScanParamsStep(el, nav) {
  const isPi = state.network === 'pi';
  const p    = state.scanParams;
  const sub  = p.subStrategy || 'orderbook';
  el.innerHTML = `
    <div class="page-title" id="mm-scan-section-title">${sub === 'amm' ? 'AMM' : 'MM'} ${tr(S.scan_title)}</div>
    <div class="mm-alert info">📊 ${scanSelectedIds.size} ${tr(S.auto_selected)} · ${NETWORKS[state.network].name}</div>

    <div class="form-group">
      <label class="form-label">${tr(S.scan_sub_strat)}</label>
      <label class="mm-radio-row">
        <input type="radio" name="mm-scan-strat" value="orderbook" ${sub === 'orderbook' ? 'checked' : ''} onchange="window.mm_updateScanSpreadOpts(this.value)">
        <span>${tr(S.ob_name)}</span>
      </label>
      ${!isPi ? `<label class="mm-radio-row">
        <input type="radio" name="mm-scan-strat" value="amm" ${sub === 'amm' ? 'checked' : ''} onchange="window.mm_updateScanSpreadOpts(this.value)">
        <span>${tr(S.amm_name)}</span>
      </label>` : ''}
    </div>

    <div class="form-group">
      <label class="form-label">${tr(S.scan_records)} <span class="param-hint">${tr(S.p_rec)}: 2,000</span></label>
      <input class="form-input" type="number" id="mm-scan-records" value="${p.records || 2000}" min="200" max="5000" step="100">
    </div>

    <div id="mm-scan-spread-opts">${sub === 'orderbook' ? scanSpreadOptsHtml(p.spreadOptions) : ''}</div>

    ${quotaBarHtml()}
  `;
  navBtns(nav, true, 'mm_goToScanRun', `▶ ${tr(S.btn_run)}`, !mmCanUseAuto());
}

function scanSpreadOptsHtml(selected) {
  const opts = [0.3, 0.5, 1.0, 1.5, 2.0];
  const sel  = selected || opts;
  return `<div class="form-group">
    <label class="form-label">${tr(S.scan_spreads)}</label>
    <div class="mm-check-grid">
      ${opts.map(v => {
        const id = `mm-spread-${String(v).replace('.', '_')}`;
        return `<label class="mm-radio-row" style="margin-bottom:0">
          <input type="checkbox" id="${id}" ${sel.includes(v) ? 'checked' : ''}>
          <span>${v}%</span>
        </label>`;
      }).join('')}
    </div>
  </div>`;
}

function updateScanSpreadOpts(val) {
  const elOpts = rootContainer.querySelector('#mm-scan-spread-opts');
  if (elOpts) elOpts.innerHTML = val === 'orderbook' ? scanSpreadOptsHtml(null) : '';
  const titleEl = rootContainer.querySelector('#mm-scan-section-title');
  if (titleEl) titleEl.textContent = `${val === 'amm' ? 'AMM' : 'MM'} ${tr(S.scan_title)}`;
}

function goToScanRun() {
  const subStrat = rootContainer.querySelector('input[name="mm-scan-strat"]:checked')?.value || 'orderbook';
  const records  = Math.max(200, Math.min(2000, parseInt(rootContainer.querySelector('#mm-scan-records')?.value || '500', 10)));
  const spreadOptions = subStrat === 'orderbook'
    ? [0.3, 0.5, 1.0, 1.5, 2.0].filter(v => rootContainer.querySelector(`#mm-spread-${String(v).replace('.', '_')}`)?.checked)
    : null;
  state.scanParams = { subStrategy: subStrat, records, capital: 500, spreadOptions: spreadOptions?.length ? spreadOptions : [0.5] };
  nextStep();
}

// ── Step 5 (auto): Scan run ────────────────────────────

function renderAutoRunStep(el, nav) {
  const sub = state.scanParams?.subStrategy || 'orderbook';
  el.innerHTML = `
    <div class="page-title">${sub === 'amm' ? 'AMM' : 'MM'} ${tr(S.scan_simulating)}</div>
    <div id="mm-run-status" class="status-text"><span class="spinner"></span> ${tr(S.scan_running)}...</div>
    <div class="mm-progress-bar"><div class="mm-progress-fill" id="mm-run-prog"></div></div>
    <div class="card" style="margin-top:12px">
      <div class="mm-log-list" id="mm-run-log"></div>
    </div>
  `;
  nav.innerHTML = `<button class="btn-outline" id="mm-btn-stop-fetch" onclick="window.mm_stopFetch()">${tr(S.btn_stop)}</button>`;
  runAutoScan();
}

async function runAutoScan() {
  if (!mmCanUseAuto()) {
    rootContainer.querySelector('#mm-run-status').innerHTML = `<div class="mm-alert error">${tr(S.auto_quota_over)}</div>`;
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = `
      <div class="mm-nav-row">
        <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
        <button class="btn-primary" onclick="window._toggleInfo && window._toggleInfo()">${tr(S.auto_sub_info)}</button>
      </div>
    `;
    return;
  }

  const { subStrategy, records, capital, spreadOptions } = state.scanParams;
  const log     = msg => { const elLog = rootContainer.querySelector('#mm-run-log'); if (elLog) elLog.innerHTML += `<div>${msg}</div>`; };
  const status  = msg => { const elStatus = rootContainer.querySelector('#mm-run-status'); if (elStatus) elStatus.innerHTML = msg; };
  const setProg = (cur, tot) => {
    const elProg = rootContainer.querySelector('#mm-run-prog');
    if (elProg) elProg.style.width = `${Math.min(100, cur / tot * 100)}%`;
  };

  mmIncrementAutoCount();
  const selected = state.pools.filter(p => scanSelectedIds.has(p.id));
  state.scanResults = [];

  try {
    for (let i = 0; i < selected.length; i++) {
      if (_fetchStop) break;
      const pool  = selected[i];
      const label = poolLabel(pool);
      status(`<span class="spinner"></span> [${i + 1}/${selected.length}] ${label} — ${tr(S.scan_running)}...`);
      setProg(i, selected.length);

      let tradeRecords;
      try {
        const fetchFn = subStrategy === 'amm' ? fetchTradesForPool : fetchTradesForPair;
        tradeRecords  = await fetchFn(pool, records, () => {});
      } catch (e) {
        log(`✗ ${label}: ${e.message}`);
        continue;
      }

      const trades = parseTrades(tradeRecords);
      if (trades.length < 10) { log(`✗ ${label}: ${tr(S.scan_data_short)} (${trades.length}${tr(S.pool_count_unit)})`); continue; }

      let bestRoi = -Infinity, bestResult = null, bestParams = null;

      if (subStrategy === 'orderbook') {
        for (const spread of spreadOptions) {
          for (const split of [40, 50, 60]) {
            const p = {
              records, totalUsdc: capital, splitRatio: split, spreadPct: spread,
              orderSizePct: 3, layers: 1, stopRatio: 70, feePct: 0.3, surgeTicks: 3, surgePct: 1.5,
            };
            const r = runOrderbookBacktest(trades, p);
            if (r.roi > bestRoi) { bestRoi = r.roi; bestResult = r; bestParams = p; }
          }
        }
      } else {
        for (const maxIL of [5, 10, 20]) {
          for (const targetRoi of [3, 5, 10]) {
            const p = { records, depositUsdc: capital, maxILPct: maxIL, targetRoiPct: targetRoi };
            const r = runAMMBacktest(pool, trades, p);
            if (r.roi > bestRoi) { bestRoi = r.roi; bestResult = r; bestParams = p; }
          }
        }
      }

      if (bestResult) {
        state.scanResults.push({ pool, params: bestParams, result: bestResult, roi: bestRoi, label });
        const roiStr = bestRoi.toFixed(1);
        const hint   = subStrategy === 'orderbook'
          ? `${tr(S.opt_spread)} ${bestParams.spreadPct}% · ${tr(S.opt_ratio)} ${bestParams.splitRatio}:${100 - bestParams.splitRatio}`
          : `IL ${bestParams.maxILPct}% · ${tr(S.amm_target_roi)} ${bestParams.targetRoiPct}%`;
        log(`✓ ${label}: ROI <strong style="color:${bestRoi >= 0 ? 'var(--green)' : 'var(--red)'}">${roiStr}%</strong> (${hint})`);
      }

      if (i < selected.length - 1) await sleep(800);
    }

    state.scanResults.sort((a, b) => b.roi - a.roi);
    setProg(selected.length, selected.length);
    status(tr(S.scan_done));
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = '';
    await sleep(400);
    nextStep();

  } catch (e) {
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = '';
    status(`<div class="mm-alert error">${tr(S.run_error)}: ${e.message}</div>`);
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = `
      <div class="mm-nav-row">
        <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
        <button class="btn-primary" onclick="window.mm_goToStep(5)">${tr(S.btn_retry)}</button>
      </div>
    `;
  }
}

// ── Step 6 (auto): Results ─────────────────────────────

function renderScanResultStep(el, nav) {
  const results     = state.scanResults;
  const subStrategy = state.scanParams.subStrategy;

  if (!results.length) {
    el.innerHTML = `<div class="page-title">${tr(S.res_scan_title)}</div><div class="mm-alert error">${tr(S.res_scan_empty)}</div>`;
    nav.innerHTML = `<button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>`;
    return;
  }

  el.innerHTML = `
    <div class="page-title">${tr(S.res_scan_title)}</div>
    <div class="card">
      ${results.map((r, idx) => {
        const roi       = r.roi.toFixed(1);
        const roiClass  = r.roi >= 0 ? 'val-green' : 'val-red';
        const paramLine = subStrategy === 'orderbook'
          ? `${tr(S.opt_spread)} ${r.params.spreadPct}% · ${tr(S.opt_ratio)} ${r.params.splitRatio}:${100 - r.params.splitRatio}`
          : `IL ${r.params.maxILPct}% · ${tr(S.amm_target_roi)} ${r.params.targetRoiPct}%`;
        const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : `#${idx + 1} `;
        return `
          <div class="mm-scan-result-row">
            <div class="mm-scan-result-head">
              <span style="font-weight:600">${medal}${r.label}</span>
              <span class="${roiClass}">${roi}%</span>
            </div>
            <div class="mm-scan-result-meta">${paramLine} · ${r.result.fills ?? ''} ${subStrategy === 'orderbook' ? tr(S.opt_fills) : ''}</div>
            <button class="btn-primary" style="width:auto;padding:5px 12px;font-size:0.8rem;margin-top:3px" onclick="window.mm_useScanResult(${idx})">${tr(S.res_scan_use)}</button>
          </div>`;
      }).join('')}
    </div>
  `;
  nav.innerHTML = `
    <div class="mm-nav-row">
      <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
      <button class="btn-primary" onclick="window.mm_goToStep(1)">${tr(S.btn_new)}</button>
    </div>
  `;
}

function useScanResult(idx) {
  const r = state.scanResults[idx];
  state.strategy = state.scanParams.subStrategy;
  state.pool     = r.pool;
  state.params   = { ...r.params, records: state.scanParams.records };
  goToStep(4);
}

// ═══════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════

function nextStep() { state.step = Math.min(6, state.step + 1); renderApp(); }
function prevStep() { state.step = Math.max(1, state.step - 1); renderApp(); }
function goToStep(n) { state.step = n; renderApp(); }

// ═══════════════════════════════════════════════════════
//  ENTRY POINT
// ═══════════════════════════════════════════════════════

export function renderMM(container) {
  ensureStyles();
  rootContainer = container;
  state = freshState();
  poolSearchQuery = '';
  poolPage = 0;
  activeChart = null;
  _fetchStop = false;
  scanSelectedIds = new Set();
  scanSelectionSet = false;
  piTotalFetched = 0;

  container.innerHTML = `
    <div class="mm-container">
      <div id="mm-step-indicator"></div>
      <div id="mm-content"></div>
      <div id="mm-nav-buttons"></div>
    </div>
  `;

  window.mm_selectNetwork      = selectNetwork;
  window.mm_selectStrategy     = selectStrategy;
  window.mm_nextStep           = nextStep;
  window.mm_prevStep           = prevStep;
  window.mm_goToStep           = goToStep;
  window.mm_filterPools        = filterPools;
  window.mm_changePage         = changePage;
  window.mm_selectPool         = selectPool;
  window.mm_selectPiPair       = selectPiPair;
  window.mm_loadPiPools        = loadPiPools;
  window.mm_loadPools          = loadPools;
  window.mm_goToRun            = goToRun;
  window.mm_stopFetch          = stopFetch;
  window.mm_scanSelectAll      = scanSelectAll;
  window.mm_scanDeselectAll    = scanDeselectAll;
  window.mm_toggleScanPool     = toggleScanPool;
  window.mm_filterAutoPool     = filterAutoPool;
  window.mm_updateScanSpreadOpts = updateScanSpreadOpts;
  window.mm_goToScanRun        = goToScanRun;
  window.mm_useScanResult      = useScanResult;

  renderApp();
}
