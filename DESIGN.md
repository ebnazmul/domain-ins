# DESIGN.md

Purpose: keep the popup consistent and readable.

## Design Direction

- light UI
- compact layout
- fast to scan
- minimal but not plain
- colorful in a controlled way
- readability first

## Palette

- sand: `#DEDAC7`
- violet: `#746AE1`
- blue: `#279EE1`
- mint: `#45E097`
- purple: `#6A31E1`
- sky: `#90BDE0`

## Color Usage

- primary actions: blue
- secondary accent: violet
- strong heading accent: purple
- positive state: mint
- borders and cool UI lines: sky
- soft background tint: sand

Do not use all accent colors equally in the same view.

## Typography

- preferred heading stack: `Inter Display`, `Inter`, sans-serif
- preferred body stack: `Inter`, sans-serif
- use monospace only for technical values like DNS and ASN
- keep labels readable, not tiny
- do not use low-contrast muted text for important values

## Layout Rules

- use small cards or panels
- keep spacing tight but not crowded
- important values should appear near the top
- technical lists should be chips or compact rows
- settings should stay in a small top-right menu

## Accessibility Rules

- text must stay readable on all backgrounds
- contrast matters more than decoration
- avoid overly transparent surfaces
- avoid gradients behind dense text blocks
- focus states must stay visible

## Visual Boundaries

- rounded corners are fine
- subtle shadows are fine
- avoid heavy glassmorphism
- avoid noisy gradients
- avoid too many emojis in text-heavy rows

## Current UI Intent

The popup should feel like a small utility card:

- quick to open
- quick to read
- slightly colorful
- technically clean
- not playful at the cost of clarity
