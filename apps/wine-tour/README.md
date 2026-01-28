# Finger Lakes Wine Tour Planner

An interactive web application for planning optimized wine tour routes through the Finger Lakes region of New York.

---

## Features

### Route Planning
- **Smart Route Optimization**: Generates efficient routes visiting multiple wineries using pre-computed distance matrices for instant results
- **Customizable Parameters**:
  - Set your starting location (with Google Places autocomplete)
  - Choose number of wineries to visit (1-8)
  - Set maximum travel distance
  - Specify tour start time

### Interactive Map
- **Leaflet-powered map** displaying all 40 wineries across Seneca, Cayuga, and Keuka lakes
- Visual route display with numbered stops
- Click wineries to add/remove from your route
- Real-time road geometry fetched from OSRM

### Itinerary Generation
- Detailed stop-by-stop itinerary with:
  - Arrival and departure times
  - Travel time between stops
  - Winery ratings
- Summary showing total distance, driving time, and visit time

### Export Options
- **Open in Apple Maps**: One-click export to Apple Maps with full route
- **Open in Google Maps**: One-click export to Google Maps with all waypoints

---

## Winery Database

The app includes 40 verified wineries:
- **Seneca Lake**: 18 wineries
- **Cayuga Lake**: 12 wineries
- **Keuka Lake**: 10 wineries

Each winery includes:
- Name and address
- GPS coordinates (verified)
- Google rating
- Lake association

---

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Geocoding**: Google Places API (for starting location)
- **Routing**: OSRM (Open Source Routing Machine) for road geometry
- **Data**: Pre-computed distance matrix for instant optimization

---

## File Structure

```
wine-tour/
├── index.html              # Main application page
├── css/
│   └── styles.css          # Application styles
├── js/
│   ├── app.js              # Main application logic
│   ├── map.js              # Map management (Leaflet)
│   └── router.js           # Route optimization algorithms
├── data/
│   ├── wineries.json       # Winery database (40 wineries)
│   └── distance-matrix.json # Pre-computed distances
├── scripts/
│   ├── build-distance-matrix.js  # Generate distance matrix
│   └── verify-coordinates.js     # Validate winery coordinates
└── README.md
```

---

## Setup

### Prerequisites
- A Google Maps API key with Places API enabled
- A web server (or use a local dev server)

### Configuration
1. Replace the Google API key in `index.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initApp" async defer></script>
   ```

### Running Locally
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Then open http://localhost:8000
```

---

## Data Management

### Updating Wineries
Edit `data/wineries.json` to add, remove, or modify wineries.

### Rebuilding Distance Matrix
After modifying wineries, regenerate the distance matrix:
```bash
node scripts/build-distance-matrix.js
```

### Verifying Coordinates
To validate winery coordinates:
```bash
node scripts/verify-coordinates.js
```

---

## Future Enhancements

- [ ] Filter wineries by wine type (dry reds, sweet whites, etc.)
- [ ] Filter by amenities (food, tours, dog-friendly)
- [ ] Add winery hours and check for conflicts
- [ ] Save favorite wineries
- [ ] Share routes via URL
- [ ] Print-friendly itinerary view
- [ ] Integration with main FLXguide.com site

---

## Related Documentation

- [Wine Research](../../docs/research/wine.md)
- [Project Roadmap](../../docs/ROADMAP.md)

---

*Last updated: January 2026*
