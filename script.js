/**
 * Hàm tính toán tiền lương cơ bản từ giờ làm việc
 */
function calculateSalary() {
    // 1. Dữ liệu Đầu vào (Lấy từ HTML)
    const baseSalary = parseFloat(document.getElementById('baseSalary').value) || 0;
    
    // Giờ làm việc Ngày Thường
    const hcDayNormal = parseFloat(document.getElementById('hcDayNormal').value) || 0;
    const otDayNormal = parseFloat(document.getElementById('otDayNormal').value) || 0;
    const hcNightNormal = parseFloat(document.getElementById('hcNightNormal').value) || 0;
    const otNightNormal = parseFloat(document.getElementById('otNightNormal').value) || 0;
    
    // Giờ làm việc Ngày Nghỉ
    const dayOffHours = parseFloat(document.getElementById('dayOffHours').value) || 0;
    const nightOffHours = parseFloat(document.getElementById('nightOffHours').value) || 0;
    
    // Giờ làm việc Ngày Lễ/Tết
    const holidayDayHours = parseFloat(document.getElementById('holidayDayHours').value) || 0;
    const holidayNightHours = parseFloat(document.getElementById('holidayNightHours').value) || 0;

    // 2. Định nghĩa Hằng số và Hệ số lương
    const STANDARD_MONTHLY_HOURS = 176; // Giả định: 22 ngày * 8 giờ
    
    // Hệ số lương theo loại ngày làm việc (Đã làm tròn và tổng hợp theo quy định)
    const RATE = {
        // Ngày Thường
        HC_DAY_NORMAL: 1.0,   
        OT_DAY_NORMAL: 1.5,   
        HC_NIGHT_NORMAL: 1.3, 
        OT_NIGHT_NORMAL: 2.1, // 150% (Tăng ca) + 30% (Làm đêm) + 30% (Phụ trội ca đêm) = 210% (Tối thiểu)

        // Ngày Nghỉ Hàng Tuần (Lương Ngày thường 100% + Phụ trội 200%)
        DAY_OFF: 2.0,       // Làm việc ngày nghỉ, giờ ngày: 200%
        NIGHT_OFF: 2.7,     // Làm việc ngày nghỉ, giờ đêm: 200% + 70% (50% Phụ trội đêm + 20% phụ trội)

        // Ngày Lễ, Tết (Lương Ngày thường 100% + Phụ trội 300%)
        HOLIDAY_DAY: 3.0,   // Làm việc ngày Lễ/Tết, giờ ngày: 300%
        HOLIDAY_NIGHT: 3.9  // Làm việc ngày Lễ/Tết, giờ đêm: 300% + 90%
    };

    // Tính tiền lương cho 1 giờ làm việc cơ bản
    const baseHourlyRate = baseSalary / STANDARD_MONTHLY_HOURS;
    
    // 3. Tính Tổng tiền lương (Gross Salary)
    let totalHourSalary = 0;
    
    // A. Ngày Thường
    totalHourSalary += hcDayNormal * baseHourlyRate * RATE.HC_DAY_NORMAL;
    totalHourSalary += otDayNormal * baseHourlyRate * RATE.OT_DAY_NORMAL;
    totalHourSalary += hcNightNormal * baseHourlyRate * RATE.HC_NIGHT_NORMAL;
    totalHourSalary += otNightNormal * baseHourlyRate * RATE.OT_NIGHT_NORMAL;
    
    // B. Ngày Nghỉ Hàng Tuần
    totalHourSalary += dayOffHours * baseHourlyRate * RATE.DAY_OFF;
    totalHourSalary += nightOffHours * baseHourlyRate * RATE.NIGHT_OFF;
    
    // C. Ngày Lễ, Tết
    totalHourSalary += holidayDayHours * baseHourlyRate * RATE.HOLIDAY_DAY;
    totalHourSalary += holidayNightHours * baseHourlyRate * RATE.HOLIDAY_NIGHT;
    
    // 4. Hiển thị kết quả
    document.getElementById('totalHourSalary').textContent = totalHourSalary.toLocaleString('vi-VN') + ' VND';

    // Lưu trữ tổng lương này để tính BHXH và TNCN sau
    window.grossSalaryFromHours = totalHourSalary; 
    
    console.log("Tổng tiền lương từ giờ làm (Gross):", totalHourSalary.toLocaleString('vi-VN'));
}

// Chạy hàm tính toán khi trang web được tải lần đầu
document.addEventListener('DOMContentLoaded', calculateSalary);
