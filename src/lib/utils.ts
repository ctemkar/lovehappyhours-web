import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type Deal, type DayOfWeek } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

export function isDealActiveNow(deal: Deal, timezone = 'Asia/Bangkok'): boolean {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric', minute: 'numeric', hour12: false,
    weekday: 'short',
  })
  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3) as DayOfWeek

  if (!deal.daysActive.includes(weekday)) return false
  if (!deal.isActive) return false

  const currentMinutes = hour * 60 + minute
  const [startH, startM] = deal.startTime.split(':').map(Number)
  const [endH, endM] = deal.endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (endMinutes > startMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }
  // Crosses midnight
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

export function formatTimeRange(start: string, end: string): string {
  const format = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return m === 0 ? `${hour}${period}` : `${hour}:${m.toString().padStart(2, '0')}${period}`
  }
  return `${format(start)} – ${format(end)}`
}

export function formatDaysActive(days: DayOfWeek[]): string {
  const allDays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  if (days.length === 7) return 'Every day'
  if (days.length === 5 && !days.includes('sat') && !days.includes('sun')) return 'Weekdays'
  if (days.length === 2 && days.includes('sat') && days.includes('sun')) return 'Weekends'
  const labels: Record<DayOfWeek, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
  return days.map(d => labels[d]).join(', ')
}

export function formatPriceRange(range: number): string {
  return '฿'.repeat(range)
}
