// Các hàm tiện ích chung
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
