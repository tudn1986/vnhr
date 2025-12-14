import { 
  STANDARD_MONTHLY_HOURS, 
  RATE, 
  INSURANCE_TOTAL_RATE, 
  PIT_PERSONAL_RELIEF, 
  PIT_DEPENDENT_RELIEF, 
  TAX_FREE_OVERTIME_HOURS, 
  TAX_FREE_OVERTIME_USE_RATE 
} from './constants.js';
import { computeProgressiveTax } from './utils.js';

/**
 * Hàm tính giờ hiệu dụng sau khi trừ giờ nghỉ không lương (Break)
 * Áp dụng logic: trừ 1 giờ không lương cho mỗi ca 9 giờ đầy đủ.
 */
function effectiveHours(totalHours, shiftLen = 9, unpaid = 1) {
  if (!totalHours || totalHours <= 0) return 0;
  const fullShifts = Math.floor(totalHours / shiftLen);
  return Math.max(0, totalHours - fullShifts * unpaid);
}

export class SalaryModel {
  constructor(values) {
    // Đã đổi tên biến baseSalary thành salaryForHours để rõ ràng hơn
    this.salaryForHours = values.baseSalary; // Đây là Mức lương cơ bản tính giờ
    this.allowanceSalary = values.allowanceSalary; // (Giữ lại dù ẩn)
    this.socialSalary = values.socialSalary;
    this.planLeaveSalary = values.planLeaveSalary; // (Giữ lại dù ẩn)
    this.monthlyAllowance = values.monthlyAllowance;
    this.attendanceAllowanceBase = values.attendanceAllowanceBase; // (Giữ lại dù ẩn)
    this.workingDaysInMonth = values.workingDaysInMonth;
    this.numDependents = values.numDependents;
    
    // Gán tất cả các trường giờ làm từ inputs vào hours
    this.hours = {
      day_norm_08_17: values.day_norm_08_17,
      day_ot_17_20: values.day_ot_17_20,
      day_ot_20_24: values.day_ot_20_24,

      night_norm_20_22: values.night_norm_20_22,
      night_22_24: values.night_22_24,
      night_00_04: values.night_00_04,
      night_04_05: values.night_04_05,
      night_05_06: values.night_05_06,
      night_06_08: values.night_06_08,

      sunday_day_hours: values.sunday_day_hours,
      sunday_night_hours: values.sunday_night_hours,

      holidayDays: values.holidayDays,
      paidLeaveDays: values.paidLeaveDays,
      companyPlanLeaveDays: values.companyPlanLeaveDays,
      extraOvertimeHours: values.extraOvertimeHours,
    };
  }

  baseHourlyRate() {
    // Mức lương giờ cơ bản = Lương cơ bản tháng / 208 giờ (26*8)
    return (STANDARD_MONTHLY_HOURS > 0 ? this.salaryForHours / STANDARD_MONTHLY_HOURS : 0);
  }

  computeComponents() {
    const r = RATE;
    const bh = this.baseHourlyRate(); // base hourly rate
    const comps = {};

    // --- 1. TÍNH LƯƠNG TỪ GIỜ LÀM ---

    comps.otDayEarly = (this.hours.day_ot_17_20 || 0) * bh * r.DAY_OT_EARLY; 
    comps.night05_06 = (this.hours.night_05_06 || 0) * bh * r.NIGHT_05_06_OT; 
    comps.night06_08 = (this.hours.night_06_08 || 0) * bh * r.NIGHT_06_08_OT; 
    comps.sundayDay = (this.hours.sunday_day_hours || 0) * bh * r.SUNDAY_DAY;
    comps.sundayNight = (this.hours.sunday_night_hours || 0) * bh * r.SUNDAY_NIGHT;
    comps.holidayDay = (this.hours.holidayDays || 0) * 8 * bh * r.HOLIDAY_DAY;
    comps.holidayNight = 0; 
    comps.paidLeave = (this.hours.paidLeaveDays || 0) * 8 * bh;

    const planHourly = (STANDARD_MONTHLY_HOURS > 0 ? this.planLeaveSalary / STANDARD_MONTHLY_HOURS : 0);
    comps.companyPlanLeave = (this.hours.companyPlanLeaveDays || 0) * 8 * planHourly;

    comps.extraOvertime = (this.hours.extraOvertimeHours || 0) * bh * r.DAY_OT_EARLY;

    // Xử lý Giờ làm bị Điều chỉnh (Trừ giờ nghỉ không lương)
    const totalDayBucketHours = (this.hours.day_norm_08_17 || 0);
    const effectiveDayHours = effectiveHours(totalDayBucketHours, 9, 1);
    const dayScale = totalDayBucketHours > 0 ? (effectiveDayHours / totalDayBucketHours) : 1;
    comps.baseDay = totalDayBucketHours * bh * r.DAY_NORMAL * dayScale; 

    const totalNightBucketHours = (this.hours.day_ot_20_24 || 0) + (this.hours.night_norm_20_22 || 0) + 
                                  (this.hours.night_22_24 || 0) + (this.hours.night_00_04 || 0) + 
                                  (this.hours.night_04_05 || 0);
    const effectiveNightHours = effectiveHours(totalNightBucketHours, 9, 1);
    const nightScale = totalNightBucketHours > 0 ? (effectiveNightHours / totalNightBucketHours) : 1;

    comps.dayOt20_24 = (this.hours.day_ot_20_24 || 0) * bh * r.DAY_OT_LATE * nightScale;
    comps.night20_22 = (this.hours.night_norm_20_22 || 0) * bh * r.NIGHT_NORMAL_20_22 * nightScale;
    comps.night22_24 = (this.hours.night_22_24 || 0) * bh * r.NIGHT_22_24 * nightScale;
    comps.night00_04 = (this.hours.night_00_04 || 0) * bh * r.NIGHT_00_04 * nightScale;
    comps.night04_05 = (this.hours.night_04_05 || 0) * bh * r.NIGHT_04_05 * nightScale;

    // Tính Tổng Lương Giờ (hourlyTotal)
    comps.hourlyTotal = [
      comps.baseDay, comps.otDayEarly, comps.dayOt20_24, comps.night20_22, 
      comps.night22_24, comps.night00_04, comps.night04_05, comps.night05_06, 
      comps.night06_08, comps.sundayDay, comps.sundayNight, comps.holidayDay, 
      comps.holidayNight, 
      comps.paidLeave, comps.companyPlanLeave, comps.extraOvertime
    ].reduce((s, v) => s + (Number(v) || 0), 0);

    // --- 2. TÍNH PHỤ CẤP VÀ TỔNG THU NHẬP ---
    
    // Lưu trữ các khoản phụ cấp
    comps.allowancePay = (this.allowanceSalary || 0); 
    comps.attendanceAllowance = (this.attendanceAllowanceBase || 0); 
    
    // TỔNG THU NHẬP (Gross) = Lương từ giờ làm + Phụ cấp cố định + Các khoản phụ cấp khác
    comps.totalIncome = comps.hourlyTotal + comps.allowancePay + comps.attendanceAllowance + (this.monthlyAllowance || 0);

    // --- 3. TÍNH KHẤU TRỪ BHXH, TNCN VÀ NET SALARY ---
    
    const totalDaysForInsurance = (this.workingDaysInMonth || 0) + (this.hours.holidayDays || 0) + (this.hours.paidLeaveDays || 0) + (this.hours.companyPlanLeaveDays || 0);
    
    if (totalDaysForInsurance >= 14) {
      comps.insuranceDeduction = (this.socialSalary || 0) * INSURANCE_TOTAL_RATE;
    } else {
      comps.insuranceDeduction = 0;
    }

    const taxFreeHours = Math.max(0, Math.min(this.hours.extraOvertimeHours || 0, TAX_FREE_OVERTIME_HOURS || 0));
    comps.taxFreeOvertime = taxFreeHours * bh * RATE.DAY_OT_EARLY * (TAX_FREE_OVERTIME_USE_RATE || 0);

    comps.taxableIncome = Math.max(0, comps.totalIncome - (comps.taxFreeOvertime || 0));

    const personalRelief = PIT_PERSONAL_RELIEF || 0;
    const dependentRelief = (this.numDependents || 0) * (PIT_DEPENDENT_RELIEF || 0);

    comps.taxableBase = Math.max(0, comps.taxableIncome - (comps.insuranceDeduction || 0) - personalRelief - dependentRelief);
    
    comps.personalIncomeTax = computeProgressiveTax(comps.taxableBase);
    
    comps.netSalary = comps.totalIncome - (comps.insuranceDeduction || 0) - (comps.personalIncomeTax || 0);

    comps.total = comps.hourlyTotal;
    comps.monthlyAllowance = this.monthlyAllowance || 0;

    return comps;
  }
}