# FLXguide Scripts

Utility scripts for data collection and management.

---

## collect-winery-data.js

Collects winery data from Google Places API for the Finger Lakes region.

### Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Places API** enabled: https://console.cloud.google.com/apis/library/places.googleapis.com
3. **API Key** created: https://console.cloud.google.com/apis/credentials

### Setup

1. Get your Google Places API key from Google Cloud Console
2. Set the environment variable:
   ```bash
   export GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

### Usage

```bash
# Basic usage - process all wineries
GOOGLE_PLACES_API_KEY=your_key node scripts/collect-winery-data.js

# Dry run - see what wineries will be processed without calling API
node scripts/collect-winery-data.js --dry-run

# Limit to first 10 wineries (for testing)
GOOGLE_PLACES_API_KEY=your_key node scripts/collect-winery-data.js --limit 10

# Resume from previous run if interrupted
GOOGLE_PLACES_API_KEY=your_key node scripts/collect-winery-data.js --resume
```

### Output Files

| File | Description |
|------|-------------|
| `data/wineries/wineries.json` | Complete winery data in JSON format |
| `data/wineries/collection-report.md` | Report with statistics and issues |
| `data/wineries/.progress.json` | Temporary file for resume capability (deleted on completion) |

### Output Schema

```json
{
  "metadata": {
    "generatedAt": "2026-01-28T...",
    "totalWineries": 140,
    "source": "Google Places API",
    "region": "Finger Lakes, NY"
  },
  "wineries": [
    {
      "name": "Dr. Konstantin Frank Winery",
      "originalSearchName": "Dr. Konstantin Frank Winery",
      "address": "9749 Middle Rd, Hammondsport, NY 14840, USA",
      "coordinates": {
        "lat": 42.473426,
        "lng": -77.1840462
      },
      "phone": "(607) 868-4884",
      "website": "https://www.drfrankwines.com/",
      "hours": [
        "Monday: 10:00 AM – 5:00 PM",
        "Tuesday: 10:00 AM – 5:00 PM",
        ...
      ],
      "googleRating": 4.7,
      "reviewCount": 892,
      "placeId": "ChIJXYjYlsL_0IkRPIGyX1awZbQ",
      "googleMapsUrl": "https://maps.google.com/?cid=...",
      "businessStatus": "OPERATIONAL",
      "verificationStatus": "found",
      "collectedAt": "2026-01-28T..."
    }
  ]
}
```

### Verification Status

| Status | Meaning |
|--------|---------|
| `found` | Winery found with high confidence |
| `multiple_matches` | Multiple results returned, first match used |
| `partial` | Found but couldn't get full details |
| `not_found` | No matching results |
| `error` | API error occurred |

### API Costs

Google Places API pricing (as of 2024):
- **Text Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests

For ~140 wineries: ~$7-10 total (well within the $200/month free tier)

### Troubleshooting

**"REQUEST_DENIED" error:**
- Check that your API key is correct
- Verify Places API is enabled in Google Cloud Console
- Check that billing is set up on your Google Cloud account

**Rate limiting errors:**
- The script includes built-in delays (200ms between requests)
- If you still get rate limited, increase `requestDelayMs` in the config

**Missing wineries:**
- Check the collection report for "Not Found" entries
- Some wineries may have different names in Google Maps
- Manually search and add missing data to the JSON

---

*Last updated: January 2026*
