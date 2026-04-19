# Domain Insight

Chrome extension that shows the current tab hostname and its `A` records.

## Scope

- Reads the active tab URL
- Extracts the hostname
- Queries Cloudflare DNS-over-HTTPS for `A` records only

Removed from the popup flow:

- RDAP
- Registrar and expiry checks
- Nameserver lookups
- Reverse DNS
- IPinfo enrichment
- Token storage UI

## Files

- `manifest.json`
- `popup.html`
- `popup.js`
- `styles.css`

## Load

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click Load unpacked
4. Select this folder
