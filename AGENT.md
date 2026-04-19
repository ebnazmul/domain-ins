# AGENT.md

Purpose: keep work on this extension focused, fast, and maintainable.

## Project Scope

This extension is for quick domain inspection from the current browser tab.

Current popup scope:

- current domain
- registrable domain
- domain status
- expiry with days left and date
- registrar
- nameservers
- hostname `A` records
- IP info for `A[0]`

## Priorities

1. Speed
2. Clear UI
3. Useful domain data
4. Minimal complexity

Do not add features that make the popup slower unless they add clear value.

## Working Rules

- Prefer progressive rendering over waiting for everything.
- Do not block the popup just to finish secondary lookups.
- Keep network calls limited and intentional.
- Prefer fallback behavior over hard failure.
- If an API fails, keep the rest of the popup usable.

## Code Rules

- Keep the code in plain JavaScript.
- Avoid unnecessary abstraction.
- Reuse helpers when it reduces duplication.
- Keep DOM updates simple and explicit.
- Keep `manifest.json` permissions as small as possible for the current feature set.
- When behavior changes, update `README.md`.

## API Rules

- Cloudflare DoH is the default DNS fallback.
- `host.io` is optional and should not break the popup if unavailable.
- `ipinfo.io` is optional and should only enrich `A[0]`.
- RDAP failures should degrade gracefully.

## UI Rules

- Keep the popup compact.
- Keep the important values easy to scan.
- Avoid visual clutter.
- Avoid adding decorative UI that hurts readability.

## Do Not

- Do not turn the popup into a dashboard.
- Do not add background scripts or extra architecture unless necessary.
- Do not add new record types or extra services unless explicitly requested.
- Do not sacrifice readability for color or effects.
