import { 
  STANDARD_MONTHLY_HOURS, 
  RATE, 
  INSURANCE_TOTAL_RATE, 
  INSURANCE_RATES,
  PIT_RELIEF_RATES, 
  PIT_BRACKETS, 
  TAX_FREE_OVERTIME_HOURS, 
  TAX_FREE_OVERTIME_USE_RATE 
} from './constants.js';
import { computeProgressiveTax } from './utils.js';

/**
 * Hàm tra cứu mức giảm trừ gia cảnh dựa trên ngày chi trả lương.
 */
function getPitReliefRates(paymentYear, paymentMonth, paymentDay) {
    // Sử dụng Năm, Tháng, Ngày chi trả.
    // Lưu ý: JavaScript dùng tháng từ 0-11, nên phải trừ 1
    const paymentDate = new Date(paymentYear, paymentMonth - 1, paymentDay);
    
    let lastRates = PIT_RELIEF_RATES[0]; 

    // Tìm mức giảm trừ có effectiveDate <= paymentDate
    for (const rate of PIT_RELIEF_RATES) {
        // So sánh ngày chi trả với ngày hiệu lực
        if (paymentDate.getTime() >= rate.effectiveDate.getTime()) {
            lastRates = rate;
        } else {
            break; 
        }
    }
    
    return {
        personal: lastRates.personal,
        dependent: lastRates.dependent,
        effectiveDate: lastRates.effectiveDate
    };
}

/**
 * Hàm tính giờ hiệu dụng sau khi trừ giờ nghỉ không lương (Break)
 */
function effectiveHours(totalHours, shiftLen = 9, unpaid = 1) {
  if (!totalHours || totalHours <= 0) return 0;
  const fullShifts = Math.floor(totalHours / shiftLen);
  return Math.max(0, totalHours - fullShifts * unpaid);
}


export class SalaryModel {
  constructor(values) {
    this.salaryForNormalHours = values.salaryForNormalHours; 
    this.salaryForOvertime = values.salaryForOvertime;       
    this.allowanceSalary = values.allowanceSalary; 
    this.socialSalary = values.socialSalary;
    this.planLeaveSalary = values.planLeaveSalary; 
    this.monthlyAllowance = values.monthlyAllowance; 
    this.attendanceAllowanceBase = values.attendanceAllowanceBase; 
    this.workingDaysInMonth = values.workingDaysInMonth;
    this.numDependents = values.numDependents;
    
    // THUỘC TÍNH THỜI GIAN MỚI
    this.periodMonth = parseInt(values.periodMonth);
    this.periodYear = parseInt(values.periodYear);
    this.paymentMonth = parseInt(values.paymentMonth);
    this.paymentYear = parseInt(values.paymentYear);
    this.paymentDay = parseInt(values.paymentDay);
    
    // Gán tất cả các trường giờ làm từ inputs vào hours
    this.hours = {
      day_norm_08_17: values.day_norm_08_17, day_ot_17_20: values.day_ot_17_20, day_ot_20_24: values.day_ot_20_24,
      night_norm_20_22: values.night_norm_20_22, night_22_24: values.night_22_24, night_00_04: values.night_00_04, 
      night_04_05: values.night_04_05, night_05_06: values.night_05_06, night_06_08: values.night_06_08,
      sunday_day_hours: values.sunday_day_hours, sunday_night_hours: values.sunday_night_hours,
      holidayDays: values.holidayDays, paidLeaveDays: values.paidLeaveDays,
      companyPlanLeaveDays: values.companyPlanLeaveDays, extraOvertimeHours: values.extraOvertimeHours,
    };
  }

  hourlyRateNormal() {
    return (STANDARD_MONTHLY_HOURS > 0 ? this.salaryForNormalHours / STANDARD_MONTHLY_HOURS : 0);
  }

  hourlyRateOvertime() {
    return (STANDARD_MONTHLY_HOURS > 0 ? this.salaryForOvertime / STANDARD_MONTHLY_HOURS : 0);
  }

  computeComponents() {
    const r = RATE;
    const bh_norm = this.hourlyRateNormal();     
    const bh_ot = this.hourlyRateOvertime();       
    const comps = {};

    // --- 1. TÍNH LƯƠNG TỪ GIỜ LÀM (Giữ nguyên) ---

    comps.otDayEarly = (this.hours.day_ot_17_20 || 0) * bh_ot * r.DAY_OT_EARLY; 
    comps.night05_06 = (this.hours.night_05_06 || 0) * bh_ot * r.NIGHT_05_06_OT; 
    comps.night06_08 = (this.hours.night_06_08 || 0) * bh_ot * r.NIGHT_06_08_OT; 
    
    comps.sundayDay = (this.hours.sunday_day_hours || 0) * bh_ot * r.SUNDAY_DAY;
    comps.sundayNight = (this.hours.sunday_night_hours || 0) * bh_ot * r.SUNDAY_NIGHT;
    comps.holidayDay = (this.hours.holidayDays || 0) * 8 * bh_ot * r.HOLIDAY_DAY; 
    comps.holidayNight = 0; 
    comps.paidLeave = (this.hours.paidLeaveDays || 0) * 8 * bh_norm; 
    
    const planHourly = (STANDARD_MONTHLY_HOURS > 0 ? this.planLeaveSalary / STANDARD_MONTHLY_HOURS : 0);
    comps.companyPlanLeave = (this.hours.companyPlanLeaveDays || 0) * 8 * planHourly;
    comps.extraOvertime = (this.hours.extraOvertimeHours || 0) * bh_ot * r.DAY_OT_EARLY; 

    // Xử lý Giờ làm Hành chính (NET HOURS)
    const netDayHours = (this.hours.day_norm_08_17 || 0); 
    comps.baseDay = netDayHours * bh_norm * r.DAY_NORMAL; 

    // Xử lý Giờ làm Đêm (Giữ nguyên logic trừ giờ nghỉ 1 tiếng/9 tiếng ca đêm)
    const totalNightBucketHours = (this.hours.day_ot_20_24 || 0) + (this.hours.night_norm_20_22 || 0) + 
                                  (this.hours.night_22_24 || 0) + (this.hours.night_00_04 || 0) + 
                                  (this.hours.night_04_05 || 0);
    const effectiveNightHours = effectiveHours(totalNightBucketHours, 9, 1);
    const nightScale = totalNightBucketHours > 0 ? (effectiveNightHours / totalNightBucketHours) : 1;

    comps.dayOt20_24 = (this.hours.day_ot_20_24 || 0) * bh_ot * r.DAY_OT_LATE * nightScale;
    comps.night20_22 = (this.hours.night_norm_20_22 || 0) * bh_ot * r.NIGHT_NORMAL_20_22 * nightScale;
    comps.night22_24 = (this.hours.night_22_24 || 0) * bh_ot * r.NIGHT_22_24 * nightScale;
    comps.night00_04 = (this.hours.night_00_04 || 0) * bh_ot * r.NIGHT_00_04 * nightScale;
    comps.night04_05 = (this.hours.night_04_05 || 0) * bh_ot * r.NIGHT_04_05 * nightScale;

    comps.hourlyTotal = [
      comps.baseDay, comps.otDayEarly, comps.dayOt20_24, comps.night20_22, 
      comps.night22_24, comps.night00_04, comps.night04_05, comps.night05_06, 
      comps.night06_08, comps.sundayDay, comps.sundayNight, comps.holidayDay, 
      comps.holidayNight, comps.paidLeave, comps.companyPlanLeave, comps.extraOvertime
    ].reduce((s, v) => s + (Number(v) || 0), 0);

    // --- 2. TÍNH PHỤ CẤP VÀ TỔNG THU NHẬP ---
    comps.allowancePay = (this.allowanceSalary || 0); 
    comps.attendanceAllowance = (this.attendanceAllowanceBase || 0); 
    comps.totalIncome = comps.hourlyTotal + comps.allowancePay + comps.attendanceAllowance; 
    comps.fixedAllowanceDisplayed = comps.attendanceAllowance; 

    // --- 3. TÍNH KHẤU TRỪ BHXH, TNCN VÀ NET SALARY ---
    
    const totalDaysForInsurance = (this.workingDaysInMonth || 0) + (this.hours.holidayDays || 0) + (this.hours.paidLeaveDays || 0) + (this.hours.companyPlanLeaveDays || 0);
    
    if (totalDaysForInsurance >= 14) {
      comps.insuranceDeduction = (this.socialSalary || 0) * INSURANCE_TOTAL_RATE;
    } else {
      comps.insuranceDeduction = 0;
    }

    // Tính Chi tiết BHXH
    comps.insuranceDetails = {
        social: (this.socialSalary || 0) * INSURANCE_RATES.SOCIAL,
        health: (this.socialSalary || 0) * INSURANCE_RATES.HEALTH,
        unemployment: (this.socialSalary || 0) * INSURANCE_RATES.UNEMPLOYMENT,
        totalRate: INSURANCE_TOTAL_RATE,
        socialSalary: (this.socialSalary || 0)
    };


    // --- TÍNH THUẾ TNCN SỬ DỤNG MỨC GIẢM TRỪ ĐỘNG ---
    const pitRates = getPitReliefRates(this.paymentYear, this.paymentMonth, this.paymentDay);
    
    // Lấy mức giảm trừ ĐỘNG
    const personalRelief = pitRates.personal;
    const dependentReliefRate = pitRates.dependent;
    const dependentRelief = (this.numDependents || 0) * dependentReliefRate; 

    const taxFreeHours = Math.max(0, Math.min(this.hours.extraOvertimeHours || 0, TAX_FREE_OVERTIME_HOURS || 0));
    comps.taxFreeOvertime = taxFreeHours * bh_ot * r.DAY_OT_EARLY * (TAX_FREE_OVERTIME_USE_RATE || 0); 

    comps.taxableIncome = Math.max(0, comps.totalIncome - (comps.taxFreeOvertime || 0)); 

    // Thu nhập tính thuế = Thu nhập chịu thuế - Khấu trừ bảo hiểm - Giảm trừ gia cảnh
    comps.taxableBase = Math.max(0, comps.taxableIncome - (comps.insuranceDeduction || 0) - personalRelief - dependentRelief);
    
    comps.personalIncomeTax = computeProgressiveTax(comps.taxableBase); 
    
    // Tính Chi tiết TNCN cho View (Cập nhật các trường giảm trừ động)
    comps.taxDetails = {
        taxableIncome: comps.taxableIncome,
        taxableBase: comps.taxableBase,
        taxResult: comps.personalIncomeTax,
        
        // Cập nhật chi tiết giảm trừ
        personalRelief: personalRelief,
        dependentReliefRate: dependentReliefRate,
        dependentReliefTotal: dependentRelief,
        totalDeductions: (comps.insuranceDeduction || 0) + personalRelief + dependentRelief,
        
        taxBrackets: PIT_BRACKETS, 
        
        // Chi tiết ngày áp dụng
        reliefEffectiveDate: pitRates.effectiveDate.toLocaleDateString('vi-VN')
    };


    comps.netSalary = comps.totalIncome - (comps.insuranceDeduction || 0) - (comps.personalIncomeTax || 0);
    comps.total = comps.hourlyTotal;

    return comps;
  }
}