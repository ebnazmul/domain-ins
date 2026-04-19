# AGENT.TODO.md

Future improvements and hardening ideas. Keep this list practical and update it when new work is discovered.

## Stability

- Add a lightweight browser smoke-test checklist or Playwright-based extension test when the project gains a test runner.
- Add timeout handling for third-party API calls so slow endpoints cannot leave sections loading indefinitely.
- Consider caching recent lookups in extension storage with short TTLs to reduce repeated network calls.

## Domain Accuracy

- Evaluate a small Public Suffix List strategy for more accurate registrable domain detection.
- Show when the detected domain is delegated rather than strictly registrable.

## Security

- Consider separating host.io and IPinfo tokens if users commonly use different credentials.
- Review whether IPinfo token can use an authorization header instead of query parameters without breaking the API.
- Add clear user-facing copy explaining where the token is stored and which services receive it.

## UX

- Add a non-intrusive loading state per section.
- Add copy-to-clipboard controls for domain, IP, nameserver, and ASN values.
- Add a compact warning when the popup is opened on unsupported URLs.
