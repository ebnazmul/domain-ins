# AGENTS.md

This is the repository source of truth. Keep it updated after meaningful changes.

## Overview
Domain Insight is a Manifest V3 Chrome extension for quick domain inspection from the active browser tab.
It shows hostname, DNS (`A`, `NS`), RDAP, and IP information in a progressively loaded popup. It is static, dependency-free, and easy to load unpacked.

## Architecture
- **Permissions**: Explicit and minimal (Manifest V3).
- **Network**: Live DNS-over-HTTPS (DoH) to Cloudflare/Google with 8-second timeouts. RDAP for status. IPinfo for IP enrichment.
- **State & UI**: Uses `chrome.storage.local` for settings. DOM updates are text-only to prevent injection. Provides click-to-copy UX.
- **Context Menu**: A service worker (`background.js`) registers right-click shortcuts to DNSLT, Whois, intoDNS, DNSChecker, and IPinfo.

## Core Files
- `manifest.json`: Extension config and permissions.
- `background.js`: Context menu registration.
- `popup.html` / `styles.css` / `popup.js`: Extension popup UI and orchestration.
- `src/api.js`: DoH, RDAP, and IPinfo API clients with AbortController timeouts.
- `src/config.js`: API endpoints and constants.
- `src/domain.js`: Hostname parsing, apex detection, and DNS lookups.
- `src/render.js`: Text-safe DOM manipulation and click-to-copy handlers.
- `src/storage.js`: Settings persistence via `chrome.storage.local`.
- `src/tawk-reply.js`: Integrated userscript injected on Tawk.to dashboards.

## Operations
- **Deploy**: Load unpacked via `chrome://extensions`. Reload after file changes.
- **Constraints**: No build step. No Node-only APIs.
- **Principles**: Avoid over-engineering, use safe defaults, and prefer native web APIs.
