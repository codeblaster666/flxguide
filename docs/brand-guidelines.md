# FLXguide Brand Guidelines

**Version:** 1.0 Draft  
**Purpose:** Design source of truth for all FLXguide apps, pages, and materials

---

## Brand Overview

**What FLXguide is:** A comprehensive guide to the Finger Lakes region of New York - wineries, restaurants, activities, and local experiences.

**Who it's for:** Primarily visitors and locals seeking activities; secondarily business owners who may advertise with us.

**Brand personality:** Modern and clean in structure, with warmth and regional character conveyed through color and typography. Sophisticated but approachable - not stuffy or pretentious.

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Cream** | `#F5F0E8` | Primary background |
| **Warm White** | `#FDFCFA` | Cards, panels, secondary background |
| **Charcoal** | `#2D2A26` | Primary text |

### Secondary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Tan** | `#D4C4B0` | Borders, dividers, subtle accents |
| **Warm Gray** | `#8C837A` | Secondary text, captions, muted elements |
| **Clay** | `#A69080` | Tertiary elements, hover states |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Burnt Orange** | `#C4673E` | Primary accent - buttons, links, highlights |
| **Rust** | `#A3522A` | Accent hover states, emphasis |
| **Deep Wine** | `#722F37` | Special emphasis, premium features |

### Status Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success Green** | `#5C7C5C` | Success messages, verified status |
| **Warning Amber** | `#C9A227` | Warnings, needs attention |
| **Error Red** | `#A63D3D` | Errors, critical issues |

---

## Typography

### Font Families

**Headings:** Inter  
- Google Fonts: https://fonts.google.com/specimen/Inter
- Weights: 500 (Medium), 700 (Bold)
- Clean, modern, highly readable sans-serif

**Body Text:** Lora  
- Google Fonts: https://fonts.google.com/specimen/Lora
- Weights: 400 (Regular), 600 (Semibold)
- Warm, elegant serif with personality

**Monospace (data, code):** JetBrains Mono  
- Google Fonts: https://fonts.google.com/specimen/JetBrains+Mono
- Weight: 400
- For data tables, coordinates, technical info

### Type Scale

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| H1 | Inter | 36px | Bold (700) | Charcoal |
| H2 | Inter | 28px | Bold (700) | Charcoal |
| H3 | Inter | 22px | Medium (500) | Charcoal |
| H4 | Inter | 18px | Medium (500) | Charcoal |
| Body | Lora | 16px | Regular (400) | Charcoal |
| Body Small | Lora | 14px | Regular (400) | Warm Gray |
| Caption | Inter | 12px | Medium (500) | Warm Gray |
| Button | Inter | 14px | Medium (500) | — |

### Line Heights

- Headings: 1.2
- Body text: 1.6
- Captions/UI: 1.4

---

## Spacing System

Use consistent spacing based on a 4px grid. Favor compact layouts that minimize scrolling.

| Name | Size | Usage |
|------|------|-------|
| xs | 4px | Tight gaps, inline elements |
| sm | 8px | Related elements, icon gaps |
| md | 12px | Standard padding inside cards/components |
| lg | 16px | Gaps between components |
| xl | 24px | Section spacing |
| 2xl | 32px | Major section breaks |
| 3xl | 48px | Page-level separation (use sparingly) |

---

## Components

### Buttons

**Primary Button**
- Background: Burnt Orange (`#C4673E`)
- Text: Warm White (`#FDFCFA`)
- Padding: 12px 24px
- Border radius: 6px
- Hover: Rust (`#A3522A`)

**Secondary Button**
- Background: Transparent
- Border: 1px solid Tan (`#D4C4B0`)
- Text: Charcoal (`#2D2A26`)
- Padding: 12px 24px
- Border radius: 6px
- Hover: Background Cream (`#F5F0E8`)

**Text Button/Link**
- Text: Burnt Orange (`#C4673E`)
- Underline on hover
- No background

### Cards

- Background: Warm White (`#FDFCFA`)
- Border: 1px solid Tan (`#D4C4B0`)
- Border radius: 8px
- Padding: 12px 16px (compact)
- Shadow: `0 2px 8px rgba(45, 42, 38, 0.08)`

### Form Inputs

- Background: Warm White (`#FDFCFA`)
- Border: 1px solid Tan (`#D4C4B0`)
- Border radius: 6px
- Padding: 12px 16px
- Focus border: Burnt Orange (`#C4673E`)
- Placeholder text: Warm Gray (`#8C837A`)

### Tables

- Header background: Cream (`#F5F0E8`)
- Header text: Charcoal, DM Sans Medium
- Row border: 1px solid Tan (`#D4C4B0`)
- Alternating row background: Warm White / Cream
- Hover row: Slight tan tint

### Status Badges

- Border radius: 4px
- Padding: 4px 8px
- Font: DM Sans, 12px, Medium

| Status | Background | Text |
|--------|------------|------|
| Success/Verified | `#5C7C5C` at 15% opacity | Success Green |
| Warning/Review | `#C9A227` at 15% opacity | Warning Amber |
| Error | `#A63D3D` at 15% opacity | Error Red |

---

## Layout Principles

1. **Clean grid structure** - Use consistent column grids (12-column for desktop)

2. **Compact but not cramped** - Minimize vertical scrolling; avoid excessive padding and whitespace while keeping content readable

3. **Information density** - Favor showing more content per screen over large empty areas

4. **Clear hierarchy** - One primary action per view, clear visual flow

5. **Mobile-first** - Design for mobile, enhance for desktop

6. **Consistent alignment** - Left-align text, maintain vertical rhythm

---

## Imagery Guidelines

- **Photography style:** Natural, warm lighting; authentic Finger Lakes scenery
- **Avoid:** Overly staged stock photos, harsh lighting, generic imagery
- **Subjects:** Vineyards, lakes, local businesses, seasonal landscapes
- **Treatment:** Subtle warm color grading to match brand palette

---

## Voice & Tone

- **Helpful** - We're a guide, not a brochure
- **Knowledgeable** - Confident but not condescending
- **Warm** - Friendly and welcoming, like a local giving recommendations
- **Concise** - Respect people's time; get to the point

---

## Usage Notes for Development

When building any FLXguide app or page, include this in your prompt to Claude Code:

```
Design requirements:
- Follow FLXguide brand guidelines (see docs/brand-guidelines.md)
- Colors: Cream (#F5F0E8) background, Charcoal (#2D2A26) text, Burnt Orange (#C4673E) accents
- Fonts: Inter for headings, Lora for body text (both from Google Fonts)
- Compact layout: minimize vertical scrolling, avoid excessive padding
- Use 4px spacing grid
- Cards: white background, tan border, subtle shadow, 12px 16px padding
- Buttons: Burnt Orange with white text (primary), outlined tan (secondary)
```

---

## File Locations

This document should live at: `docs/brand-guidelines.md`

Related assets:
- Color palette export: `assets/brand/colors.css`
- Font imports: `assets/brand/fonts.css`
- Logo files: `assets/brand/logo/`
