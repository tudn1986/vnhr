(import and code...)
export class SalaryModel {
  ...
  computeComponents() {
    const r = RATE;
    const bh = this.baseHourlyRate();
    const comps = {};

    // compute raw components per bucket as before
    comps.baseDayRaw = this.hours.day_norm_08_17 * bh * r.DAY_NORMAL;
    comps.otDayEarly = this.hours.day_ot_17_20 * bh * r.DAY_OT_EARLY;
    comps.otDayLate = this.hours.day_ot_20_24 * bh * r.DAY_OT_LATE;

    comps.night20_22 = this.hours.night_norm_20_22 * bh * r.NIGHT_NORMAL_20_22;
    comps.night22_24 = this.hours.night_22_24 * bh * r.NIGHT_22_24;
    comps.night00_04 = this.hours.night_00_04 * bh * r.NIGHT_00_04;
    comps.night04_05 = this.hours.night_04_05 * bh * r.NIGHT_04_05;
    comps.night05_06 = this.hours.night_05_06 * bh * r.NIGHT_05_06_OT;
    comps.night06_08 = this.hours.night_06_08 * bh * r.NIGHT_06_08_OT;

    comps.sundayDay = this.hours.sunday_day_hours * bh * r.SUNDAY_DAY;
    comps.sundayNight = this.hours.sunday_night_hours * bh * r.SUNDAY_NIGHT;

    comps.holidayDay = this.hours.holidayDays * 8 * bh * r.HOLIDAY_DAY;
    comps.holidayNight = 0;

    comps.paidLeave = this.hours.paidLeaveDays * 8 * bh;

    const planHourly = (STANDARD_MONTHLY_HOURS > 0 ? this.planLeaveSalary / STANDARD_MONTHLY_HOURS : 0);
    comps.companyPlanLeave = this.hours.companyPlanLeaveDays * 8 * planHourly;

    comps.extraOvertime = this.hours.extraOvertimeHours * bh * r.DAY_OT_EARLY;

    // Now adjust for unpaid breaks per shift
    function effectiveHours(totalHours, shiftLen = 9, unpaid = 1) {
      if (!totalHours || totalHours <= 0) return 0;
      const fullShifts = Math.floor(totalHours / shiftLen);
      return Math.max(0, totalHours - fullShifts * unpaid);
    }

    // Day shift: considered in 08-17 buckets; apply unpaid 1 hour per full 9-hour shift
    const totalDayBucketHours = this.hours.day_norm_08_17;
    const effectiveDayHours = effectiveHours(totalDayBucketHours, 9, 1);
    const dayScale = totalDayBucketHours > 0 ? (effectiveDayHours / totalDayBucketHours) : 1;
    comps.baseDay = comps.baseDayRaw * dayScale;

    // Night shift: include buckets that are within 20:00-05:00 (day_ot_20_24 + night_norm_20_22 + night_22_24 + night_00_04 + night_04_05)
    const totalNightBucketHours = (this.hours.day_ot_20_24 || 0) + (this.hours.night_norm_20_22 || 0) + (this.hours.night_22_24 || 0) + (this.hours.night_00_04 || 0) + (this.hours.night_04_05 || 0);
    const effectiveNightHours = effectiveHours(totalNightBucketHours, 9, 1);
    const nightScale = totalNightBucketHours > 0 ? (effectiveNightHours / totalNightBucketHours) : 1;

    // Apply scaling to night-related components (including day_ot_20_24)
    comps.dayOt20_24 = (this.hours.day_ot_20_24 || 0) * bh * r.DAY_OT_LATE * nightScale;
    comps.night20_22 = comps.night20_22 * nightScale;
    comps.night22_24 = comps.night22_24 * nightScale;
    comps.night00_04 = comps.night00_04 * nightScale;
    comps.night04_05 = comps.night04_05 * nightScale;

    // keep other components (overnight early morning ot beyond 05:00 remain unchanged)
    comps.night05_06 = comps.night05_06;
    comps.night06_08 = comps.night06_08;

    // Recalculate hourlyTotal using adjusted components
    comps.hourlyTotal = [comps.baseDay, comps.otDayEarly, comps.dayOt20_24, comps.otDayLate, comps.night20_22, comps.night22_24, comps.night00_04, comps.night04_05, comps.night05_06, comps.night06_08, comps.sundayDay, comps.sundayNight, comps.holidayDay, comps.paidLeave, comps.companyPlanLeave, comps.extraOvertime].reduce((s, v) => s + (Number(v) || 0), 0);

    // ... (rest unchanged: allowancePay, attendanceAllowance, totalIncome, insuranceDeduction, taxFreeOvertime, taxableIncome, taxableBase, personalIncomeTax, netSalary)

    // ensure monthlyAllowance included
    comps.totalIncome = comps.hourlyTotal + (comps.allowancePay || 0) + (comps.attendanceAllowance || 0) + (this.monthlyAllowance || 0);

    // insurance deduction condition and computation
    const totalDaysForInsurance = (this.workingDaysInMonth || 0) + (this.hours.holidayDays || 0) + (this.hours.paidLeaveDays || 0) + (this.hours.companyPlanLeaveDays || 0);
    if (totalDaysForInsurance >= 14) {
      comps.insuranceDeduction = this.socialSalary * INSURANCE_TOTAL_RATE;
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
