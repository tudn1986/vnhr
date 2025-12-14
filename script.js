/**
 * Hàm tính toán tiền lương cơ bản từ giờ làm việc
 * (Phiên bản 2.1 - Tính toán chi tiết theo mức lương căn cứ mới)
 */
function calculateSalary() {
    // 1. Dữ liệu Đầu vào: Lấy các mức lương căn cứ
    const baseSalaryForHours = parseFloat(document.getElementById('baseSalaryForHours').value) || 0; 
    const baseSalaryForAllowances = parseFloat(document.getElementById('baseSalaryForAllowances').value) || 0; 
    const socialInsuranceSalary = parseFloat(document.getElementById('socialInsuranceSalary').value) || 0; 
    
    // Lấy Giờ làm việc Ngày Thường
    const hcDayNormal = parseFloat(document.getElementById('hcDayNormal').value) || 0;
    const otDayNormal = parseFloat(document.getElementById('otDayNormal').value) || 0;
    const hcNightNormal = parseFloat(document.getElementById('hcNightNormal').value) || 0;
    const otNightNormal = parseFloat(document.getElementById('otNightNormal').value) || 0;
    
    // Lấy Giờ làm việc Ngày Nghỉ
    const dayOffHours = parseFloat(document.getElementById('dayOffHours').value) || 0;
    const nightOffHours = parseFloat(document.getElementById('nightOffHours').value) || 0;
    
    // Lấy Giờ làm việc Ngày Lễ/Tết
    const holidayDayHours = parseFloat(document.getElementById('holidayDayHours').value) || 0;
    const holidayNightHours = parseFloat(document.getElementById('holidayNightHours').value) || 0;

    // 2. Định nghĩa Hằng số và Hệ số lương
    const STANDARD_MONTHLY_HOURS = 176; // Giả định: Số giờ làm việc chuẩn trong tháng (22 ngày * 8 giờ)
    
    // Hệ số lương theo loại ngày làm việc
    const RATE = {
        // Ngày Thường
        HC_DAY_NORMAL: 1.0,   
        OT_DAY_NORMAL: 1.5,   
        HC_NIGHT_NORMAL: 1.3, 
        OT_NIGHT_NORMAL: 2.1, 

        // Ngày Nghỉ Hàng Tuần
        DAY_OFF: 2.0,       
        NIGHT_OFF: 2.7,     

        // Ngày Lễ, Tết
        HOLIDAY_DAY: 3.0,   
        HOLIDAY_NIGHT: 3.9  
    };

    // Tính tiền lương cho 1 giờ làm việc cơ bản (Hourly Rate)
    // Căn cứ vào Lương cơ bản tính Giờ làm/Tăng ca
    const baseHourlyRate = baseSalaryForHours / STANDARD_MONTHLY_HOURS;
    
    // 3. Tính Tổng tiền lương từ giờ làm (Gross Salary Component)
    let totalHourSalary = 0;
    
    // Tính lương cho từng loại giờ làm bằng cách nhân (Số giờ * Lương/giờ * Hệ số)
    
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
    
    // 4. Hiển thị kết quả và lưu trữ biến toàn cục
    document.getElementById('totalHourSalary').textContent = totalHourSalary.toLocaleString('vi-VN') + ' VND';

    // Lưu trữ các biến quan trọng để dùng cho các bước tính BHXH, TNCN sau
    window.grossSalaryFromHours = totalHourSalary; 
    window.baseSalaryForAllowances = baseSalaryForAllowances; 
    window.socialInsuranceSalary = socialInsuranceSalary; 
    
    console.log("Tiền lương cơ bản/giờ:", baseHourlyRate.toLocaleString('vi-VN'));
    console.log("Tổng tiền lương từ giờ làm (Gross Tạm Tính):", totalHourSalary.toLocaleString('vi-VN'));
}

// Chạy hàm tính toán khi trang web được tải lần đầu
document.addEventListener('DOMContentLoaded', calculateSalary);
