import { formatVND, setText, el } from './utils.js';
import { PIT_BRACKETS } from './constants.js'; 

// Hàm tạo bảng chi tiết BHXH
function renderInsuranceDetails(details) {
    if (details.socialSalary === 0) {
        return `<p>Không áp dụng khấu trừ BHXH (hoặc Lương đóng BHXH là 0).</p>`;
    }
    const totalDeduction = details.social + details.health + details.unemployment;

    return `
        <p><strong>Căn cứ:</strong> Lương đóng BHXH là ${formatVND(details.socialSalary)}.</p>
        <p><strong>Điều kiện:</strong> Áp dụng khấu trừ vì số ngày công >= 14 ngày.</p>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Loại bảo hiểm</th>
                    <th>Tỷ lệ NV đóng</th>
                    <th>Số tiền khấu trừ</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>BHXH (Tổng)</td><td>${(details.totalRate * 100).toFixed(2)}%</td><td>${formatVND(totalDeduction)}</td></tr>
                <tr><td>BHXH</td><td>${(details.social / details.socialSalary * 100).toFixed(2)}%</td><td>${formatVND(details.social)}</td></tr>
                <tr><td>BHYT</td><td>${(details.health / details.socialSalary * 100).toFixed(2)}%</td><td>${formatVND(details.health)}</td></tr>
                <tr><td>BHTN</td><td>${(details.unemployment / details.socialSalary * 100).toFixed(2)}%</td><td>${formatVND(details.unemployment)}</td></tr>
            </tbody>
            <tfoot>
                <tr><td colspan="2"><strong>Tổng khấu trừ BHXH/BHYT/BHTN</strong></td><td><strong>${formatVND(totalDeduction)}</strong></td></tr>
            </tfoot>
        </table>
    `;
}

// Hàm tạo bảng chi tiết TNCN (Hiển thị mức giảm trừ động)
function renderTaxDetails(details) {
    let taxTableHtml = '';
    let cumulativeTaxable = 0;
    let taxRateDisplay = 0;

    // Phân tích biểu thuế
    for (const bracket of PIT_BRACKETS) {
        const lowerBound = cumulativeTaxable;
        const upperBound = bracket.limit === Infinity ? details.taxableBase : bracket.limit;
        
        const taxedInBracket = Math.max(0, Math.min(details.taxableBase - lowerBound, upperBound - lowerBound));
        
        if (taxedInBracket > 0) {
            const taxAmount = taxedInBracket * bracket.rate;
            taxTableHtml += `
                <tr>
                    <td>${formatVND(lowerBound)} - ${bracket.limit === Infinity ? 'trở lên' : formatVND(upperBound)}</td>
                    <td>${(bracket.rate * 100).toFixed(0)}%</td>
                    <td>${formatVND(taxedInBracket)}</td>
                    <td>${formatVND(taxAmount)}</td>
                </tr>
            `;
        }
        cumulativeTaxable = upperBound;
        if (details.taxableBase <= upperBound) {
            taxRateDisplay = bracket.rate * 100;
            break;
        }
    }

    return `
        <p><strong>Căn cứ giảm trừ:</strong> Mức giảm trừ được áp dụng từ ngày ${details.reliefEffectiveDate}.</p>
        <p class="small" style="margin-left: 10px;">- Giảm trừ bản thân: ${formatVND(details.personalRelief)}</p>
        <p class="small" style="margin-left: 10px;">- Giảm trừ người phụ thuộc: ${formatVND(details.dependentReliefRate)}/người</p>
        
        <table class="detail-table">
            <tr><td>Thu nhập chịu thuế (A):</td><td><strong>${formatVND(details.taxableIncome)}</strong></td></tr>
            <tr><td>Giảm trừ bản thân:</td><td>${formatVND(details.personalRelief)}</td></tr>
            <tr><td>Giảm trừ người phụ thuộc (${details.dependentReliefTotal / details.dependentReliefRate} người):</td><td>${formatVND(details.dependentReliefTotal)}</td></tr>
            <tr><td>Khấu trừ BHXH:</td><td>${formatVND(details.totalDeductions - details.personalRelief - details.dependentReliefTotal)}</td></tr>
            <tr><td><strong>Tổng giảm trừ:</strong></td><td><strong>${formatVND(details.totalDeductions)}</strong></td></tr>
            <tr><td><strong>Thu nhập tính thuế (B):</strong></td><td><strong>${formatVND(details.taxableBase)}</strong></td></tr>
        </table>
        <h4 style="margin-top: 10px;">Tính Thuế (Thuế suất cao nhất: ${taxRateDisplay.toFixed(0)}%)</h4>
        <table class="detail-table">
            <thead>
                <tr>
                    <th>Bậc thuế (VND)</th>
                    <th>Thuế suất</th>
                    <th>Thu nhập tính thuế trong bậc</th>
                    <th>Tiền thuế phải nộp</th>
                </tr>
            </thead>
            <tbody>
                ${taxTableHtml}
            </tbody>
            <tfoot>
                <tr><td colspan="3"><strong>Tổng thuế TNCN phải nộp</strong></td><td><strong>${formatVND(details.taxResult)}</strong></td></tr>
            </tfoot>
        </table>
    `;
}


export function renderTotals(comps) {
  setText('displayPayMonth', 'Tháng ' + comps.payMonth);
  
  // Cập nhật các trường kết quả chính
  setText('totalHourSalary', formatVND(comps.hourlyTotal));
  setText('totalIncome', formatVND(comps.totalIncome));
  setText('monthlyAllowanceAmountResult', formatVND(comps.fixedAllowanceDisplayed)); 
  setText('insuranceDeduction', formatVND(comps.insuranceDeduction));
  setText('personalIncomeTax', formatVND(comps.personalIncomeTax));
  setText('netSalary', formatVND(comps.netSalary));

  // Thêm chi tiết TNCN và BHXH
  el('insuranceDetail').innerHTML = renderInsuranceDetails(comps.insuranceDetails);
  el('taxDetail').innerHTML = renderTaxDetails(comps.taxDetails);

  // Cập nhật chi tiết phân tích Giờ làm việc
  const breakdownList = el('breakdownList');
  if (breakdownList) {
    breakdownList.innerHTML = `
        <li>Lương Giờ/Ngày thường (Net, 8h/ngày): ${formatVND(comps.baseDay)}</li>
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