export function buildParamString(params: any) {
  return Object.entries(params)
    .map(([k, v]) => (v ? `${k}=${v}` : ''))
    .join('&')
}
