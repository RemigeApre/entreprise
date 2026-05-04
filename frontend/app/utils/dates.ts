export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateFr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

export function formatDateShortFr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => addDays(monday, i))
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  return formatDate(a) === formatDate(b)
}

export function isDateInContractPeriod(
  date: string,
  contractStart: string | null | undefined,
  contractEnd: string | null | undefined
): { valid: boolean; reason?: string } {
  if (contractStart && date < contractStart) {
    return { valid: false, reason: 'Date anterieure au debut de contrat' }
  }
  if (contractEnd && date > contractEnd) {
    return { valid: false, reason: 'Date posterieure a la fin de contrat' }
  }
  return { valid: true }
}

// Bascule auto 'a_venir' -> 'actif' quand la date de debut de contrat est passee.
// Volontairement non-symetrique : on ne degrade jamais un statut stocke 'actif'/'test'
// vers 'a_venir' meme si le contrat est dans le futur (sinon les comptes crees
// manuellement avec une date de debut future seraient restreints sans raison).
export function getEffectiveStatutEmploi(user: {
  statut_emploi?: string | null
  date_debut_contrat?: string | null
} | null | undefined): string | null {
  if (!user) return null
  if (user.statut_emploi === 'a_venir' && user.date_debut_contrat) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const debut = new Date(user.date_debut_contrat + 'T00:00:00')
    if (debut <= today) return 'actif'
  }
  return user.statut_emploi || 'actif'
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getNextWorkingDay(date: Date): Date {
  const d = new Date(date)
  do {
    d.setDate(d.getDate() + 1)
  } while (d.getDay() === 0 || d.getDay() === 6)
  return d
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isFriday(date: Date): boolean {
  return date.getDay() === 5
}

export function getCurrentOrNextMonday(date: Date): Date {
  if (isWeekend(date)) {
    return getMonday(getNextWorkingDay(date))
  }
  return getMonday(date)
}

export function getTodayOrNextWorkingDay(date: Date): Date {
  if (isWeekend(date)) return getNextWorkingDay(date)
  return date
}

export function isPastDate(dateStr: string): boolean {
  return dateStr < formatDate(new Date())
}

/**
 * Returns the "effective" working day to highlight:
 * - Today if weekday, before 18h, and not in ferieDates
 * - Tomorrow (or next working day) if past 18h
 * - Monday if weekend
 * - Skips any dates in ferieDates
 */
export function getEffectiveWorkDay(now: Date = new Date(), ferieDates: Set<string> = new Set()): Date {
  let d = new Date(now)
  d.setHours(0, 0, 0, 0)

  // After 18h → advance to next day
  if (now.getHours() >= 18) {
    d.setDate(d.getDate() + 1)
  }

  // Skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1)
  }

  // Skip ferie days (max 30 iterations safety)
  let safety = 0
  while (ferieDates.has(formatDate(d)) && safety < 30) {
    d.setDate(d.getDate() + 1)
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1)
    }
    safety++
  }

  return d
}

/**
 * Retourne les jours feries francais pour une annee donnee.
 * Map<"YYYY-MM-DD", nom du jour ferie>
 */
export function getFrenchPublicHolidays(year: number): Map<string, string> {
  // Calcul de Paques (algorithme Meeus/Jones/Butcher)
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1
  const easter = new Date(year, easterMonth, easterDay)

  const fmt = (d: Date) => formatDate(d)
  const shift = (base: Date, n: number) => { const r = new Date(base); r.setDate(r.getDate() + n); return r }

  const holidays = new Map<string, string>()
  holidays.set(fmt(new Date(year, 0, 1)),   'Jour de l\'An')
  holidays.set(fmt(shift(easter, 1)),        'Lundi de Paques')
  holidays.set(fmt(new Date(year, 4, 1)),   'Fete du Travail')
  holidays.set(fmt(new Date(year, 4, 8)),   'Victoire 1945')
  holidays.set(fmt(shift(easter, 39)),       'Ascension')
  holidays.set(fmt(shift(easter, 50)),       'Lundi de Pentecote')
  holidays.set(fmt(new Date(year, 6, 14)),  'Fete Nationale')
  holidays.set(fmt(new Date(year, 7, 15)),  'Assomption')
  holidays.set(fmt(new Date(year, 10, 1)),  'Toussaint')
  holidays.set(fmt(new Date(year, 10, 11)), 'Armistice')
  holidays.set(fmt(new Date(year, 11, 25)), 'Noel')

  return holidays
}

export function getEachDayBetween(start: string, end: string): string[] {
  const days: string[] = []
  const current = new Date(start)
  const endDate = new Date(end)
  while (current <= endDate) {
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      days.push(formatDate(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return days
}

export function generateRecurrenceDates(
  startDate: string,
  endDate: string,
  recurrenceType: RecurrenceType
): string[] {
  if (recurrenceType === 'aucune') return [startDate]

  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  if (start > end) return [startDate]

  const dates: string[] = []

  if (recurrenceType === 'chaque_jour_ouvre') {
    const current = new Date(start)
    while (current <= end) {
      const day = current.getDay()
      if (day !== 0 && day !== 6) dates.push(formatDate(current))
      current.setDate(current.getDate() + 1)
    }
  } else if (recurrenceType === 'chaque_jour') {
    const current = new Date(start)
    while (current <= end) {
      dates.push(formatDate(current))
      current.setDate(current.getDate() + 1)
    }
  } else if (recurrenceType === 'chaque_semaine') {
    const current = new Date(start)
    while (current <= end) {
      dates.push(formatDate(current))
      current.setDate(current.getDate() + 7)
    }
  } else if (recurrenceType === 'toutes_les_2_semaines') {
    const current = new Date(start)
    while (current <= end) {
      dates.push(formatDate(current))
      current.setDate(current.getDate() + 14)
    }
  } else if (recurrenceType === 'chaque_mois') {
    const anchorDay = start.getDate()
    const current = new Date(start)
    while (current <= end) {
      dates.push(formatDate(current))
      const nextMonth = current.getMonth() + 1
      const nextYear = current.getFullYear() + Math.floor(nextMonth / 12)
      const actualMonth = nextMonth % 12
      const daysInMonth = new Date(nextYear, actualMonth + 1, 0).getDate()
      current.setFullYear(nextYear)
      current.setMonth(actualMonth)
      current.setDate(Math.min(anchorDay, daysInMonth))
    }
  }

  return dates
}
