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

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function isPastDate(dateStr: string): boolean {
  return dateStr < formatDate(new Date())
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
