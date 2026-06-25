/** Parsuje YYYY-MM-DD jako datę lokalną (nie UTC). */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function todayStart(): Date {
  return startOfLocalDay(new Date());
}

/** Wybrana data, ale nie wcześniej niż dziś (bez przeszłości). */
function notBeforeToday(date: Date): Date {
  const today = todayStart();
  const day = startOfLocalDay(date);
  return day < today ? today : day;
}

/** Zakres od wybranej daty (start) przez N dni do przodu. */
function daysFromDate(
  baseDate: Date,
  dayCount: number
): { dateFrom: Date; dateTo: Date } {
  const dateFrom = notBeforeToday(baseDate);
  const dateTo = new Date(dateFrom);
  dateTo.setDate(dateTo.getDate() + dayCount);
  return { dateFrom, dateTo: endOfLocalDay(dateTo) };
}

export function resolveEventDateRange(
  from: string | undefined,
  to: string | undefined,
  range: string | undefined
): { dateFrom: Date; dateTo: Date } {
  const baseDate = from ? parseLocalDate(from) : todayStart();
  const today = todayStart();

  // Domyślnie (brak range/from/to) — okno 3 miesięcy do przodu.
  const effectiveRange = !range && !from && !to ? "3months" : range;

  if (effectiveRange === "3days") {
    return daysFromDate(baseDate, 3);
  }

  if (effectiveRange === "7days") {
    return daysFromDate(baseDate, 7);
  }

  if (effectiveRange === "3months") {
    const dateFrom = notBeforeToday(baseDate);
    const dateTo = new Date(dateFrom);
    dateTo.setMonth(dateTo.getMonth() + 3);
    return { dateFrom, dateTo: endOfLocalDay(dateTo) };
  }

  // Dziś — tylko wybrany dzień
  const dateFrom = startOfLocalDay(baseDate);
  const dateTo = to ? endOfLocalDay(parseLocalDate(to)) : endOfLocalDay(baseDate);

  if (dateTo < today) {
    return { dateFrom: dateTo, dateTo: dateFrom };
  }

  return {
    dateFrom: dateFrom < today ? today : dateFrom,
    dateTo,
  };
}
