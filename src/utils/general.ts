export const convertToEST = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: true, // Use 12-hour time format (optional)
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date)
}
