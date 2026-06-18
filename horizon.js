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
  const toDateKey = d => d.toISOString().slice(0, 10);
  const todayKey  = toDateKey(now);
  const yestKey   = toDateKey(new Date(now - 1 * 24 * 60 * 60 * 1000));
  const d2Key     = toDateKey(new Date(now - 2 * 24 * 60 * 60 * 1000));
  const cutoff    = new Date(now - 3 * 24 * 60 * 60 * 1000);

  const counts  = { today: 0, yesterday: 0, dayBefore: 0 };
  const volumes = { today: 0, yesterday: 0, dayBefore: 0 };

  let url     = `${HORIZON}/trades?limit=200&order=desc`;
  let done    = false;
  let fetched = 0;

  while (url && !done && fetched < 3000) {
    const res     = await fetch(url);
    const data    = await res.json();
    const records = data._embedded?.records ?? [];
    if (records.length === 0) break;

    for (const t of records) {
      const d = new Date(t.ledger_close_time);
      if (d < cutoff) { done = true; break; }

      const key = toDateKey(d);
      let pi = 0;
      if (t.base_asset_type    === 'native') pi += parseFloat(t.base_amount    || 0);
      if (t.counter_asset_type === 'native') pi += parseFloat(t.counter_amount || 0);

      if (key === todayKey) { counts.today++;     volumes.today     += pi; }
      else if (key === yestKey) { counts.yesterday++; volumes.yesterday += pi; }
      else if (key === d2Key)   { counts.dayBefore++; volumes.dayBefore += pi; }
    }

    fetched += records.length;
    const next = data._links?.next?.href;
    if (!next || records.length === 0) break;
    url = next;
  }

  return { counts, volumes, keys: { todayKey, yestKey, d2Key } };
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
