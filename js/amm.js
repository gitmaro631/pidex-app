// AMM 수식 및 차익거래 계산

const FEE = 0.003; // 0.3%

// 단일 풀 교환 결과 (수수료·가격충격 포함)
export function ammOut(poolIn, poolOut, input, fee = FEE) {
  const effective = input * (1 - fee);
  return (poolOut * effective) / (poolIn + effective);
}

// 가격충격 (%)
export function priceImpact(poolIn, input, fee = FEE) {
  const effective = input * (1 - fee);
  return (effective / (poolIn + effective)) * 100;
}

// 삼각 경로 시뮬레이션
export function calcTriangle(pool1, pool2, pool3, sendAmount) {
  const step1 = ammOut(pool1.reserveA, pool1.reserveB, sendAmount);
  const step2 = ammOut(pool2.reserveA, pool2.reserveB, step1);
  const step3 = ammOut(pool3.reserveA, pool3.reserveB, step2);
  return { step1, step2, step3, returned: step3 };
}

// 차익거래 경로 분석 결과
export function analyzeArbitrage(pool1, pool2, pool3, sendAmount, gasFeePI = 0.01) {
  const { step1, step2, step3, returned } = calcTriangle(pool1, pool2, pool3, sendAmount);

  const grossPnl   = returned - sendAmount;
  const grossRatio = returned / sendAmount;
  const grossPct   = (grossRatio - 1) * 100;
  const netPnl     = grossPnl - gasFeePI;
  const netPct     = (netPnl / sendAmount) * 100;

  const impact1 = priceImpact(pool1.reserveA, sendAmount);
  const impact2 = priceImpact(pool2.reserveA, step1);
  const impact3 = priceImpact(pool3.reserveA, step2);
  const totalImpact = impact1 + impact2 + impact3;

  const ammFeePct   = (1 - Math.pow(1 - FEE, 3)) * 100; // ~0.9%

  return {
    route:       `Pi → ${pool1.assetB} → ${pool2.assetB} → Pi`,
    sendAmount,
    returned,
    step1, step2, step3,
    grossPct,
    netPct,
    netPnl,
    ammFeePct,
    totalImpact,
    gasFeePI,
    profitable: netPnl > 0,
  };
}

// 전체 풀 목록에서 삼각 경로 탐색
export function findArbitragePaths(pools, sendAmount, gasFeePI = 0.01) {
  const results = [];
  // Pi를 시작/끝으로 하는 경로 탐색
  const piPools = pools.filter(p => p.assetA === 'Pi' || p.assetB === 'Pi');

  for (const p1 of piPools) {
    // p1: Pi → tokenX
    const tokenX = p1.assetA === 'Pi' ? p1.assetB : p1.assetA;
    const pool1  = p1.assetA === 'Pi' ? p1 : { ...p1, reserveA: p1.reserveB, reserveB: p1.reserveA, assetA: 'Pi', assetB: tokenX };

    for (const p2 of pools) {
      // p2: tokenX → tokenY
      if (p2.id === p1.id) continue;
      if (p2.assetA !== tokenX && p2.assetB !== tokenX) continue;
      const tokenY = p2.assetA === tokenX ? p2.assetB : p2.assetA;
      if (tokenY === 'Pi') continue;
      const pool2 = p2.assetA === tokenX ? p2 : { ...p2, reserveA: p2.reserveB, reserveB: p2.reserveA, assetA: tokenX, assetB: tokenY };

      for (const p3 of piPools) {
        // p3: tokenY → Pi
        if (p3.id === p1.id || p3.id === p2.id) continue;
        if (p3.assetA !== tokenY && p3.assetB !== tokenY) continue;
        const endsInPi = (p3.assetA === tokenY && p3.assetB === 'Pi') || (p3.assetB === tokenY && p3.assetA === 'Pi');
        if (!endsInPi) continue;
        const pool3 = p3.assetA === tokenY ? p3 : { ...p3, reserveA: p3.reserveB, reserveB: p3.reserveA, assetA: tokenY, assetB: 'Pi' };

        try {
          const result = analyzeArbitrage(pool1, pool2, pool3, sendAmount, gasFeePI);
          if (result.netPct > -5) results.push(result); // 극단적 손실 경로 제외
        } catch { /* 계산 불가 경로 스킵 */ }
      }
    }
  }

  return results.sort((a, b) => b.netPct - a.netPct);
}

// LP 예치 비율 계산
export function calcLPRatio(pool, totalPiEquivalent) {
  // 풀 비율에 맞게 두 자산 배분
  const total = pool.reserveA + pool.reserveB;
  const ratioA = pool.reserveA / total;
  const ratioB = pool.reserveB / total;
  return {
    amountA: totalPiEquivalent * ratioA,
    amountB: totalPiEquivalent * ratioB,
    ratioA,
    ratioB,
  };
}
