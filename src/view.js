import { formatVND, setText, el } from './utils.js';

// Hàm hiển thị tổng quan và chi tiết kết quả lên giao diện
export function renderTotals(comps) {
  // set displayPayMonth from comps.payMonth
  setText('displayPayMonth', comps.payMonth || 'Chưa xác định');

  // Cập nhật các trường kết quả chính
  setText('totalHourSalary', formatVND(comps.hourlyTotal));
  setText('totalIncome', formatVND(comps.totalIncome));
  setText('monthlyAllowanceAmountResult', formatVND(comps.monthlyAllowance));
  setText('insuranceDeduction', formatVND(comps.insuranceDeduction));
  setText('taxFreeOvertime', formatVND(comps.taxFreeOvertime));
  setText('taxableIncome', formatVND(comps.taxableIncome));
  setText('taxableBase', formatVND(comps.taxableBase));
  setText('personalIncomeTax', formatVND(comps.personalIncomeTax));
  setText('netSalary', formatVND(comps.netSalary));

  // Cập nhật chi tiết phân tích (ví dụ: chỉ hiển thị hourlyTotal breakdown)
  const breakdownList = el('breakdownList');
  if (breakdownList) {
    breakdownList.innerHTML = `
        <li>Lương Giờ/Ngày thường (điều chỉnh): ${formatVND(comps.baseDay)}</li>
        <li>Tăng ca ngày (150%): ${formatVND(comps.otDayEarly)}</li>
        <li>Tăng ca đêm (20:00-24:00 đã điều chỉnh): ${formatVND(comps.dayOt20_24)}</li>
        <li>Giờ đêm cơ bản (đã điều chỉnh): ${formatVND(comps.night20_22 + comps.night22_24 + comps.night00_04 + comps.night04_05)}</li>
        <li>Tăng ca sớm sáng (210%): ${formatVND(comps.night05_06 + comps.night06_08)}</li>
        <li>Lương Chủ nhật Ngày (200%): ${formatVND(comps.sundayDay)}</li>
        <li>Lương Chủ nhật Đêm (270%): ${formatVND(comps.sundayNight)}</li>
        <li>Lương Lễ/Tết Ngày (300%): ${formatVND(comps.holidayDay)}</li>
        <li>Lương Nghỉ phép có lương: ${formatVND(comps.paidLeave)}</li>
        <li>Lương Nghỉ kế hoạch công ty: ${formatVND(comps.companyPlanLeave)}</li>
        <li>Tiền tăng ca phụ trội khác: ${formatVND(comps.extraOvertime)}</li>
    `;
  }
}
