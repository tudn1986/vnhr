import { getInputNumber, setText } from './utils.js';
import { SalaryModel } from './model.js';
import { renderTotals } from './view.js';

// Controller: đọc input, cập nhật model, kiểm tra điều kiện, gọi view
export function setupController() {
  const inputIds = [
    'baseSalary', 'allowanceSalary', 'attendanceAllowanceBase', 'planLeaveSalary', 'socialSalary',
    'workingDaysInMonth',
    'day_norm_08_17', 'day_ot_17_20', 'day_ot_20_24',
    'night_norm_20_22', 'night_22_24', 'night_00_04', 'night_04_05', 'night_05_06', 'night_06_08',
    'sunday_day_hours', 'sunday_night_hours',
    'holidayDays', 'paidLeaveDays', 'companyPlanLeaveDays', 'extraOvertimeHours'
  ];

  function readModelFromInputs() {
    const values = {
      baseSalary: getInputNumber('baseSalary'),
      allowanceSalary: getInputNumber('allowanceSalary'),
      attendanceAllowanceBase: getInputNumber('attendanceAllowanceBase'),
      planLeaveSalary: getInputNumber('planLeaveSalary'),
      socialSalary: getInputNumber('socialSalary'),
      workingDaysInMonth: getInputNumber('workingDaysInMonth'),
      hours: {
        day_norm_08_17: getInputNumber('day_norm_08_17'),
        day_ot_17_20: getInputNumber('day_ot_17_20'),
        day_ot_20_24: getInputNumber('day_ot_20_24'),
        night_norm_20_22: getInputNumber('night_norm_20_22'),
        night_22_24: getInputNumber('night_22_24'),
        night_00_04: getInputNumber('night_00_04'),
        night_04_05: getInputNumber('night_04_05'),
        night_05_06: getInputNumber('night_05_06'),
        night_06_08: getInputNumber('night_06_08'),
        sunday_day_hours: getInputNumber('sunday_day_hours'),
        sunday_night_hours: getInputNumber('sunday_night_hours'),
        holidayDays: getInputNumber('holidayDays'),
        paidLeaveDays: getInputNumber('paidLeaveDays'),
        companyPlanLeaveDays: getInputNumber('companyPlanLeaveDays'),
        extraOvertimeHours: getInputNumber('extraOvertimeHours')
      }
    };
    return new SalaryModel(values);
  }

  function recalc() {
    const model = readModelFromInputs();
    const comps = model.computeComponents();

    // Điều kiện phụ cấp chuyên cần: ví dụ đơn giản — nếu không có nghỉ phép, nghỉ không hưởng, không đi muộn...
    // Hiện chưa có input đủ để kiểm tra điều kiện => chỉ hiển thị nếu attendanceAllowanceBase > 0
    if (model.attendanceAllowanceBase > 0) {
      // Nếu bạn có luật cụ thể để xác định điều kiện hưởng, triển khai ở đây.
      comps.attendanceAllowance = model.attendanceAllowanceBase;
    } else {
      comps.attendanceAllowance = 0;
    }

    // cộng phụ cấp chuyên cần vào tổng (nếu có)
    comps.total = (comps.total || 0) + (comps.attendanceAllowance || 0);

    renderTotals(comps);
  }

  // Gắn sự kiện input cho tự động tính
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => recalc());
  });

  const recalcBtn = document.getElementById('recalcBtn');
  if (recalcBtn) recalcBtn.addEventListener('click', recalc);

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    inputIds.forEach(id => {
      const e = document.getElementById(id);
      if (!e) return;
      // reset về value mặc định (nếu cần bạn có thể lưu default)
      if (id === 'baseSalary') e.value = 10000000;
      else if (id === 'day_norm_08_17') e.value = 176;
      else e.value = 0;
    });
    recalc();
  });

  // initial calc
  recalc();
}
