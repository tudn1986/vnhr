(function () {
  const STANDARD_MONTHLY_HOURS = 176; // Giả định: 22 ngày * 8 giờ

  // Hệ số lương theo loại ngày làm việc
  const RATE = {
    HC_DAY_NORMAL: 1.0,
    OT_DAY_NORMAL: 1.5,
    HC_NIGHT_NORMAL: 1.3,
    OT_NIGHT_NORMAL: 2.1,
    DAY_OFF: 2.0,
    NIGHT_OFF: 2.7,
    HOLIDAY_DAY: 3.0,
    HOLIDAY_NIGHT: 3.9
  };

  function getNumber(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const n = parseFloat(el.value);
    return Number.isFinite(n) ? Math.max(0, n) : 0; // chặn âm và NaN -> 0
  }

  function formatVND(v) {
    return v.toLocaleString('vi-VN') + ' VND';
  }

  function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function calculateSalary() {
    // đảm bảo không chia cho 0
    const hoursDivisor = STANDARD_MONTHLY_HOURS > 0 ? STANDARD_MONTHLY_HOURS : 1;

    const baseSalary = getNumber('baseSalary');

    // Giờ làm việc
    const hcDayNormal = getNumber('hcDayNormal');
    const otDayNormal = getNumber('otDayNormal');
    const hcNightNormal = getNumber('hcNightNormal');
    const otNightNormal = getNumber('otNightNormal');

    const dayOffHours = getNumber('dayOffHours');
    const nightOffHours = getNumber('nightOffHours');

    const holidayDayHours = getNumber('holidayDayHours');
    const holidayNightHours = getNumber('holidayNightHours');

    const baseHourlyRate = baseSalary / hoursDivisor;

    // breakdown
    const payBaseHours = hcDayNormal * baseHourlyRate * RATE.HC_DAY_NORMAL;
    const payOtDay = otDayNormal * baseHourlyRate * RATE.OT_DAY_NORMAL;
    const payNight = hcNightNormal * baseHourlyRate * RATE.HC_NIGHT_NORMAL;
    const payOtNight = otNightNormal * baseHourlyRate * RATE.OT_NIGHT_NORMAL;

    const payDayOff = dayOffHours * baseHourlyRate * RATE.DAY_OFF;
    const payNightOff = nightOffHours * baseHourlyRate * RATE.NIGHT_OFF;

    const payHolidayDay = holidayDayHours * baseHourlyRate * RATE.HOLIDAY_DAY;
    const payHolidayNight = holidayNightHours * baseHourlyRate * RATE.HOLIDAY_NIGHT;

    const totalHourSalary = payBaseHours + payOtDay + payNight + payOtNight +
                            payDayOff + payNightOff + payHolidayDay + payHolidayNight;

    // display
    safeSetText('totalHourSalary', formatVND(Math.round(totalHourSalary)));
    // optional: breakdown fields if present
    safeSetText('break_base', formatVND(Math.round(payBaseHours)));
    safeSetText('break_ot_day', formatVND(Math.round(payOtDay)));
    safeSetText('break_night', formatVND(Math.round(payNight)));
    safeSetText('break_ot_night', formatVND(Math.round(payOtNight)));
    safeSetText('break_dayoff', formatVND(Math.round(payDayOff)));
    safeSetText('break_nightoff', formatVND(Math.round(payNightOff)));
    safeSetText('break_holiday_day', formatVND(Math.round(payHolidayDay)));
    safeSetText('break_holiday_night', formatVND(Math.round(payHolidayNight)));

    // lưu trữ để dùng tiếp
    window.grossSalaryFromHours = totalHourSalary;
    console.log('Tổng tiền lương từ giờ làm (Gross):', totalHourSalary);
  }

  // gắn sự kiện cho các input có thể thay đổi
  function initAutoCalc() {
    const ids = [
      'baseSalary', 'hcDayNormal', 'otDayNormal', 'hcNightNormal', 'otNightNormal',
      'dayOffHours', 'nightOffHours', 'holidayDayHours', 'holidayNightHours'
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calculateSalary);
    });

    const btn = document.getElementById('calcBtn');
    if (btn) btn.addEventListener('click', calculateSalary);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAutoCalc();
    calculateSalary();
  });
})();
