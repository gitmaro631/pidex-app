// PiDEX 테스트넷 Horizon API

const HORIZON = 'https://api.testnet.minepi.com';

async function get(path) {
  const res = await fetch(`${HORIZON}${path}`);
  if (!res.ok) throw new Error(`Horizon 오류: ${res.status}`);
  return res.json();
}

// 계정 잔액 및 LP 포지션 조회
export async function fetchAccount(address) {
  const data = await get(`/accounts/${address}`);
  const pi    = data.balances.find(b => b.asset_type === 'native');
  const tokens = data.balances.filter(b => b.asset_type !== 'native' && b.asset_type !== 'liquidity_pool_shares');
  const lpShares = data.balances.filter(b => b.asset_type === 'liquidity_pool_shares');

  return {
    pi:      parseFloat(pi?.balance ?? 0),
    tokens,
    lpShares,
    raw: data,
  };
}

// 유동성 풀 목록 조회
export async function fetchPools(limit = 50) {
  const data = await get(`/liquidity_pools?limit=${limit}&order=desc`);
  return data._embedded.records.map(parsPool);
}

function parsPool(p) {
  const [assetA, assetB] = p.reserves;
  return {
    id:          p.id,
    assetA:      assetA.asset === 'native' ? 'Pi' : assetA.asset.split(':')[0],
    assetB:      assetB.asset === 'native' ? 'Pi' : assetB.asset.split(':')[0],
    reserveA:    parseFloat(assetA.amount),
    reserveB:    parseFloat(assetB.amount),
    totalShares: parseFloat(p.total_shares),
    fee_bp:      parseInt(p.fee_bp ?? 30),   // 기본 0.3%
    tradeCount:  parseInt(p.trade_count ?? 0),
    raw:         p,
  };
}

// 특정 풀 상세 조회
export async function fetchPool(poolId) {
  const p = await get(`/liquidity_pools/${poolId}`);
  return parsPool(p);
}

// 현재 권장 가스비 (동적)
export async function fetchRecommendedFee() {
  try {
    const data = await get('/fee_stats');
    return parseInt(data.fee_charged.p50 ?? 10000); // stroops
  } catch {
    return 10000; // 폴백
  }
}

// 트랜잭션 제출
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
