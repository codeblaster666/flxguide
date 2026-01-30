# CLAUDE.md

Project-specific instructions for Claude Code.

## Design Requirements

All UI work must follow the brand guidelines at docs/brand-guidelines.md

Key specs:
- Colors: Cream (#F5F0E8) background, Charcoal (#2D2A26) text, Burnt Orange (#C4673E) accents
- Fonts: Inter for headings, Lora for body text (Google Fonts)
- Compact layout: minimize vertical scrolling, avoid excessive padding
- 4px spacing grid
- Cards: white background, tan border, subtle shadow, 12px 16px padding

## Mobile Requirements

All pages and components must be fully responsive and work well on mobile devices.

Key principles:
- All features must be fully functional on mobile, tablet, and desktop
- Touch-friendly tap targets (minimum 44px)
- No horizontal scrolling on mobile
- Test all features at 375px width (iPhone SE) as minimum
- Collapsible/drawer navigation on mobile
- Maps should be fully functional on touch devices
- Forms must be usable with mobile keyboards
- Images should be responsive and not slow down mobile load times

## Cost Efficiency

Minimize usage of paid APIs and external services to stay within free tiers as long as possible.

Key principles:
- Cache API responses whenever practical (avoid duplicate calls)
- Batch API requests where possible instead of making many individual calls
- Use static data files (JSON) instead of API calls when data doesn't change frequently
- Lazy load data only when needed (don't fetch everything on page load)
- Implement debouncing on search inputs and map interactions
- Store results locally (localStorage, state) to avoid re-fetching
- Be mindful of Mapbox and Google API quotas - log usage during development
- Prefer client-side filtering/sorting over repeated API calls
