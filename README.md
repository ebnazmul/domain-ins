# 🌐 Domain Insight

Domain Insight is a Chrome extension that shows quick domain and network details for the current tab.

It focuses on fast popup startup, progressive rendering, and useful hostname checks without a backend service.

## ✨ What It Shows

- 🏷️ Current hostname
- 🔗 Best-effort registrable or delegated domain
- 🛡️ Domain status from RDAP
- ⏳ Expiry with remaining days and date
- 🏢 Registrar
- 🧭 Nameservers
- 📡 `A` records for the current hostname
- 📍 IP information for the first `A` record:
  - IP
  - Org
  - Company
  - ASN
  - Location

## ⚙️ Data Sources

- `cloudflare-dns.com` for DNS-over-HTTPS fallback lookups
- `rdap.org` for domain registration details
- `ipinfo.io` as optional enrichment for the first `A` record
- `dns.google` as a secondary DNS-over-HTTPS resolver if Cloudflare fails

## 🔑 API Token

The popup has a top-right settings menu. You can save one token:

- `IPinfo` token

The extension stores the token in extension storage and reuses it for:

- `ipinfo.io` enrichment for the first `A` record

If the token is missing or invalid:

- The main popup still loads.
- DNS and RDAP still work through public fallbacks.
- The IP info area may show unavailable or token-related messages.

## 🚀 Load the Extension

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder.
5. Open the extension popup on a normal website tab.

## 🧩 Current Files

- `manifest.json`
- `background.js`
- `popup.html`
- `popup.js`
- `styles.css`
- `src/api.js`
- `src/config.js`
- `src/domain.js`
- `src/dom.js`
- `src/render.js`
- `src/storage.js`
- `AGENT.md`
- `AGENT.TODO.md`
- `DESIGN.md`

## 🛠️ Permissions

- `activeTab`
- `tabs`
- `storage`
- `contextMenus`
- `scripting`

Host permissions:

- `https://cloudflare-dns.com/*`
- `https://dns.google/*`
- `https://rdap.org/*`
- `https://ipinfo.io/*`

## 📌 Notes

- The popup renders progressively.
- Main domain details appear first.
- DNS, RDAP, and IP info fill in as results arrive.
- Optional API failures degrade gracefully.
- DNS records are fetched through live DNS-over-HTTPS queries with no-store fetch options and visible TTL values.
- The Refresh button re-runs DNS and RDAP lookups for the active hostname while the popup is open.
- The right-click context menu appears for selected text, opens DNSLT for valid domains/IPv4 addresses, and shows an in-page tooltip for invalid selections.
- `AGENT.md` is the repository source of truth for architecture, operational notes, and progress.

## ⚠️ Troubleshooting

### Popup opens but no domain appears

Open the popup on a regular website tab. Chrome internal pages like `chrome://` do not expose a normal hostname.

### Token save does not work

Reload the extension in `chrome://extensions` and try again. The code falls back to local storage if Chrome extension storage is unavailable.

### IP info is empty

Check that:

- The hostname has at least one `A` record.
- Your saved token is valid.
- `ipinfo.io` is reachable.

## 🎯 Goal

Keep the extension lightweight, practical, secure by default, and fast enough for repeated popup use while still showing the important domain details.
