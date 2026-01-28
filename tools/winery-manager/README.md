# FLXguide Winery Manager

A simple local React app for viewing and editing the Finger Lakes winery database.

## Quick Start

```bash
# Navigate to the tool directory
cd tools/winery-manager

# Install dependencies (first time only)
npm install

# Start the server
npm start
```

Then open your browser to: **http://localhost:3456**

## Features

### Table View
- Sortable columns (click headers to sort)
- Search by winery name or address
- Filter by verification status
- Color-coded rows by status:
  - **Green**: Found (verified)
  - **Yellow**: Multiple matches (needs review)
  - **Red**: Not found / Error
  - **Blue**: Manually verified
- Data completeness indicator for each winery

### Edit Panel
- Click any row to open the edit panel
- Edit all fields: name, address, coordinates, phone, website, rating, etc.
- Change verification status
- Add personal notes
- Save or cancel changes
- Delete wineries

### Add New Winery
- Click "+ Add Winery" button
- Opens blank edit panel
- Automatically sets status to "manually_verified"

### Summary Stats
- Total winery count
- Count by verification status
- Data completeness overview (websites, phones, hours)

## Data File

The app reads and writes directly to:
```
data/wineries/wineries.json
```

All changes are saved immediately to this file.

## Technical Details

- **Frontend**: React 18 (loaded via CDN, no build step)
- **Backend**: Express.js
- **Port**: 3456

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/wineries | Get all wineries |
| PUT | /api/wineries/:index | Update a winery |
| POST | /api/wineries | Add new winery |
| DELETE | /api/wineries/:index | Delete a winery |

---

*Part of the FLXguide project*
