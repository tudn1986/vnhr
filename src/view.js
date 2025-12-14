import { formatVND, el } from './utils.js';

// View: cập nhật DOM
export function renderTotals(comps) {
  const total = comps.total || 0;
  const totalEl = el('totalHourSalary');
  if (totalEl) totalEl.textContent = formatVND(total);

  const breakdownList = el('breakdownList');
  if (!breakdownList) return;
  breakdownList.innerHTML = ''; // reset

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
    attendanceAllowance: 'Phụ cấp chuyên cần (nếu có)'
  };

  for (const key of Object.keys(map)) {
    if (comps[key] === undefined) continue;
    const li = document.createElement('li');
    li.textContent = `${map[key]}: ${formatVND(comps[key])}`;
    breakdownList.appendChild(li);
  }
}
