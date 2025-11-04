// Safe numeric parsing and formatting helpers
export function toNumber(value, defaultVal = 0) {
  if (value === null || value === undefined) return defaultVal;
  if (typeof value === 'number') return Number.isFinite(value) ? value : defaultVal;
  if (typeof value === 'string') {
    // Remove currency symbols and any non-numeric except dot and minus
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : defaultVal;
  }
  return defaultVal;
}

export function formatCurrency(value, decimals = 2) {
  const n = toNumber(value, 0);
  return `$${n.toFixed(decimals)}`;
}

export function formatPercent(value, decimals = 1, scaleIfFraction = true) {
  let n = toNumber(value, 0);
  if (scaleIfFraction && Math.abs(n) <= 1) n = n * 100;
  return `${n.toFixed(decimals)}%`;
}

export function formatSeconds(value, decimals = 3) {
  const n = toNumber(value, 0);
  return `${n.toFixed(decimals)}s`;
}

export default {
  toNumber,
  formatCurrency,
  formatPercent,
  formatSeconds
};
