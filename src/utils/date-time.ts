export const convertToEST = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date)
}

export const getEasternTimestamps = (
  requestedDate: any,
  minutesForward: number = 0,
  requestedIsEastern: boolean = false,
) => {
  const tickTime = new Date(requestedDate)

  const format = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: requestedIsEastern ? undefined : 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(date)
    const lookup = (type: string) => parts.find((p) => p.type === type)?.value

    return `${lookup('year')}-${lookup('month')}-${lookup('day')} ${lookup('hour')}:${lookup('minute')}`
  }

  const oneMinuteAgo = new Date(tickTime.getTime() - 60 * 1000)
  const leadingInterval = new Date(tickTime.getTime() + 60000 * minutesForward)

  return [format(oneMinuteAgo), format(leadingInterval)]
}

export const getEastern930Timestamp = (baseTimestamp: string, daysBack: string = '0') => {
  const [datePart] = baseTimestamp.split('T')

  // Create a date object in Eastern Time (at midnight)
  const midnightEastern = new Date(`${datePart}T00:00:00`)

  // Shift to Eastern timezone
  const midnightInEastern = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(midnightEastern)

  const year = midnightInEastern.find((p) => p.type === 'year')?.value
  const month = midnightInEastern.find((p) => p.type === 'month')?.value
  const day = midnightInEastern.find((p) => p.type === 'day')?.value

  // Build Date for 9:30 AM ET on that day
  const date930 = new Date(`${year}-${month}-${day}T09:30:00`)

  // Subtract daysBack
  const daysPrevious = daysBack === 'today' ? 0 : +daysBack
  date930.setDate(date930.getDate() - daysPrevious)

  // Format final timestamp
  // eslint-disable-next-line max-len
  const formatted = `${date930.getFullYear()}-${String(date930.getMonth() + 1).padStart(2, '0')}-${String(date930.getDate()).padStart(2, '0')} ${String(date930.getHours()).padStart(2, '0')}:${String(date930.getMinutes()).padStart(2, '0')}`

  return formatted
}

export function getTimestampMeta() {
  const now = new Date()
  return {
    createdAtUTC: now.toISOString(),
    createdAtLocal: now.toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}
