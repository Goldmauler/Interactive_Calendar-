export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export const MONTH_IMAGES = [
  '/images/month-01.png',
  '/images/month-02.png',
  '/images/month-03.png',
  '/images/month-04.png',
  '/images/month-05.png',
  '/images/month-06.png',
  '/images/month-07.png',
  '/images/month-08.png',
  '/images/month-09.png',
  '/images/month-10.png',
  '/images/month-11.png',
  '/images/month-12.png'
];

// Map of Month_Day -> Holiday Event (0-indexed month)
export const HOLIDAYS = {
  '0_1': "New Year's Day",
  '1_14': "Valentine's Day",
  '6_4': "Independence Day",
  '9_31': "Halloween",
  '11_25': "Christmas Day"
};

export const getHoliday = (date) => {
  if (!date) return null;
  return HOLIDAYS[`${date.getMonth()}_${date.getDate()}`] || null;
};

export const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const isToday = (date) => isSameDay(date, new Date());

export const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isInRange = (date, start, end) => {
  if (!start || !end || !date) return false;
  // Exclusive bounds for the middle highlight
  return date > start && date < end;
};

export const getDayCount = (start, end) => {
  if (!start || !end) return 0;
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
};

export const formatDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Generate 42 cells (6 rows) starting on Monday
export const getMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // getDay(): Sunday = 0, Monday = 1 ... Saturday = 6
  // Convert Monday-first index: Mon=0, Sun=6
  let startingDayIndex = firstDay.getDay() - 1;
  if (startingDayIndex === -1) startingDayIndex = 6; 
  
  const totalDays = lastDay.getDate();
  const grid = [];
  
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  // Trailing days from previous month
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    grid.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    });
  }
  
  // Current month
  for (let i = 1; i <= totalDays; i++) {
    grid.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  // Leading days next month
  let nextDay = 1;
  while (grid.length < 42) {
    grid.push({
      date: new Date(year, month + 1, nextDay++),
      isCurrentMonth: false
    });
  }
  
  return grid;
};
