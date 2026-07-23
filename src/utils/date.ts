// Date utility helpers for Hebrew / Local formatting

export function formatISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseISO(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const HEBREW_DAYS_SHORT = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];
export const HEBREW_DAYS_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

export function getHebrewDayName(date: Date, short = false): string {
  const dayIndex = date.getDay();
  return short ? HEBREW_DAYS_SHORT[dayIndex] : HEBREW_DAYS_FULL[dayIndex];
}

export function getHebrewFormattedDate(date: Date): string {
  const dayName = HEBREW_DAYS_FULL[date.getDay()];
  const day = date.getDate();
  const monthName = HEBREW_MONTHS[date.getMonth()];
  return `יום ${dayName}, ${day} ב${monthName}`;
}

export function getRelativeDateLabel(dateStr: string): string {
  const today = formatISO(new Date());
  const date = parseISO(dateStr);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatISO(yesterdayDate);

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = formatISO(tomorrowDate);

  if (dateStr === today) return 'היום';
  if (dateStr === yesterday) return 'אתמול';
  if (dateStr === tomorrow) return 'מחר';

  return `${getHebrewDayName(date, true)} ${date.getDate()}/${date.getMonth() + 1}`;
}

export function getDateRange(centerDate: Date, pastDays = 14, futureDays = 7): string[] {
  const dates: string[] = [];
  for (let i = -pastDays; i <= futureDays; i++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + i);
    dates.push(formatISO(d));
  }
  return dates;
}

export function getYearHeatmapDates(year: number = new Date().getFullYear()): string[] {
  const dates: string[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatISO(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function getPastNDays(n: number = 30): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(formatISO(d));
  }
  return dates;
}
