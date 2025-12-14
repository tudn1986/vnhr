// Hằng số và hệ số có thể điều chỉnh tập trung ở đây.
// Các hệ số là multiplier so với lương giờ cơ bản (1.0 = 100%).
// Đã điều chỉnh: 26 ngày công x 8 giờ/ngày = 208 giờ
export const STANDARD_MONTHLY_HOURS = 208; // mặc định: 26 ngày * 8 giờ

export const RATE = {
  // Ngày thường (Thứ 2 đến Thứ 7)
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

  // Chủ nhật / ngày nghỉ (Chủ nhật là ngày nghỉ)
  SUNDAY_DAY: 2.0,
  SUNDAY_NIGHT: 2.7,

  // Lễ/Tết
  HOLIDAY_DAY: 3.0,
  HOLIDAY_NIGHT: 3.9
};

// Tỷ lệ khấu trừ BHXH (mặc định: người lao động đóng)
export const INSURANCE_RATES = {
  SOCIAL: 0.08,     // BHXH NV đóng (8%)
  HEALTH: 0.015,    // BHYT NV đóng (1.5%)
  UNEMPLOYMENT: 0.01 // BHTN NV đóng (1%)
};
export const INSURANCE_TOTAL_RATE = INSURANCE_RATES.SOCIAL + INSURANCE_RATES.HEALTH + INSURANCE_RATES.UNEMPLOYMENT;

// Quy định PIT / giảm trừ gia cảnh
export const PIT_PERSONAL_RELIEF = 11000000; // VNĐ / tháng
export const PIT_DEPENDENT_RELIEF = 4400000; // VNĐ / người / tháng

// Biểu thuế lũy tiến từng bậc (tháng)
export const PIT_BRACKETS = [
  { limit: 5000000, rate: 0.05 },
  { limit: 10000000, rate: 0.10 },
  { limit: 18000000, rate: 0.15 },
  { limit: 32000000, rate: 0.20 },
  { limit: 52000000, rate: 0.25 },
  { limit: 80000000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 }
];

// Cấu hình tăng ca miễn thuế (mặc định tắt)
export const TAX_FREE_OVERTIME_HOURS = 0; 
export const TAX_FREE_OVERTIME_USE_RATE = 0.0;