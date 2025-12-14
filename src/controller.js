import { getInputNumber } from './utils.js';
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
    'holidayDays', 'paidLeaveDays', 'companyPlanLeaveDays', 'extraOvertimeHours',
    'numDependents'
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
      },
      numDependents: getInputNumber('numDependents')
    };
    return new SalaryModel(values);
  }

  function recalc() {
    const model = readModelFromInputs();
    const comps = model.computeComponents();

    // Nếu có điều kiện đặc biệt cho phụ cấp chuyên cần, xử lý và cập nhật comps.attendanceAllowance ở đây.
    // (Hiện mẫu model đã chứa attendanceAllowanceBase và controller có thể quyết định cho hưởng hoặc không)

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
      if (id === 'baseSalary') e.value = 10000000;
      else if (id === 'day_norm_08_17') e.value = 176;
      else e.value = 0;
    });
    recalc();
  });

  // initial calc
  recalc();
}
