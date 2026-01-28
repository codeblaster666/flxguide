# FLXguide.com - Main Site

## Overview

This directory will contain the source code for the main FLXguide.com website.

---

## Status

**Current Version**: Placeholder
**Status**: Pending technical decisions and MVP development

---

## Planned Structure

```
site/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page templates
│   ├── layouts/        # Page layouts
│   ├── styles/         # CSS/SCSS files
│   ├── utils/          # Utility functions
│   └── content/        # Content files (if using static site gen)
├── public/
│   ├── images/         # Static images
│   └── assets/         # Other static assets
├── tests/              # Test files
└── config/             # Configuration files
```

---

## Technical Decisions Needed

### Framework Options
| Option | Pros | Cons |
|--------|------|------|
| Next.js | React ecosystem, SSG+SSR, great SEO | Complexity |
| Astro | Fast, content-focused, flexible | Newer ecosystem |
| 11ty | Simple, fast builds | Less dynamic capability |
| WordPress | Easy content management | Performance, security |

### Hosting Options
| Option | Pros | Cons |
|--------|------|------|
| Vercel | Easy deploys, great DX, edge network | Cost at scale |
| Netlify | Similar to Vercel, good free tier | Cost at scale |
| AWS (S3+CloudFront) | Cost effective, scalable | More setup |
| Traditional hosting | Familiar | Less modern |

### CMS Options
| Option | Pros | Cons |
|--------|------|------|
| Markdown files | Simple, version controlled | Not for non-devs |
| Sanity | Flexible, real-time | Learning curve |
| Contentful | Mature, well-documented | Cost |
| Strapi | Self-hosted, free | Maintenance |

---

## Site Architecture (Planned)

### Main Navigation
- Home
- Wine
  - Wineries
  - Wine Trails
  - Wine Tour App
  - Events
- Outdoors
  - Fishing
  - Hunting
  - Camping
  - State Parks
- Food & Drink
  - Restaurants
  - Breweries
  - Farm Markets
- Plan Your Trip
  - Itineraries
  - Tools
  - Events Calendar

### URL Structure
```
/                           # Homepage
/wine/                      # Wine landing
/wine/wineries/             # Winery directory
/wine/wineries/[slug]/      # Individual winery
/wine/trails/seneca-lake/   # Wine trail pages
/fishing/                   # Fishing landing
/fishing/[lake-name]/       # Lake-specific guides
/hunting/                   # Hunting landing
/camping/                   # Camping landing
/restaurants/               # Restaurant directory
/state-parks/               # Parks landing
/state-parks/[park-name]/   # Individual park guides
/tools/wine-tour/           # Wine tour app
/tools/fishing-finder/      # Fishing tool
/about/                     # About page
/contact/                   # Contact page
```

---

## Development Setup

*To be documented after technical stack is chosen*

### Prerequisites
- Node.js (version TBD)
- Package manager (npm/yarn/pnpm)

### Getting Started
```bash
# Clone the repository
git clone [repo-url]

# Navigate to site directory
cd flxguide/site

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Design System

### Brand Colors
*To be defined*

### Typography
*To be defined*

### Components
*To be defined*

---

## Related Documentation

- [Project Roadmap](../docs/ROADMAP.md)
- [Content Calendar](../docs/CONTENT-CALENDAR.md)
- [All Research Docs](../docs/research/)

---

*Last updated: January 2026*
