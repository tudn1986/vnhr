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

// Giả định class SalaryModel đã được định nghĩa và chứa thuộc tính 'hours' và các thuộc tính lương
export class SalaryModel {
  constructor(values) {
    this.baseSalary = values.baseSalary;
    this.allowanceSalary = values.allowanceSalary;
    this.socialSalary = values.socialSalary;
    this.planLeaveSalary = values.planLeaveSalary;
    this.monthlyAllowance = values.monthlyAllowance;
    this.attendanceAllowanceBase = values.attendanceAllowanceBase;
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
    return (STANDARD_MONTHLY_HOURS > 0 ? this.baseSalary / STANDARD_MONTHLY_HOURS : 0);
  }

  computeComponents() {
    const r = RATE;
    const bh = this.baseHourlyRate();
    const comps = {};

    // --- 1. Tính toán thành phần Lương Giờ/Ngày (Raw/Adjusted) ---

    // Tiền lương cơ bản hàng giờ (cho các phần tử không bị điều chỉnh break)
    comps.otDayEarly = this.hours.day_ot_17_20 * bh * r.DAY_OT_EARLY; // Tăng ca ngày 17:00-20:00

    comps.night05_06 = (this.hours.night_05_06 || 0) * bh * r.NIGHT_05_06_OT; // Tăng ca đêm sau 05:00
    comps.night06_08 = (this.hours.night_06_08 || 0) * bh * r.NIGHT_06_08_OT; // Tăng ca đêm sau 06:00

    comps.sundayDay = this.hours.sunday_day_hours * bh * r.SUNDAY_DAY;
    comps.sundayNight = this.hours.sunday_night_hours * bh * r.SUNDAY_NIGHT;

    // Lương Nghỉ Phép/Lễ/Kế hoạch (tính theo ngày * 8 giờ)
    comps.holidayDay = (this.hours.holidayDays || 0) * 8 * bh * r.HOLIDAY_DAY;
    
    // BỔ SUNG LOGIC holidayNight: Giả định 1 ngày lễ làm đêm = 8 giờ * bh * 3.9
    // Lưu ý: Tuyệt vời hơn nếu có input nhập giờ làm đêm lễ, nhưng ở đây dùng logic 8 giờ/ngày
    // Cần có input: holidayNightDays (số ngày làm đêm lễ)
    // Dựa trên file index.html, không có input này, nên ta giả định người dùng đã tính giờ đêm vào holidayDay.
    // Nếu phải bổ sung logic:
    // comps.holidayNight = (this.hours.holidayNightDays || 0) * 8 * bh * r.HOLIDAY_NIGHT;
    comps.holidayNight = 0; // Tạm giữ 0 do không có input tách biệt trong form

    comps.paidLeave = (this.hours.paidLeaveDays || 0) * 8 * bh;

    const planHourly = (STANDARD_MONTHLY_HOURS > 0 ? this.planLeaveSalary / STANDARD_MONTHLY_HOURS : 0);
    comps.companyPlanLeave = (this.hours.companyPlanLeaveDays || 0) * 8 * planHourly;

    comps.extraOvertime = (this.hours.extraOvertimeHours || 0) * bh * r.DAY_OT_EARLY;


    // --- 2. Xử lý Giờ làm bị Điều chỉnh (Trừ giờ nghỉ không lương) ---

    // a) Xử lý Ca Ngày (08:00-17:00)
    const totalDayBucketHours = (this.hours.day_norm_08_17 || 0);
    const effectiveDayHours = effectiveHours(totalDayBucketHours, 9, 1);
    const dayScale = totalDayBucketHours > 0 ? (effectiveDayHours / totalDayBucketHours) : 1;
    comps.baseDay = totalDayBucketHours * bh * r.DAY_NORMAL * dayScale; 

    // b) Xử lý Ca Đêm (Giờ làm trong 20:00-05:00)
    const totalNightBucketHours = (this.hours.day_ot_20_24 || 0) + (this.hours.night_norm_20_22 || 0) + 
                                  (this.hours.night_22_24 || 0) + (this.hours.night_00_04 || 0) + 
                                  (this.hours.night_04_05 || 0);
    const effectiveNightHours = effectiveHours(totalNightBucketHours, 9, 1);
    const nightScale = totalNightBucketHours > 0 ? (effectiveNightHours / totalNightBucketHours) : 1;

    // SỬA LỖI: Tính toán các thành phần đêm và tăng ca đêm đã điều chỉnh
    comps.dayOt20_24 = (this.hours.day_ot_20_24 || 0) * bh * r.DAY_OT_LATE * nightScale;
    comps.night20_22 = (this.hours.night_norm_20_22 || 0) * bh * r.NIGHT_NORMAL_20_22 * nightScale;
    comps.night22_24 = (this.hours.night_22_24 || 0) * bh * r.NIGHT_22_24 * nightScale;
    comps.night00_04 = (this.hours.night_00_04 || 0) * bh * r.NIGHT_00_04 * nightScale;
    comps.night04_05 = (this.hours.night_04_05 || 0) * bh * r.NIGHT_04_05 * nightScale;
    
    
    // --- 3. Tính Tổng Lương Giờ (hourlyTotal) ---

    comps.hourlyTotal = [
      comps.baseDay, comps.otDayEarly, comps.dayOt20_24, comps.night20_22, 
      comps.night22_24, comps.night00_04, comps.night04_05, comps.night05_06, 
      comps.night06_08, comps.sundayDay, comps.sundayNight, comps.holidayDay, 
      comps.holidayNight, // Đã bổ sung
      comps.paidLeave, comps.companyPlanLeave, comps.extraOvertime
    ].reduce((s, v) => s + (Number(v) || 0), 0);

    // Tính Phụ cấp và Tổng thu nhập
    comps.allowancePay = (this.allowanceSalary || 0); // Giả định phụ cấp được tính theo allowanceSalary
    comps.attendanceAllowance = (this.attendanceAllowanceBase || 0); // Giả định phụ cấp chuyên cần là cố định (Chưa có logic trừ khi vắng mặt)

    comps.totalIncome = comps.hourlyTotal + comps.allowancePay + comps.attendanceAllowance + (this.monthlyAllowance || 0);

    // --- 4. Tính Khấu trừ BHXH ---
    
    const totalDaysForInsurance = (this.workingDaysInMonth || 0) + (this.hours.holidayDays || 0) + (this.hours.paidLeaveDays || 0) + (this.hours.companyPlanLeaveDays || 0);
    
    // BHXH chỉ tính khi tổng ngày làm/nghỉ có lương >= 14 ngày
    if (totalDaysForInsurance >= 14) {
      comps.insuranceDeduction = (this.socialSalary || 0) * INSURANCE_TOTAL_RATE;
    } else {
      comps.insuranceDeduction = 0;
    }

    // --- 5. Tính Thuế TNCN ---
    
    const taxFreeHours = Math.max(0, Math.min(this.hours.extraOvertimeHours || 0, TAX_FREE_OVERTIME_HOURS || 0));
    // Tiền tăng ca được miễn thuế (dựa trên lương giờ thường * hệ số 1.5 - lương giờ thường 1.0)
    // Ở đây ta dùng công thức đơn giản: số giờ * lương giờ * 1.5 (tăng ca ngày)
    comps.taxFreeOvertime = taxFreeHours * bh * RATE.DAY_OT_EARLY * (TAX_FREE_OVERTIME_USE_RATE || 0);

    comps.taxableIncome = Math.max(0, comps.totalIncome - (comps.taxFreeOvertime || 0));

    const personalRelief = PIT_PERSONAL_RELIEF || 0;
    const dependentRelief = (this.numDependents || 0) * (PIT_DEPENDENT_RELIEF || 0);

    // Thu nhập tính thuế = Thu nhập chịu thuế - Khấu trừ bảo hiểm - Giảm trừ gia cảnh
    comps.taxableBase = Math.max(0, comps.taxableIncome - (comps.insuranceDeduction || 0) - personalRelief - dependentRelief);
    
    comps.personalIncomeTax = computeProgressiveTax(comps.taxableBase);
    
    // --- 6. Tính Lương Thực Lãnh ---
    comps.netSalary = comps.totalIncome - (comps.insuranceDeduction || 0) - (comps.personalIncomeTax || 0);

    comps.total = comps.hourlyTotal;
    comps.monthlyAllowance = this.monthlyAllowance || 0;

    return comps;
  }
}
