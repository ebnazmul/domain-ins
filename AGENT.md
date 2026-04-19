# AGENT.md

Purpose: keep future work fast, consistent, and low-token.

## Working Style

- Be concise.
- Do the work directly instead of explaining obvious steps.
- Ask questions only when blocked or when a choice is risky.
- Prefer short summaries over long explanations.
- Minimize token usage in plans, updates, and final responses.

## Product Priorities

- Speed is more important than adding extra features.
- Keep the extension focused and lightweight.
- Avoid broad feature creep.
- Remove low-value features if they slow down the popup.
- Default to the smallest useful implementation.

## Current Scope

- Main job: show `A` records for the current tab hostname.
- Do not add MX, RDAP, registrar, expiry, reverse DNS, IP enrichment, or other lookups unless explicitly requested.
- Prefer one network request when possible.
- Avoid sequential request chains.
- Avoid storage, background complexity, or extra permissions unless necessary.

## Code Preferences

- Keep files simple and readable.
- Prefer plain JavaScript and minimal DOM work.
- Avoid unnecessary abstractions.
- Avoid duplicate async calls.
- Keep permissions minimal in `manifest.json`.
- When changing scope, also update `README.md`.

## Response Preferences

- Use short direct language.
- No fluff.
- No long changelog-style writeups unless requested.
- For reviews: lead with concrete problems and performance risks.

## Change Rule

Before adding anything, check:

1. Does this make the popup slower?
2. Does this add clear value?
3. Can this be done in a simpler way?

If the answer is weak, do not add it.
