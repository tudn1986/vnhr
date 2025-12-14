import { formatVND, el } from './utils.js';

// View: cập nhật DOM
export function renderTotals(comps) {
  if (!comps) return;

  const set = (id, value) => {
    const e = el(id);
    if (e) e.textContent = formatVND(value || 0);
  };

  set('totalHourSalary', comps.hourlyTotal);
  set('totalIncome', comps.totalIncome);
  set('insuranceDeduction', comps.insuranceDeduction);
  set('taxFreeOvertime', comps.taxFreeOvertime);
  set('taxableIncome', comps.taxableIncome);
  set('taxableBase', comps.taxableBase);
  set('personalIncomeTax', comps.personalIncomeTax);
  set('netSalary', comps.netSalary);

  const breakdownList = el('breakdownList');
  if (!breakdownList) return;
  breakdownList.innerHTML = '';

  const map = {
    baseDay: 'Giờ hành chính (08-17)',
    otDayEarly: 'Tăng ca ngày (17-20)',
    otDayLate: 'Tăng ca đêm (20-24)',
    night20_22: 'Ca đêm (20-22)',
    night22_24: 'Ca đêm (22-24)',
    night00_04: 'Ca đêm (00-04)',
    night04_05: 'Ca đêm (04-05)',
    night05_06: 'Ca tăng ca (05-06)',
    night06_08: 'Ca tăng ca (06-08)',
    sundayDay: 'Chủ nhật (08-22)',
    sundayNight: 'Chủ nhật (22-08)',
    holidayDay: 'Ngày lễ (ngày)',
    holidayNight: 'Ngày lễ (đêm)',
    paidLeave: 'Nghỉ phép có hưởng lương',
    companyPlanLeave: 'Nghỉ theo kế hoạch công ty',
    extraOvertime: 'Tăng ca tổng hợp',
    allowancePay: 'Tiền phụ cấp theo giờ',
    attendanceAllowance: 'Phụ cấp chuyên cần (nếu có)'
  };

  for (const key of Object.keys(map)) {
    if (comps[key] === undefined) continue;
    const li = document.createElement('li');
    li.textContent = `${map[key]}: ${formatVND(comps[key])}`;
    breakdownList.appendChild(li);
  }
}
