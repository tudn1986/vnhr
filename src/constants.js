// Hằng số và hệ số có thể điều chỉnh tập trung ở đây.
// Các hệ số là multiplier so với lương giờ cơ bản (1.0 = 100%).
export const STANDARD_MONTHLY_HOURS = 176; // mặc định: 22 ngày * 8 giờ

export const RATE = {
  // Ngày thường
  DAY_NORMAL: 1.0,         // giờ hành chính ban ngày (08:00-17:00)
  DAY_OT_EARLY: 1.5,       // tăng ca ban ngày (17:00-20:00)
  DAY_OT_LATE: 2.1,        // tăng ca ban đêm (20:00-24:00)

  // Ca đêm (các khoảng 20:00-08:00)
  NIGHT_NORMAL_20_22: 1.3, // ví dụ hệ số giờ đêm
  NIGHT_22_24: 1.3,
  NIGHT_00_04: 1.3,
  NIGHT_04_05: 1.3,
  NIGHT_05_06_OT: 2.1,
  NIGHT_06_08_OT: 2.1,

  // Chủ nhật / ngày nghỉ
  SUNDAY_DAY: 2.0,         // 200%
  SUNDAY_NIGHT: 2.7,       // 270%

  // Lễ/Tết
  HOLIDAY_DAY: 3.0,
  HOLIDAY_NIGHT: 3.9
};
