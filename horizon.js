const HORIZON = 'https://api.testnet.minepi.com';

async function get(path) {
  const res = await fetch(`${HORIZON}${path}`);
  if (!res.ok) throw new Error(`Horizon 오류: ${res.status}`);
  return res.json();
}

export async function fetchAccount(address) {
  const data     = await get(`/accounts/${address}`);
  const pi       = data.balances.find(b => b.asset_type === 'native');
  const tokens   = data.balances.filter(b => b.asset_type !== 'native' && b.asset_type !== 'liquidity_pool_shares');
  const lpShares = data.balances.filter(b => b.asset_type === 'liquidity_pool_shares');
  return { pi: parseFloat(pi?.balance ?? 0), tokens, lpShares, raw: data };
}

export async function fetchPools(maxPools = 2000) {
  const all = [];
  let url = `${HORIZON}/liquidity_pools?limit=200&order=desc`;

  while (url && all.length < maxPools) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Horizon 오류: ${res.status}`);
    const data = await res.json();
    const records = data._embedded?.records ?? [];
    all.push(...records.map(parsePool));
    const next = data._links?.next?.href;
    if (!next || records.length === 0) break;
    url = next;
  }

  return all;
}

function parsePool(p) {
  const [assetA, assetB] = p.reserves;
  const assetAId = assetA.asset === 'native' ? 'Pi' : assetA.asset;
  const assetBId = assetB.asset === 'native' ? 'Pi' : assetB.asset;
  return {
    id:          p.id,
    assetA:      assetAId === 'Pi' ? 'Pi' : assetAId.split(':')[0],
    assetB:      assetBId === 'Pi' ? 'Pi' : assetBId.split(':')[0],
    assetAId,
    assetBId,
    reserveA:    parseFloat(assetA.amount),
    reserveB:    parseFloat(assetB.amount),
    totalShares: parseFloat(p.total_shares),
    fee_bp:      parseInt(p.fee_bp ?? 30),
    tradeCount:  parseInt(p.trade_count ?? 0),
    raw:         p,
  };
}

export async function fetchTradeStats() {
  const now = new Date();
  const cutoffs = {
    day:     new Date(now - 1  * 24 * 60 * 60 * 1000),
    week:    new Date(now - 7  * 24 * 60 * 60 * 1000),
    month:   new Date(now - 30 * 24 * 60 * 60 * 1000),
    quarter: new Date(now - 90 * 24 * 60 * 60 * 1000),
  };

  const counts  = { day: 0, week: 0, month: 0, quarter: 0 };
  const volumes = { day: 0, week: 0, month: 0, quarter: 0 };

  let url     = `${HORIZON}/trades?limit=200&order=desc`;
  let done    = false;
  let fetched = 0;

  while (url && !done && fetched < 50000) {
    const res     = await fetch(url);
    const data    = await res.json();
    const records = data._embedded?.records ?? [];
    if (records.length === 0) break;

    for (const t of records) {
      const d = new Date(t.ledger_close_time);
      if (d < cutoffs.quarter) { done = true; break; }

      let pi = 0;
      if (t.base_asset_type    === 'native') pi += parseFloat(t.base_amount    || 0);
      if (t.counter_asset_type === 'native') pi += parseFloat(t.counter_amount || 0);

      if (d >= cutoffs.day)   { counts.day++;     volumes.day     += pi; }
      if (d >= cutoffs.week)  { counts.week++;    volumes.week    += pi; }
      if (d >= cutoffs.month) { counts.month++;   volumes.month   += pi; }
      counts.quarter++;  volumes.quarter += pi;
    }

    fetched += records.length;
    const next = data._links?.next?.href;
    if (!next || records.length === 0) break;
    url = next;
  }

  return { counts, volumes };
}

export async function fetchPoolById(poolId) {
  const p = await get(`/liquidity_pools/${poolId}`);
  return parsePool(p);
}

export async function fetchRecommendedFee() {
  try {
    const data = await get('/fee_stats');
    return parseInt(data.fee_charged.p50 ?? 10000);
  } catch {
    return 10000;
  }
}

export async function submitTransaction(txXdr) {
  const res = await fetch(`${HORIZON}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tx=${encodeURIComponent(txXdr)}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.extras?.result_codes?.transaction ?? '트랜잭션 실패');
  return data;
}

export const HORIZON_URL = HORIZON;
