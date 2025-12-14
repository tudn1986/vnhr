// Các hàm tiện ích chung
import { PIT_BRACKETS } from './constants.js';

export function clampNum(v, min = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, n);
}

export function formatVND(value) {
  try {
    return Math.round(value).toLocaleString('vi-VN') + ' VND';
  } catch (e) {
    return String(value) + ' VND';
  }
}

export function el(id) {
  return document.getElementById(id);
}

export function getInputNumber(id) {
  const e = el(id);
  if (!e) return 0;
  return clampNum(parseFloat(e.value), 0);
}

export function setText(id, text) {
  const e = el(id);
  if (e) e.textContent = text;
}

// Tính thuế TNCN theo biểu lũy tiến (đầu vào: số VNĐ hàng tháng, >=0)
export function computeProgressiveTax(monthlyTaxableIncome) {
  let remaining = Math.max(0, monthlyTaxableIncome);
  let tax = 0;
  let lower = 0;
  for (const bracket of PIT_BRACKETS) {
    const upper = bracket.limit;
    const rate = bracket.rate;
    const taxableInBracket = Math.max(0, Math.min(remaining, upper === Infinity ? remaining : upper - lower));
    tax += taxableInBracket * rate;
    remaining -= taxableInBracket;
    lower = upper === Infinity ? lower : upper;
    if (remaining <= 0) break;
  }
  return tax;
}
