/**
 * Verify and fix winery coordinates using Google Places API
 * Run with: GOOGLE_API_KEY=your_key node scripts/verify-coordinates.js
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error('Please set GOOGLE_API_KEY environment variable');
    console.error('Usage: GOOGLE_API_KEY=your_key node scripts/verify-coordinates.js');
    process.exit(1);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchPlace(query) {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        return {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            address: place.formatted_address,
            name: place.name,
            rating: place.rating || null,
            placeId: place.place_id
        };
    }
    return null;
}

async function main() {
    console.log('Loading wineries...');

    const wineriesPath = path.join(__dirname, '..', 'data', 'wineries.json');
    const wineriesData = JSON.parse(fs.readFileSync(wineriesPath, 'utf8'));
    const wineries = wineriesData.wineries;

    console.log(`Verifying ${wineries.length} wineries...\n`);

    const updated = [];
    let fixed = 0;

    for (let i = 0; i < wineries.length; i++) {
        const winery = wineries[i];
        const query = `${winery.name} winery Finger Lakes NY`;

        console.log(`[${i + 1}/${wineries.length}] Searching: ${winery.name}`);

        try {
            const result = await searchPlace(query);

            if (result) {
                const latDiff = Math.abs(result.lat - winery.lat);
                const lngDiff = Math.abs(result.lng - winery.lng);

                if (latDiff > 0.01 || lngDiff > 0.01) {
                    console.log(`  ✓ FIXED: (${winery.lat}, ${winery.lng}) → (${result.lat}, ${result.lng})`);
                    fixed++;
                } else {
                    console.log(`  ✓ Verified`);
                }

                updated.push({
                    ...winery,
                    lat: result.lat,
                    lng: result.lng,
                    address: result.address,
                    rating: result.rating || winery.rating,
                    placeId: result.placeId
                });
            } else {
                console.log(`  ⚠ Not found, keeping original`);
                updated.push(winery);
            }
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
            updated.push(winery);
        }

        // Rate limiting - Google allows 10 QPS for Places API
        await sleep(150);
    }

    // Save updated data
    const outputData = {
        ...wineriesData,
        wineries: updated,
        metadata: {
            ...wineriesData.metadata,
            lastUpdated: new Date().toISOString().split('T')[0],
            coordinatesVerified: true
        }
    };

    fs.writeFileSync(wineriesPath, JSON.stringify(outputData, null, 2));

    console.log(`\n✓ Done! Fixed ${fixed} coordinates.`);
    console.log(`\nNow run: node scripts/build-distance-matrix.js`);
}

main().catch(console.error);
