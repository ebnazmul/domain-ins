# DESIGN.md

Purpose: keep the extension visually consistent.

## Design Direction

- Clean, light, compact UI.
- Fast to scan.
- Low visual noise.
- Use color for emphasis, not decoration.
- Prefer clarity over novelty.

## Palette

- `--color-sand: #DEDAC7`
- `--color-violet: #746AE1`
- `--color-blue: #279EE1`
- `--color-mint: #45E097`
- `--color-purple: #6A31E1`
- `--color-sky: #90BDE0`

## Usage Rules

- Primary action or highlight: `#279EE1`
- Secondary accent: `#746AE1`
- Success or positive state: `#45E097`
- Supporting accent or stronger emphasis: `#6A31E1`
- Soft surfaces or subtle backgrounds: `#DEDAC7`
- Cool muted panels or borders: `#90BDE0`

## UI Rules

- Use a light background.
- Keep cards and panels simple.
- Use rounded corners consistently.
- Keep spacing tight and even.
- Avoid crowded layouts.
- Avoid too many accent colors in the same view.

## Typography

- Use a clean sans-serif stack.
- Headings should be clear and slightly bold.
- Body text should stay compact and readable.
- Monospace is allowed for DNS values, IPs, and technical data only.

## Component Rules

- Status and key info should appear near the top.
- Lists of technical values should use pills or compact rows.
- Errors should be visible but not oversized.
- Empty states should be short and neutral.

## CSS Guidance

Prefer CSS variables with these names:

- `--bg`
- `--surface`
- `--text`
- `--muted`
- `--border`
- `--primary`
- `--secondary`
- `--success`
- `--accent-strong`

Suggested mapping:

- `--bg: #ffffff`
- `--surface: #DEDAC7`
- `--text: #1f2430`
- `--muted: #5f6b7a`
- `--border: #90BDE0`
- `--primary: #279EE1`
- `--secondary: #746AE1`
- `--success: #45E097`
- `--accent-strong: #6A31E1`

## Do Not

- Do not mix unrelated color themes.
- Do not add dark mode unless requested.
- Do not use heavy gradients by default.
- Do not make the popup feel like a dashboard.
