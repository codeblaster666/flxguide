# Wine Tour App

## Overview

Interactive wine tour planning application for the Finger Lakes region.

---

## Status

**Current Version**: Placeholder
**Status**: Pending migration from existing codebase

---

## Planned Features

### Core Functionality
- [ ] Interactive map of Finger Lakes wineries
- [ ] Route optimization between selected wineries
- [ ] Winery details (hours, tastings, amenities)
- [ ] Save and share itineraries
- [ ] Mobile-responsive design

### Data
- [ ] Complete winery database
- [ ] Winery hours and seasonal schedules
- [ ] Tasting fees and offerings
- [ ] Amenities (food, tours, events)
- [ ] Contact information

### User Features
- [ ] Create custom tours
- [ ] Optimize routes by distance/time
- [ ] Filter by wine type, amenities, ratings
- [ ] Print/share itineraries
- [ ] Save favorite wineries

---

## Technical Requirements

*To be determined after code review*

### Likely Stack
- Frontend: React or Vue.js
- Maps: Mapbox or Google Maps API
- Routing: OpenRouteService or similar
- Data: JSON or headless CMS

---

## Migration Tasks

1. [ ] Locate existing wine tour app code
2. [ ] Review code quality and architecture
3. [ ] Document current functionality
4. [ ] Identify technical debt
5. [ ] Plan refactoring if needed
6. [ ] Migrate code to this repository
7. [ ] Set up development environment
8. [ ] Test all functionality
9. [ ] Document setup and usage

---

## Winery Data Structure

```json
{
  "id": "string",
  "name": "string",
  "trail": "seneca|cayuga|keuka|canandaigua",
  "address": {
    "street": "string",
    "city": "string",
    "state": "NY",
    "zip": "string"
  },
  "coordinates": {
    "lat": "number",
    "lng": "number"
  },
  "contact": {
    "phone": "string",
    "website": "string",
    "email": "string"
  },
  "hours": {
    "monday": "string",
    "tuesday": "string",
    ...
  },
  "amenities": ["food", "tours", "events", "dog-friendly"],
  "wineTypes": ["dry-red", "dry-white", "sweet", "sparkling"],
  "tastingFee": "number",
  "description": "string"
}
```

---

## Related Documentation

- [Wine Research](../../docs/research/wine.md)
- [Project Roadmap](../../docs/ROADMAP.md)

---

*Last updated: January 2026*
