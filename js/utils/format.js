// 숫자 포매팅 헬퍼

export function formatPi(amount, decimals = 4) {
  const n = parseFloat(amount ?? 0);
  return n.toFixed(decimals) + ' Pi';
}

export function formatToken(amount, symbol = '', decimals = 4) {
  const n = parseFloat(amount ?? 0);
  return n.toFixed(decimals) + (symbol ? ` ${symbol}` : '');
}

export function formatPct(pct, sign = true) {
  const n = parseFloat(pct ?? 0);
  const s = sign && n > 0 ? '+' : '';
  return `${s}${n.toFixed(4)}%`;
}

export function formatPctShort(pct, sign = true) {
  const n = parseFloat(pct ?? 0);
  const s = sign && n > 0 ? '+' : '';
  return `${s}${n.toFixed(2)}%`;
}

export function formatLargeNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(2);
}

export function pctClass(pct) {
  if (pct > 0)  return 'val-green';
  if (pct < 0)  return 'val-red';
  return '';
}
