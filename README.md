# Domain Insight (Chrome Extension)

Show **nameservers**, **A records**, **reverse DNS**, **IP org/company/ASN**, plus **domain status**, **days to expiry**, and **registrar** for the current tab’s domain.

Data sources: **Cloudflare DNS-over-HTTPS**, **RDAP**, **IPinfo** (free token recommended).

---

## Quick Start

1. **Download** this folder (containing `manifest.json`, `popup.html`, `styles.css`, `popup.js`).
2. Open Chrome → go to **chrome://extensions**.
3. Toggle **Developer mode** (top-right).
4. Click **Load unpacked** → select this folder.
5. Click the extension icon to open the popup.
6. In **Settings** (inside the popup), paste your **IPinfo** token (free) and click **Save**.

> That’s it — **Load unpacked, set IPinfo (free), good to go.** ✅

---

## What You’ll See

- **Target**
  - Domain
  - Status (from RDAP)
  - Expiry (as **“XX days left”** or **“Expired”**)
  - Registrar (robust RDAP parsing; falls back to IANA Registrar ID if needed)
- **Nameservers (NS)** — zone apex NS (via Cloudflare DoH)
- **A Records** — for current hostname and apex
- **IP Details** — first A record’s IP:
  - IP, rDNS (PTR), Org, ASN, Company, Country/Region (via IPinfo)

---

## Why IPinfo?

The popup will work without a token, but IP data may be rate-limited.
Get a free token: https://ipinfo.io/signup

Paste it in **Settings → IPinfo Token → Save**.

---

## Permissions

- `activeTab`, `tabs` — read the current tab URL to extract the domain.
- `storage` — save your IPinfo token.
- `host_permissions` — fetch:
  - `https://cloudflare-dns.com/*` (DoH JSON)
  - `https://1.1.1.1/*` (alternate DoH)
  - `https://ipinfo.io/*` (IP data)
  - `https://rdap.org/*` (domain status, expiry, registrar)

---

## How It Works (Tech Notes)

- **Apex detection**: walks the hostname labels upward and selects the first label with NS answers (zone apex).
- **RDAP**: queried **with the apex** (not subdomain) for:
  - `status[]`
  - `events` → `expiration` → computes **“X days left”**
  - **registrar**:
    1. `registrarName` (if present)
    2. registrar **entity** with role `registrar` → vCard `fn`
    3. follow **related RDAP link** and read `registrarName` / vCard
    4. fallback to **IANA Registrar ID**
- **DNS**: Cloudflare DoH (`application/dns-json`) for `NS`, `A`, and `PTR` (reverse DNS).
- **IPinfo**: enriches the **first** A record IP (org, ASN, company, location).

---

## Troubleshooting

- **No styles / CSS not applied**
  - Ensure `styles.css` sits next to `popup.html` and the link tag is `href="styles.css"`.
  - Reload the extension in **chrome://extensions** after edits.

- **“Could not extract hostname”**
  - Some Chrome pages (e.g., chrome://, extension pages) don’t expose a URL—open the popup on a normal website tab.

- **Registrar shows as “Unknown”**
  - RDAP data varies by registry/registrar. The code tries multiple strategies (direct, vCard entity, follow registrar RDAP link, IANA ID). If it still shows Unknown for a specific TLD, it’s likely a data limitation.

- **IP info empty or limited**
  - Add a free **IPinfo** token in **Settings** to avoid rate limits.

---

## Privacy

- The extension reads the **current tab’s URL** when you open the popup.
- It calls public endpoints (**Cloudflare DoH**, **RDAP**, **IPinfo**) to resolve DNS, registry, and IP details.
- No data is sent anywhere else. Your **IPinfo token** is stored locally via Chrome `storage`.

---

## Optional Ideas

- Color-code **Status** and **Expiry** (e.g., green “active”, yellow “<90 days”, red “<30 days / expired”).
- Add `AAAA` & `CNAME` lookups.
- Add a provider like **SecurityTrails** for **nameserver change history** (requires API key).

---

## License

MIT (or your preference).
