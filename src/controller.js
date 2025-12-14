import { SalaryModel } from './model.js';
import { renderTotals } from './view.js';
import { getInputNumber, el } from './utils.js';

// Danh sách tất cả các ID input cần theo dõi
const inputIds = [
  'payMonth', 
  'paymentYear', // Mới
  'paymentDay',  // Mới
  'salaryForNormalHours', // Mới
  'salaryForOvertime',    // Mới
  'allowanceSalary', 
  'attendanceAllowanceBase',
  'planLeaveSalary', 
  'socialSalary', 
  'workingDaysInMonth', 
  'numDependents',
  // Giờ làm việc thực tế
  'day_norm_08_17', 'day_ot_17_20', 'day_ot_20_24',
  'night_norm_20_22', 'night_22_24', 'night_00_04', 'night_04_05', 'night_05_06', 'night_06_08',
  'sunday_day_hours', 'sunday_night_hours', 'holidayDays', 'paidLeaveDays',
  'companyPlanLeaveDays', 'extraOvertimeHours'
];

/**
 * Đọc tất cả giá trị từ form và tạo Model
 */
function readModelFromInputs() {
  const values = {};
  inputIds.forEach(id => {
    const input = el(id);
    if (input) {
      if (input.type === 'number') {
        values[id] = getInputNumber(id);
      } 
      else {
        values[id] = input.value;
      }
    }
  });
  
  // Đảm bảo các trường cũ bị loại bỏ có giá trị mặc định là 0
  values['monthlyAllowance'] = 0; 
  
  const model = new SalaryModel(values);
  
  // Lưu các giá trị thời gian thanh toán vào model
  model.calculationMonth = parseInt(values.payMonth);
  model.paymentYear = parseInt(values.paymentYear);
  model.paymentDay = values.paymentDay;

  return model;
}

/**
 * Thực hiện tính toán và hiển thị kết quả
 */
function recalc() {
  const model = readModelFromInputs();
  const comps = model.computeComponents();
  // comps.payMonth sẽ là tháng tính lương (calculationMonth)
  comps.payMonth = model.calculationMonth;
  renderTotals(comps);
}

/**
 * Thiết lập Controller: Gắn sự kiện cho tất cả inputs
 */
export function setupController() {
  inputIds.forEach(id => {
    const input = el(id);
    if (input) {
      if (input.tagName === 'SELECT') {
          input.addEventListener('change', recalc);
      } else {
          input.addEventListener('input', recalc);
      }
    }
  });

  const recalcBtn = el('recalcBtn');
  if (recalcBtn) {
    recalcBtn.addEventListener('click', recalc);
  }

  const resetBtn = el('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window.location.reload(); 
    });
  }

  recalc();
}