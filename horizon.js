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
  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo  = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const dailyCount  = {};
  const dailyVolume = {};
  let url  = `${HORIZON}/trades?limit=200&order=desc`;
  let done = false;
  let fetched = 0;

  while (url && !done && fetched < 10000) {
    const res     = await fetch(url);
    const data    = await res.json();
    const records = data._embedded?.records ?? [];
    if (records.length === 0) break;

    for (const t of records) {
      const d = new Date(t.ledger_close_time);
      if (d < weekAgo) { done = true; break; }
      const key = t.ledger_close_time.slice(0, 10);
      dailyCount[key]  = (dailyCount[key]  || 0) + 1;
      let pi = 0;
      if (t.base_asset_type    === 'native') pi += parseFloat(t.base_amount    || 0);
      if (t.counter_asset_type === 'native') pi += parseFloat(t.counter_amount || 0);
      dailyVolume[key] = (dailyVolume[key] || 0) + pi;
    }

    fetched += records.length;
    const next = data._links?.next?.href;
    if (!next || records.length === 0) break;
    url = next;
  }

  const days        = Object.keys(dailyCount);
  const totalCount  = days.reduce((s, k) => s + dailyCount[k],  0);
  const totalVolume = days.reduce((s, k) => s + dailyVolume[k], 0);
  const avgCount    = days.length ? Math.round(totalCount  / 7) : 0;
  const avgVolume   = days.length ? Math.round(totalVolume / 7) : 0;

  return {
    todayCount:  dailyCount[todayStr]  || 0,
    todayVolume: dailyVolume[todayStr] || 0,
    weeklyAvgCount:  avgCount,
    weeklyAvgVolume: avgVolume,
  };
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
