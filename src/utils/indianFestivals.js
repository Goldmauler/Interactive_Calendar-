/**
 * Indian Festivals & Holidays Database
 * Static dataset for 2025-2027 + Calendarific API integration
 * Format: 'YYYY-M-D' (0-indexed month like JS Date)
 */

export const FESTIVAL_TYPES = {
  national: { label: 'National Holiday', color: '#FF9933', bg: 'rgba(255,153,51,0.15)' },
  hindu:    { label: 'Hindu Festival',   color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  muslim:   { label: 'Muslim Festival',  color: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
  sikh:     { label: 'Sikh Festival',    color: '#9333EA', bg: 'rgba(147,51,234,0.12)' },
  christian:{ label: 'Christian Festival',color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  buddhist: { label: 'Buddhist Festival',color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  jain:     { label: 'Jain Festival',    color: '#0891B2', bg: 'rgba(8,145,178,0.12)' },
};

// Hardcoded comprehensive dataset for 2025-2027
// Key format: 'YYYY-M-D' (month is 0-indexed to match JS Date.getMonth())
export const INDIAN_FESTIVALS_STATIC = {
  /* ─── 2025 ─────────────────────────────────────────── */
  '2025-0-1':  { name: "New Year's Day",        type: 'national', special: false },
  '2025-0-13': { name: 'Lohri',                 type: 'hindu',    special: false },
  '2025-0-14': { name: 'Makar Sankranti / Pongal', type: 'hindu', special: true,  fireworks: false, colors: false },
  '2025-0-26': { name: 'Republic Day',           type: 'national', special: true  },
  '2025-1-2':  { name: 'Vasant Panchami',        type: 'hindu',    special: false },
  '2025-1-19': { name: 'Maha Shivratri',         type: 'hindu',    special: true  },
  '2025-2-14': { name: 'Holi (Holika Dahan)',    type: 'hindu',    special: true,  colors: true },
  '2025-2-15': { name: 'Holi - Festival of Colours', type: 'hindu', special: true, colors: true },
  '2025-2-30': { name: 'Eid al-Fitr (approx)',   type: 'muslim',   special: true  },
  '2025-2-31': { name: 'Gudi Padwa / Ugadi',     type: 'hindu',    special: false },
  '2025-3-6':  { name: 'Ram Navami',             type: 'hindu',    special: false },
  '2025-3-10': { name: 'Mahavir Jayanti',        type: 'jain',     special: false },
  '2025-3-14': { name: 'Dr. Ambedkar Jayanti',   type: 'national', special: false },
  '2025-3-18': { name: 'Good Friday',            type: 'christian',special: false },
  '2025-3-20': { name: 'Easter Sunday',          type: 'christian',special: false },
  '2025-4-12': { name: 'Buddha Purnima',         type: 'buddhist', special: false },
  '2025-5-7':  { name: 'Eid al-Adha (approx)',   type: 'muslim',   special: true  },
  '2025-5-27': { name: 'Muharram',               type: 'muslim',   special: false },
  '2025-7-15': { name: 'Independence Day',   type: 'national', special: true,  fireworks: true },
  '2025-7-16': { name: 'Janmashtami',            type: 'hindu',    special: true  },
  '2025-8-27': { name: 'Ganesh Chaturthi',       type: 'hindu',    special: true  },
  '2025-9-2':  { name: 'Gandhi Jayanti',         type: 'national', special: false },
  '2025-9-2':  { name: 'Navratri Begins',        type: 'hindu',    special: false },
  '2025-9-4':  { name: 'Maha Navami',            type: 'hindu',    special: false },
  '2025-9-5':  { name: 'Dussehra / Vijayadashami', type: 'hindu',  special: true  },
  '2025-9-20': { name: 'Diwali - Dhanteras',  type: 'hindu',    special: true,  fireworks: true },
  '2025-9-21': { name: 'Diwali - Choti Diwali',type: 'hindu',   special: true,  fireworks: true },
  '2025-9-22': { name: 'Diwali - Main Day',   type: 'hindu',    special: true,  fireworks: true },
  '2025-9-23': { name: 'Govardhan Puja',      type: 'hindu',    special: false },
  '2025-9-24': { name: 'Bhai Dooj',           type: 'hindu',    special: false },
  '2025-10-5': { name: 'Guru Nanak Jayanti',     type: 'sikh',     special: true  },
  '2025-11-25': { name: 'Christmas',          type: 'christian',special: true  },
  '2025-11-31': { name: "New Year's Eve",        type: 'national', special: false },

  /* ─── 2026 ─────────────────────────────────────────── */
  '2026-0-1':  { name: "New Year's Day",         type: 'national', special: false },
  '2026-0-14': { name: 'Makar Sankranti',        type: 'hindu',    special: false },
  '2026-0-26': { name: 'Republic Day',           type: 'national', special: true  },
  '2026-1-19': { name: 'Maha Shivratri',         type: 'hindu',    special: true  },
  '2026-2-3':  { name: 'Holi - Festival of Colours', type: 'hindu', special: true, colors: true },
  '2026-2-19': { name: 'Eid al-Fitr (approx)',   type: 'muslim',   special: true  },
  '2026-2-26': { name: 'Gudi Padwa / Ugadi',     type: 'hindu',    special: false },
  '2026-3-3':  { name: 'Good Friday',            type: 'christian',special: false },
  '2026-3-5':  { name: 'Easter Sunday',          type: 'christian',special: false },
  '2026-3-14': { name: 'Dr. Ambedkar Jayanti',   type: 'national', special: false },
  '2026-4-1':  { name: 'Buddha Purnima',         type: 'buddhist', special: false },
  '2026-5-27': { name: 'Eid al-Adha (approx)',   type: 'muslim',   special: true  },
  '2026-7-15': { name: 'Independence Day',   type: 'national', special: true,  fireworks: true },
  '2026-7-5':  { name: 'Janmashtami',            type: 'hindu',    special: true  },
  '2026-8-25': { name: 'Ganesh Chaturthi',       type: 'hindu',    special: true  },
  '2026-9-2':  { name: 'Gandhi Jayanti',         type: 'national', special: false },
  '2026-9-23': { name: 'Navratri Begins',        type: 'hindu',    special: false },
  '2026-9-30': { name: 'Dussehra / Vijayadashami',type: 'hindu',   special: true  },
  '2026-10-8': { name: 'Diwali - Dhanteras',  type: 'hindu',    special: true,  fireworks: true },
  '2026-10-9': { name: 'Diwali - Choti Diwali',type: 'hindu',   special: true,  fireworks: true },
  '2026-10-10':{ name: 'Diwali - Main Day',   type: 'hindu',    special: true,  fireworks: true },
  '2026-10-25':{ name: 'Guru Nanak Jayanti',     type: 'sikh',     special: true  },
  '2026-11-25':{ name: 'Christmas',           type: 'christian',special: true  },
};

/**
 * Get festival for a given date
 * @param {Date} date
 * @param {Object} apiFestivals - live API data keyed same way
 */
export const getIndianFestival = (date, apiFestivals = {}) => {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  return apiFestivals[key] || INDIAN_FESTIVALS_STATIC[key] || null;
};

/**
 * Get all festivals for a given month
 */
export const getMonthFestivals = (year, month, apiFestivals = {}) => {
  const result = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${month}-${d}`;
    const fest = apiFestivals[key] || INDIAN_FESTIVALS_STATIC[key];
    if (fest) result.push({ day: d, date: new Date(year, month, d), ...fest });
  }
  return result.sort((a, b) => a.day - b.day);
};

/**
 * Fetch from Calendarific API (needs NEXT_PUBLIC_CALENDARIFIC_KEY env var)
 * Returns normalized object keyed as 'YYYY-M-D'
 */
export const fetchCalendarificFestivals = async (year) => {
  const apiKey = process.env.NEXT_PUBLIC_CALENDARIFIC_KEY;
  if (!apiKey) return {};

  try {
    const res = await fetch(
      `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=IN&year=${year}&type=national,religious`
    );
    if (!res.ok) return {};
    const data = await res.json();
    const result = {};
    (data.response?.holidays || []).forEach(h => {
      const d = new Date(h.date.iso);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      result[key] = {
        name: h.name,
        description: h.description,
        type: h.type?.[0]?.toLowerCase().includes('national') ? 'national' : 'hindu',
        special: h.primary_type === 'National holiday',
      };
    });
    return result;
  } catch {
    return {};
  }
};
