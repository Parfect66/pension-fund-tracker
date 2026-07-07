// -----------------------------------------------------------------------------
// UK-time helpers shared by the frontend (app.mjs) and the API (api/funds.mjs).
//
// This is the ONLY place the daily-apply schedule is defined. The UI hint text
// and the server error message both derive from DAILY_APPLY_MINUTE, so the
// client check, server gate, and displayed time can never drift apart again
// (they once disagreed - UI said 10:00, server checked 19:00 - and the endpoint
// silently refused every apply for 9 hours a day).
//
// All logic uses Europe/London via Intl.DateTimeFormat, never the local clock:
// the server runs in UTC and the frontend runs wherever the browser is.
// -----------------------------------------------------------------------------

// 09:10 UK - after all Asian markets have closed.
export const DAILY_APPLY_MINUTE = 9 * 60 + 10;

// "09:10" - for UI hints and error messages.
export const DAILY_APPLY_LABEL =
  String(Math.floor(DAILY_APPLY_MINUTE / 60)).padStart(2, '0') + ':' +
  String(DAILY_APPLY_MINUTE % 60).padStart(2, '0');

export function getUKDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

export function getUKMinutesSinceMidnight() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const hh = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const mm = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return hh * 60 + mm;
}
