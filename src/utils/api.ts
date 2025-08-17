/* src/utils/api.ts */

/**
 * Builds a URL query parameter string from a given object.
 * 
 * Skips any parameters with `undefined` or `null` values.
 * Automatically encodes keys and values for safe URL usage.
 * 
 * @param params - An object containing query parameters.
 * @returns {string} A properly formatted query string (without the leading `?`).
 */
export function buildParamString(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}
