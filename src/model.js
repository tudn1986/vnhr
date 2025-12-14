import { STANDARD_MONTHLY_HOURS, RATE, INSURANCE_TOTAL_RATE, TAX_FREE_OVERTIME_HOURS, TAX_FREE_OVERTIME_USE_RATE, PIT_PERSONAL_RELIEF, PIT_DEPENDENT_RELIEF } from './constants.js';
import { clampNum } from './utils.js';
import { computeProgressiveTax } from './utils.js';

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

    // số người phụ thuộc dùng để tính giảm trừ
    this.numDependents = clampNum(values.numDependents || 0);
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

    // Ca đêm
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
    comps.holidayNight = 0;

    // Nghỉ phép có hưởng lương
    comps.paidLeave = this.hours.paidLeaveDays * 8 * bh;

    // Nghỉ theo kế hoạch công ty: dùng planLeaveSalary để tính lương cho ngày nghỉ theo quy định
    const planHourly = (STANDARD_MONTHLY_HOURS > 0 ? this.planLeaveSalary / STANDARD_MONTHLY_HOURS : 0);
    comps.companyPlanLeave = this.hours.companyPlanLeaveDays * 8 * planHourly;

    // Tổng tăng ca (nếu nhập tổng)
    comps.extraOvertime = this.hours.extraOvertimeHours * bh * r.DAY_OT_EARLY; // giả sử dùng hệ số 1.5 cho tiền tăng ca tổng hợp

    // Tổng thu nhập giờ (chưa tính phụ cấp hàng tháng)
    comps.hourlyTotal = Object.values({
      baseDay: comps.baseDay,
      otDayEarly: comps.otDayEarly,
      otDayLate: comps.otDayLate,
      night20_22: comps.night20_22,
      night22_24: comps.night22_24,
      night00_04: comps.night00_04,
      night04_05: comps.night04_05,
      night05_06: comps.night05_06,
      night06_08: comps.night06_08,
      sundayDay: comps.sundayDay,
      sundayNight: comps.sundayNight,
      holidayDay: comps.holidayDay,
      holidayNight: comps.holidayNight,
      paidLeave: comps.paidLeave,
      companyPlanLeave: comps.companyPlanLeave,
      extraOvertime: comps.extraOvertime
    }).reduce((s, v) => s + (Number(v) || 0), 0);

    // Phụ cấp chuyên cần (số tiền theo tháng; controller có thể kiểm tra điều kiện hưởng)
    comps.attendanceAllowance = this.attendanceAllowanceBase || 0;

    // Tính tiền phụ cấp theo giờ (nếu muốn cộng vào thu nhập chịu thuế)
    // Giả sử: phụ cấp tính theo allowanceHourlyRate * tổng giờ hưởng lương (bao gồm ngày lễ/ phép / nghỉ kế hoạch)
    const totalHoursCount = Object.values(this.hours).reduce((s, v) => s + (Number(v) || 0), 0) + (this.hours.holidayDays + this.hours.paidLeaveDays + this.hours.companyPlanLeaveDays) * 8;
    comps.allowancePay = this.allowanceHourlyRate() * totalHoursCount;

    // Tổng thu nhập trước khấu trừ = thu từ giờ + phụ cấp + phụ cấp chuyên cần
    comps.totalIncome = comps.hourlyTotal + (comps.allowancePay || 0) + (comps.attendanceAllowance || 0);

    // --- Khấu trừ BHXH (NV đóng) nếu điều kiện ngày >= 14 ---
    const totalDaysForInsurance = (this.workingDaysInMonth || 0) + (this.hours.holidayDays || 0) + (this.hours.paidLeaveDays || 0) + (this.hours.companyPlanLeaveDays || 0);
    if (totalDaysForInsurance >= 14) {
      comps.insuranceDeduction = this.socialSalary * INSURANCE_TOTAL_RATE;
    } else {
      comps.insuranceDeduction = 0;
    }

    // --- Tăng ca miễn thuế (cấu hình) ---
    const taxFreeHours = Math.max(0, Math.min(this.hours.extraOvertimeHours || 0, TAX_FREE_OVERTIME_HOURS || 0));
    const overtimeHourlyPay = (this.hours.extraOvertimeHours > 0) ? (this.hours.extraOvertimeHours > 0 ? (this.hours.extraOvertimeHours * bh * RATE.DAY_OT_EARLY) / (this.hours.extraOvertimeHours) : 0) : (bh * RATE.DAY_OT_EARLY);
    // Nếu TAX_FREE_OVERTIME_USE_RATE = 1 => toàn bộ tiền tăng ca của taxFreeHours được miễn
    comps.taxFreeOvertime = taxFreeHours * bh * RATE.DAY_OT_EARLY * (TAX_FREE_OVERTIME_USE_RATE || 0);

    // Thu nhập chịu thuế = tổng thu nhập - thu nhập miễn thuế (tăng ca miễn)
    comps.taxableIncome = Math.max(0, comps.totalIncome - (comps.taxFreeOvertime || 0));

    // Các khoản giảm trừ
    const personalRelief = PIT_PERSONAL_RELIEF || 0;
    const dependentRelief = (this.numDependents || 0) * (PIT_DEPENDENT_RELIEF || 0);

    // Thu nhập tính thuế = thu nhập chịu thuế - (khấu trừ BHXH + giảm trừ cá nhân + giảm trừ phụ thuộc)
    comps.taxableBase = Math.max(0, comps.taxableIncome - (comps.insuranceDeduction || 0) - personalRelief - dependentRelief);

    // Tính thuế TNCN theo biểu lũy tiến
    comps.personalIncomeTax = computeProgressiveTax(comps.taxableBase);

    // Lương thực nhận = tổng thu nhập - khấu trừ BHXH - thuế TNCN
    comps.netSalary = comps.totalIncome - (comps.insuranceDeduction || 0) - (comps.personalIncomeTax || 0);

    // tổng (giữ compat với render cũ)
    comps.total = comps.hourlyTotal;

    return comps;
  }
}
