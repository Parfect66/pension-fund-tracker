# Drop factsheets here

To swap or add funds tracked on the dashboard:

1. **Drop the fund's factsheet PDF into this folder.**
   Get it from Trustnet (the "Factsheet PDF" link) or the FE fundinfo /
   feprecisionplus factsheet. Any series of the fund works (CS8, Series 2, Life,
   etc.) — the top-10 holdings are identical across wrappers.

2. **Tell Claude** *"add the fund(s) in the factsheets folder"* or *"replace
   the current funds with the ones in factsheets"*.

Claude reads each PDF, maps every holding to its correct Yahoo Finance ticker
(London `.L`, Taiwan `.TW`, Korea `.KS`, Hong Kong `.HK`, Australia `.AX`,
Toronto `.TO`, Tokyo `.T`, Shanghai `.SS`; ADRs; ticker changes), verifies each
with a live quote, then rewrites [`../funds.mjs`](../funds.mjs). Push and the
dashboard rebuilds itself around the new fund list.

## Notes

- Only listed-security funds work here. Physical property funds (buildings) and
  bond funds without listed instruments can't show per-holding daily moves.
- Fund values you've entered are keyed by the fund's internal `key` in
  `funds.mjs` (e.g. `biotech`, `gold`). Renaming a key resets that fund's stored
  value; leave the key alone if you just want to refresh holdings.
- Holdings only change monthly / quarterly, so this is an occasional job.
