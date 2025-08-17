/**
 * @file src/utils/date-time.ts
 * @fileoverview Timestamp utility functions for handling Eastern Time (ET) conversions and formatting.
 * 
 * This module provides functions to:
 * - Convert dates to EST/ET time strings.
 * - Generate timestamp ranges relative to a given date.
 * - Get market-open (9:30 AM ET) timestamps.
 * - Retrieve timestamp metadata including UTC and local time representations.
 * 
 * Useful for stock trading systems and data pipelines requiring consistent Eastern Time handling.
**/

import { CreationMeta } from "@/types"

/**
 * @function convertToEST
 * @description - Converts a given date to an EST (Eastern Time) string with time only.
 *
 * @param date - The date object to convert.
 * @returns {string} Time string in Eastern Time (hh:mm:ss AM/PM).
 */
export const convertToEST = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date)
}

/**
 * @function getEasternTimestamps
 * @description - Returns two formatted timestamps in Eastern Time:
 * - One minute ago from the requested time.
 * - A future timestamp X minutes forward.
 *
 * @param requestedDate - Base date (can be Date, string, or timestamp).
 * @param minutesForward - How many minutes forward the second timestamp should be.
 * @param requestedIsEastern - Whether the provided date is already in Eastern Time.
 * @returns {[string, string]} An array of [pastTimestamp, futureTimestamp].
 */
export const getEasternTimestamps = (
  requestedDate: Date | string | number,
  minutesForward: number = 0,
  requestedIsEastern: boolean = false,
): [string, string] => {
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

/**
 * @function getEastern930Timestamp
 * @description - Returns the 9:30 AM Eastern timestamp (market open) for the given base date, minus an optional number of days back.
 *
 * @param baseTimestamp - ISO or date string (e.g., '2024-10-10T15:23:00').
 * @param daysBack - Number of days to subtract, or 'today' to stay on the same day.
 * @returns {string} Formatted timestamp string for 9:30 AM ET (yyyy-mm-dd hh:mm).
 */
export const getEastern930Timestamp = (baseTimestamp: string, daysBack: string = '0'): string => {
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
  const formatted = `${date930.getFullYear()}-${String(date930.getMonth() + 1).padStart(2, '0')}-${String(date930.getDate()).padStart(2, '0')} ${String(date930.getHours()).padStart(2, '0')}:${String(date930.getMinutes()).padStart(2, '0')}`

  return formatted
}

/**
 * @function getTimestampMeta
 * @description - Generates metadata for the current timestamp including UTC and local time representations.
 *
 * @returns {CreationMeta} Timestamp metadata.
 */
export function getTimestampMeta(): CreationMeta {
  const now = new Date()
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return {
    createdAtUTC: now.toISOString(),
    createdAtLocal: now.toLocaleString('en-US', {
      timeZone: localTimezone,
    }),
    localTimezone: localTimezone,
  }
}
