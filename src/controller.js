import { SalaryModel } from './model.js';
import { renderTotals } from './view.js';
import { getInputNumber, el } from './utils.js';

// Danh sách tất cả các ID input cần theo dõi
const inputIds = [
  'payMonth', 'baseSalary', 'allowanceSalary', 'monthlyAllowance', 'attendanceAllowanceBase',
  'planLeaveSalary', 'socialSalary', 'workingDaysInMonth', 'numDependents',
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
      // Đối với trường số: dùng getInputNumber (đảm bảo >= 0)
      if (input.type === 'number') {
        values[id] = getInputNumber(id);
      } 
      // Đối với trường tháng (text/month)
      else {
        values[id] = input.value;
      }
    }
  });
  
  // Tạo mô hình và trả về
  const model = new SalaryModel(values);
  model.payMonth = values.payMonth || ''; // Gán lại payMonth vào model
  return model;
}

/**
 * Thực hiện tính toán và hiển thị kết quả
 */
function recalc() {
  const model = readModelFromInputs();
  const comps = model.computeComponents();
  comps.payMonth = model.payMonth || '';
  renderTotals(comps);
}

/**
 * Thiết lập Controller: Gắn sự kiện cho tất cả inputs
 */
export function setupController() {
  // 1. Gắn sự kiện 'input' để tính toán trực tiếp
  inputIds.forEach(id => {
    const input = el(id);
    if (input) {
      input.addEventListener('input', recalc);
    }
  });

  // 2. Gắn sự kiện cho nút "Tính lại"
  const recalcBtn = el('recalcBtn');
  if (recalcBtn) {
    recalcBtn.addEventListener('click', recalc);
  }

  // 3. Gắn sự kiện cho nút "Reset"
  const resetBtn = el('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Logic reset form (ví dụ: tải lại trang hoặc đặt lại giá trị mặc định)
      window.location.reload(); 
    });
  }

  // Thực hiện tính toán ban đầu khi trang tải xong
  recalc();
}
