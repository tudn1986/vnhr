import { STANDARD_MONTHLY_HOURS, RATE } from './constants.js';
import { clampNum } from './utils.js';

// Model chứa dữ liệu đầu vào và phương thức tính toán
export class SalaryModel {
  constructor(values = {}) {
    // Mức lương
    this.baseSalary = clampNum(values.baseSalary || 0); // mức lương cơ bản (tháng)
    this.allowanceSalary = clampNum(values.allowanceSalary || 0); // lương để tính phụ cấp
    this.attendanceAllowanceBase = clampNum(values.attendanceAllowanceBase || 0); // phụ cấp chuyên cần (tháng)
    this.planLeaveSalary = clampNum(values.planLeaveSalary || 0); // mức lương áp dụng khi nghỉ theo kế hoạch công ty
    this.socialSalary = clampNum(values.socialSalary || 0); // lương tham gia BHXH

    // Căn cứ
    this.workingDaysInMonth = clampNum(values.workingDaysInMonth || 22);

    // Giờ - nhóm theo các input
    this.hours = Object.assign({
      day_norm_08_17: 0,
      day_ot_17_20: 0,
      day_ot_20_24: 0,
      night_norm_20_22: 0,
      night_22_24: 0,
      night_00_04: 0,
      night_04_05: 0,
      night_05_06: 0,
      night_06_08: 0,
      sunday_day_hours: 0,
      sunday_night_hours: 0,
      holidayDays: 0,
      paidLeaveDays: 0,
      companyPlanLeaveDays: 0,
      extraOvertimeHours: 0
    }, values.hours || {});
  }

  // Lương giờ cơ bản phục vụ tính lương theo giờ
  baseHourlyRate() {
    const hours = STANDARD_MONTHLY_HOURS > 0 ? STANDARD_MONTHLY_HOURS : 1;
    return this.baseSalary / hours;
  }

  // Lương giờ để tính phụ cấp (nếu dùng)
  allowanceHourlyRate() {
    const hours = STANDARD_MONTHLY_HOURS > 0 ? STANDARD_MONTHLY_HOURS : 1;
    return this.allowanceSalary / hours;
  }

  // Tính từng mục trả lương theo giờ (dùng hệ số trong constants)
  computeComponents() {
    const r = RATE;
    const bh = this.baseHourlyRate();
    const comps = {};

    // Ngày thường
    comps.baseDay = this.hours.day_norm_08_17 * bh * r.DAY_NORMAL;
    comps.otDayEarly = this.hours.day_ot_17_20 * bh * r.DAY_OT_EARLY;
    comps.otDayLate = this.hours.day_ot_20_24 * bh * r.DAY_OT_LATE;

    // Ca đêm (dùng cùng baseHourlyRate; nếu muốn khác có thể dùng allowanceHourlyRate)
    comps.night20_22 = this.hours.night_norm_20_22 * bh * r.NIGHT_NORMAL_20_22;
    comps.night22_24 = this.hours.night_22_24 * bh * r.NIGHT_22_24;
    comps.night00_04 = this.hours.night_00_04 * bh * r.NIGHT_00_04;
    comps.night04_05 = this.hours.night_04_05 * bh * r.NIGHT_04_05;
    comps.night05_06 = this.hours.night_05_06 * bh * r.NIGHT_05_06_OT;
    comps.night06_08 = this.hours.night_06_08 * bh * r.NIGHT_06_08_OT;

    // Chủ nhật / ngày nghỉ
    comps.sundayDay = this.hours.sunday_day_hours * bh * r.SUNDAY_DAY;
    comps.sundayNight = this.hours.sunday_night_hours * bh * r.SUNDAY_NIGHT;

    // Ngày lễ: tính theo số ngày * 8 giờ
    comps.holidayDay = this.hours.holidayDays * 8 * bh * r.HOLIDAY_DAY;
    // Nếu cần tính giờ đêm trên ngày lễ, có thể bổ sung input, ở đây tạm gộp vào holidayNight = 0
    comps.holidayNight = 0;

    // Nghỉ phép có hưởng lương (dùng baseHourlyRate hoặc planLeaveSalary tùy chính sách)
    comps.paidLeave = this.hours.paidLeaveDays * 8 * bh;

    // Nghỉ theo kế hoạch công ty: dùng planLeaveSalary để tính lương cho ngày nghỉ theo quy định
    const planHourly = (STANDARD_MONTHLY_HOURS > 0 ? this.planLeaveSalary / STANDARD_MONTHLY_HOURS : 0);
    comps.companyPlanLeave = this.hours.companyPlanLeaveDays * 8 * planHourly;

    // Tổng tăng ca (nếu nhập tổng)
    comps.extraOvertime = this.hours.extraOvertimeHours * bh * r.DAY_OT_EARLY; // giả sử dùng hệ số 1.5

    // Tổng
    comps.total = Object.values(comps).reduce((s, v) => s + (Number(v) || 0), 0);

    // Thêm thông tin trợ cấp chuyên cần (tính theo tháng, không phải giờ) — giữ nguyên số tiền nếu đủ điều kiện (điều kiện tính phía controller)
    comps.attendanceAllowance = this.attendanceAllowanceBase || 0;

    return comps;
  }
}
