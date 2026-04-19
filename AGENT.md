# AGENT.md

This file is the repository source of truth. Keep it current after every meaningful code, architecture, documentation, or operations change.

## Project Overview

Domain Insight is a Chrome Manifest V3 extension for quick domain inspection from the active browser tab.

Objectives:

- Show useful hostname, DNS, RDAP, and IP information in a compact popup.
- Render progressively so the popup remains useful even when secondary network calls fail.
- Keep the implementation static, dependency-free, and easy to load as an unpacked extension.
- Preserve safe defaults, minimal permissions, and clear failure states.

Current popup scope:

- Current hostname
- Best-effort registrable or delegated domain
- Domain status
- Expiry with days left and date
- Registrar
- Nameservers
- Hostname `A` records
- IP info for the first `A` record

## Architecture

The extension is intentionally simple: static HTML, CSS, and ES modules. There is no build step, backend, package manager, background script, or content script.

Design decisions:

- Manifest V3 keeps permissions explicit and narrow.
- The popup uses `type="module"` so implementation can be split without a bundler.
- Network work runs progressively instead of blocking the entire popup.
- DNS lookups use live DNS-over-HTTPS resolver queries rather than host.io cached API data.
- IPinfo remains an optional token-backed enrichment integration.
- Cloudflare DNS-over-HTTPS is the primary DNS path, Google DNS-over-HTTPS is the fallback, and RDAP remains the domain-registration path.
- DOM rendering uses `textContent` and `replaceChildren()` rather than HTML string injection.
- Storage access is wrapped behind helpers to support `chrome.storage.sync`, `chrome.storage.local`, and local storage fallback.

Rationale:

- Small focused modules reduce accidental coupling without adding framework complexity.
- Keeping all logic in the popup avoids long-lived extension processes and keeps the permission surface small.
- Defensive fallbacks make the tool usable when optional APIs, tokens, or RDAP responses fail.

## Implementation Details

Runtime files:

- `manifest.json`: extension metadata, popup entry, permissions, host permissions.
- `popup.html`: popup structure and settings form.
- `styles.css`: compact light UI styling.
- `popup.js`: startup orchestration and progressive loading flow.
- `src/config.js`: API endpoint constants and settings key definitions.
- `src/dom.js`: DOM element lookup helpers.
- `src/render.js`: text-safe render helpers, list rendering, errors, and placeholders.
- `src/storage.js`: extension storage and active-tab URL access wrappers.
- `src/api.js`: DNS-over-HTTPS, RDAP, and IPinfo API helpers.
- `src/domain.js`: hostname parsing, `A` record lookup, apex/delegation detection, and NS lookup.

Key patterns:

- Use plain JavaScript modules only.
- Keep API clients focused on fetching and response normalization.
- Keep DOM updates explicit and text-only.
- Prefer graceful degradation over hard failure.
- Avoid adding new permissions unless a feature requires them.
- Update `README.md` when user-facing behavior changes.
- Add future work to `AGENT.TODO.md`; do not hide roadmap items in code comments.

Integrations:

- `https://cloudflare-dns.com/dns-query`: primary DNS-over-HTTPS resolver for `A` and `NS`.
- `https://dns.google/resolve`: secondary DNS-over-HTTPS resolver for `A` and `NS`.
- `https://rdap.org/domain/`: RDAP domain status, expiry, and registrar details.
- `https://ipinfo.io/`: optional IP enrichment for `A[0]`.

Security notes:

- IPinfo token is user-provided and stored in extension storage with local fallback.
- Token use is limited to IPinfo calls.
- The popup never injects API responses as HTML.
- Host permissions are limited to the APIs currently used.
- No remote scripts, eval, background scripts, or content scripts are used.

## Progress Updates

2026-04-19:

- Fixed corrupted visible text by replacing mojibake labels with stable ASCII copy.
- Converted `popup.js` from a monolithic file into focused ES modules under `src/`.
- Added defensive Chrome API access through `globalThis.chrome`.
- Replaced list `innerHTML` clearing with `replaceChildren()`.
- Updated manifest description to match the full domain-inspection scope.
- Allowed vertical popup scrolling so content is not clipped in constrained viewports.
- Established `AGENT.md` as the repository source of truth.
- Added `AGENT.TODO.md` for future improvements and hardening ideas.

2026-04-19 realtime DNS update:

- Removed host.io from DNS resolution to avoid stale API-backed DNS data.
- Added Google DNS-over-HTTPS as a fallback resolver.
- Added no-store DNS fetch options and per-query cache busters to avoid browser-level stale responses.
- Added visible DNS TTL and resolver labels for `A` and `NS` results.
- Added a popup Refresh button to re-run live DNS and domain lookups while the popup is open.
- Updated saved IPinfo tokens immediately in the active popup session so Refresh uses the latest token.
- Removed `https://host.io/*` from host permissions and added `https://dns.google/*`.
- Documented that Node's `dns` module cannot run inside a Chrome extension popup; direct DNS would require a backend or native helper.

Earlier baseline:

- Implemented popup UI for current hostname, domain status, expiry, registrar, nameservers, `A` records, and IP info.
- Added settings token support for optional IPinfo enrichment.
- Added fallback behavior for optional token/API failures.

## Operational Notes

Deployment:

- Load manually through `chrome://extensions` with Developer mode and `Load unpacked`.
- Select the repository folder.
- Reload the extension after file changes.

Constraints:

- No build step exists; code must run directly in Chrome as shipped.
- Keep files browser-compatible and avoid Node-only APIs.
- Network access depends on Chrome host permissions in `manifest.json`.
- The active tab must have a normal URL with a hostname; Chrome internal pages are unsupported.

Known issues:

- Apex/registrable detection is DNS-based and best-effort. It does not use the Public Suffix List, so unusual TLD rules may be imperfect.
- DNS answers are as fresh as the selected recursive resolver allows. Authoritative direct DNS is not possible from the browser popup because Chrome extensions cannot use Node's `dns` module or UDP sockets.
- IP enrichment depends on a valid user token and only runs for the first `A` record.
- There is no automated browser test harness yet.

Change management:

- After every meaningful change, update `AGENT.md`.
- Add new ideas and improvements to `AGENT.TODO.md`.
- Commit the changes.
- Push the commit to GitHub.

Engineering principles:

- Prefer simple, practical solutions.
- Avoid over-engineering.
- Follow modern security best practices.
- Use safe defaults.
- Design for scalability and long-term maintainability.
