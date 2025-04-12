export const Logger = {
  info: (...msgs: any[]) => console.log('[INFO]', ...msgs),
  error: (...msgs: any[]) => console.error('[ERROR]', ...msgs),
  debug: (...msgs: any[]) => console.debug('[DEBUG]', ...msgs),
}
