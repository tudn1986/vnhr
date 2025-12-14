// Hằng số và hệ số có thể điều chỉnh tập trung ở đây.
// Các hệ số là multiplier so với lương giờ cơ bản (1.0 = 100%).
export const STANDARD_MONTHLY_HOURS = 176; // mặc định: 22 ngày * 8 giờ

export const RATE = {
  // Ngày thường
  DAY_NORMAL: 1.0,
  DAY_OT_EARLY: 1.5,
  DAY_OT_LATE: 2.1,

  // Ca đêm (các khoảng 20:00-08:00)
  NIGHT_NORMAL_20_22: 1.3,
  NIGHT_22_24: 1.3,
  NIGHT_00_04: 1.3,
  NIGHT_04_05: 1.3,
  NIGHT_05_06_OT: 2.1,
  NIGHT_06_08_OT: 2.1,

  // Chủ nhật / ngày nghỉ
  SUNDAY_DAY: 2.0,
  SUNDAY_NIGHT: 2.7,

  // Lễ/Tết
  HOLIDAY_DAY: 3.0,
  HOLIDAY_NIGHT: 3.9
};

// Tỷ lệ khấu trừ BHXH (mặc định: người lao động đóng)
// Bạn có thể chỉnh các giá trị này theo luật hiện hành
export const INSURANCE_RATES = {
  SOCIAL: 0.08,     // BHXH NV đóng (8%)
  HEALTH: 0.015,    // BHYT NV đóng (1.5%)
  UNEMPLOYMENT: 0.01 // BHTN NV đóng (1%)
};
export const INSURANCE_TOTAL_RATE = INSURANCE_RATES.SOCIAL + INSURANCE_RATES.HEALTH + INSURANCE_RATES.UNEMPLOYMENT;

// Quy định PIT / giảm trừ gia cảnh (có thể chỉnh)
export const PIT_PERSONAL_RELIEF = 11000000; // VNĐ / tháng
export const PIT_DEPENDENT_RELIEF = 4400000; // VNĐ / người / tháng

// Biểu thuế lũy tiến từng bậc (tháng) — cấu hình mặc định theo ví dụ
// Mỗi phần tử {limit, rate} nghĩa là: bậc có giới hạn "limit" VND, thuế suất rate.
// Dãy được áp từ nhỏ đến lớn; phần vượt bậc cuối cùng tính theo rate cuối.
export const PIT_BRACKETS = [
  { limit: 5000000, rate: 0.05 },
  { limit: 10000000, rate: 0.10 },
  { limit: 18000000, rate: 0.15 },
  { limit: 32000000, rate: 0.20 },
  { limit: 52000000, rate: 0.25 },
  { limit: 80000000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 }
];

// Cấu hình tăng ca miễn thuế (mặc định tắt — đặt TAX_FREE_OVERTIME_HOURS>0 để bật)
// - TAX_FREE_OVERTIME_HOURS: số giờ tăng ca tối đa được miễn thuế
// - TAX_FREE_OVERTIME_USE_RATE: % của tiền tăng ca (1.0 = toàn bộ tiền tăng ca miễn)
// Lưu ý: luật thực tế có thể khác — tùy chỉnh theo chính sách công ty/luật.
export const TAX_FREE_OVERTIME_HOURS = 0; // mặc định 0 (không miễn)
export const TAX_FREE_OVERTIME_USE_RATE = 0.0; // 0..1
