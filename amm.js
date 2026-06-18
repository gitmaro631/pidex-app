const FEE = 0.003;

export function ammOut(poolIn, poolOut, input, fee = FEE) {
  const effective = input * (1 - fee);
  return (poolOut * effective) / (poolIn + effective);
}

export function priceImpact(poolIn, input, fee = FEE) {
  const effective = input * (1 - fee);
  return (effective / (poolIn + effective)) * 100;
}

export function calcTriangle(pool1, pool2, pool3, sendAmount) {
  const step1 = ammOut(pool1.reserveA, pool1.reserveB, sendAmount);
  const step2 = ammOut(pool2.reserveA, pool2.reserveB, step1);
  const step3 = ammOut(pool3.reserveA, pool3.reserveB, step2);
  return { step1, step2, step3, returned: step3 };
}

export function analyzeArbitrage(pool1, pool2, pool3, sendAmount, gasFeePI = 0.01) {
  const { step1, step2, step3, returned } = calcTriangle(pool1, pool2, pool3, sendAmount);
  const grossPnl    = returned - sendAmount;
  const grossPct    = (returned / sendAmount - 1) * 100;
  const netPnl      = grossPnl - gasFeePI;
  const netPct      = (netPnl / sendAmount) * 100;
  const gasPct      = (gasFeePI / sendAmount) * 100;
  const impact1     = priceImpact(pool1.reserveA, sendAmount);
  const impact2     = priceImpact(pool2.reserveA, step1);
  const impact3     = priceImpact(pool3.reserveA, step2);
  const totalImpact = impact1 + impact2 + impact3;
  const ammFeePct   = (1 - Math.pow(1 - FEE, 3)) * 100;
  const label1 = pool1.assetB === 'Pi' ? 'Pi' : pool1.assetB;
  const label2 = pool2.assetB === 'Pi' ? 'Pi' : pool2.assetB;

  return {
    route: `Pi → ${label1} → ${label2} → Pi`,
    pool1Id: pool1.id, pool2Id: pool2.id, pool3Id: pool3.id,
    sendAmount, returned, step1, step2, step3,
    grossPct, netPct, netPnl, gasPct, ammFeePct, totalImpact, gasFeePI,
    profitable: netPnl > 0,
  };
}

export function findArbitragePaths(pools, sendAmount, gasFeePI = 0.01, minLiquidity = 0) {
  const results = [];

  const filtered = minLiquidity > 0
    ? pools.filter(p => Math.min(p.reserveA, p.reserveB) >= minLiquidity)
    : pools;

  const piPools = filtered.filter(p => p.assetAId === 'Pi' || p.assetBId === 'Pi');

  for (const p1 of piPools) {
    const isPiA1 = p1.assetAId === 'Pi';
    const tokenXId = isPiA1 ? p1.assetBId : p1.assetAId;
    const pool1 = isPiA1
      ? p1
      : { ...p1, reserveA: p1.reserveB, reserveB: p1.reserveA, assetAId: 'Pi', assetBId: tokenXId, assetB: p1.assetA };

    for (const p2 of filtered) {
      if (p2.id === p1.id) continue;
      const isPiA2x = p2.assetAId === tokenXId;
      const isPiB2x = p2.assetBId === tokenXId;
      if (!isPiA2x && !isPiB2x) continue;
      const tokenYId = isPiA2x ? p2.assetBId : p2.assetAId;
      if (tokenYId === 'Pi') continue;
      const pool2 = isPiA2x
        ? p2
        : { ...p2, reserveA: p2.reserveB, reserveB: p2.reserveA, assetAId: tokenXId, assetBId: tokenYId, assetB: p2.assetA };

      for (const p3 of piPools) {
        if (p3.id === p1.id || p3.id === p2.id) continue;
        const isPiA3y = p3.assetAId === tokenYId && p3.assetBId === 'Pi';
        const isPiB3y = p3.assetBId === tokenYId && p3.assetAId === 'Pi';
        if (!isPiA3y && !isPiB3y) continue;
        const pool3 = isPiA3y
          ? p3
          : { ...p3, reserveA: p3.reserveB, reserveB: p3.reserveA, assetAId: tokenYId, assetBId: 'Pi', assetB: 'Pi' };
        try {
          const result = analyzeArbitrage(pool1, pool2, pool3, sendAmount, gasFeePI);
          results.push(result);
        } catch { /* skip */ }
      }
    }
  }
  return results.sort((a, b) => b.netPct - a.netPct);
}

export function calcLPRatio(pool, totalPiEquivalent) {
  const total  = pool.reserveA + pool.reserveB;
  const ratioA = pool.reserveA / total;
  const ratioB = pool.reserveB / total;
  return { amountA: totalPiEquivalent * ratioA, amountB: totalPiEquivalent * ratioB, ratioA, ratioB };
}
