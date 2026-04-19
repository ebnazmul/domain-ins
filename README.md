# 🌐 Domain Insight

Domain Insight is a Chrome extension that shows quick domain and network details for the current tab.

It focuses on being fast to open, easy to scan, and useful for real-world hostname checks.

## ✨ What It Shows

- 🏷️ Current domain
- 🔗 Registrable domain
- 🛡️ Domain status
- ⏳ Expiry with remaining days and date
- 🏢 Registrar
- 🧭 Nameservers
- 📡 `A` records for the current hostname
- 📍 IP information for `A[0]`
  - IP
  - Org
  - Company
  - ASN
  - Location

## ⚙️ Data Sources

- `cloudflare-dns.com` for DNS-over-HTTPS
- `rdap.org` for domain registration details
- `host.io` as an optional DNS/API token source
- `ipinfo.io` for IP enrichment

## 🔑 API Token

The popup has a top-right settings menu.

You can save one shared token there:

- `IPinfo / host.io` token

The extension stores the token locally and reuses it for:

- `host.io` DNS lookups when available
- `ipinfo.io` enrichment for the first `A` record

If the token is missing or invalid:

- the main popup still loads
- DNS and RDAP still work
- the IP info area may show unavailable or token-related messages

## 🚀 Load the Extension

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this folder
5. Open the extension popup on a normal website tab

## 🧩 Current Files

- `manifest.json`
- `popup.html`
- `popup.js`
- `styles.css`
- `AGENT.md`
- `DESIGN.md`

## 🛠 Permissions

- `activeTab`
- `tabs`
- `storage`

Host permissions:

- `https://cloudflare-dns.com/*`
- `https://rdap.org/*`
- `https://host.io/*`
- `https://ipinfo.io/*`

## 📌 Notes

- The popup is designed to render progressively.
- Main domain details appear first.
- DNS, RDAP, and IP info fill in as results arrive.
- This avoids blocking the UI while network calls are still running.

## ⚠️ Troubleshooting

### Popup opens but no domain appears

Open the popup on a regular website tab.

Chrome internal pages like `chrome://` do not expose a normal hostname.

### Token save does not work

Reload the extension in `chrome://extensions` and try again.

The current code also falls back to local storage if Chrome sync storage is unavailable.

### IP info is empty

Check that:

- the hostname has at least one `A` record
- your saved token is valid
- `ipinfo.io` is reachable

## 🎯 Goal

Keep the extension lightweight, practical, and fast enough for repeated popup use while still showing the important domain details.
