#!/usr/bin/env node

/**
 * Retry Failed Wineries Script
 *
 * Re-runs Google Places API collection for specific wineries that failed
 * and updates the existing wineries.json file.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
    apiKey: process.env.GOOGLE_PLACES_API_KEY,
    dataFile: path.join(__dirname, '../data/wineries/wineries.json'),
    reportFile: path.join(__dirname, '../data/wineries/collection-report.md'),
    costFile: path.join(__dirname, '../data/wineries/api-costs.json'),

    // Longer delay to avoid rate limiting (1 second between requests)
    requestDelayMs: 1000,

    // Search region
    searchRegion: 'Finger Lakes NY',
    locationBias: {
        lat: 42.6,
        lng: -76.9,
        radius: 80000
    },

    // API costs
    costs: {
        textSearch: 32.00,
        placeDetails: 17.00
    }
};

// Wineries to retry
const FAILED_WINERIES = [
    "Arbor Hill Grapery & Winery",
    "Bellwether Wine Cellars",
    "Bright Leaf Vineyard",
    "Chateau Frank",
    "Eagle Crest Vineyards",
    "Earle Estates Meadery",
    "Glenora Wine Cellars",
    "Hector Wine Company",
    "Idol Ridge Winery",
    "Lacey Magruder Winery",
    "Magnus Ridge Winery",
    "McGregor Vineyard",
    "Randolph O'Neill Vineyard",
    "Ryan William Vineyard",
    "Silver Thread Vineyard",
    "Six Mile Creek Vineyard"
];

// API usage tracking
const apiUsage = {
    textSearchCalls: 0,
    placeDetailsCalls: 0,
    getCost: function() {
        const textSearchCost = (this.textSearchCalls / 1000) * CONFIG.costs.textSearch;
        const detailsCost = (this.placeDetailsCalls / 1000) * CONFIG.costs.placeDetails;
        return { textSearch: textSearchCost, placeDetails: detailsCost, total: textSearchCost + detailsCost };
    }
};

/**
 * Make HTTPS request
 */
function httpsRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Search for a winery
 */
async function searchPlace(wineryName) {
    const query = encodeURIComponent(`${wineryName} winery ${CONFIG.searchRegion}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${CONFIG.locationBias.lat},${CONFIG.locationBias.lng}&radius=${CONFIG.locationBias.radius}&key=${CONFIG.apiKey}`;

    apiUsage.textSearchCalls++;
    const response = await httpsRequest(url);

    if (response.status === 'REQUEST_DENIED') {
        throw new Error(`API Error: ${response.error_message || 'Request denied'}`);
    }

    return response;
}

/**
 * Get place details
 */
async function getPlaceDetails(placeId) {
    const fields = [
        'name', 'formatted_address', 'geometry', 'formatted_phone_number',
        'website', 'opening_hours', 'rating', 'user_ratings_total',
        'place_id', 'business_status', 'url'
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${CONFIG.apiKey}`;

    apiUsage.placeDetailsCalls++;
    const response = await httpsRequest(url);

    if (response.status === 'REQUEST_DENIED') {
        throw new Error(`API Error: ${response.error_message || 'Request denied'}`);
    }

    return response;
}

/**
 * Process a single winery
 */
async function processWinery(wineryName) {
    console.log(`Processing: ${wineryName}`);

    try {
        const searchResponse = await searchPlace(wineryName);

        if (!searchResponse.results || searchResponse.results.length === 0) {
            console.log(`  ❌ Not found`);
            return { name: wineryName, verificationStatus: 'not_found' };
        }

        const results = searchResponse.results;
        let verificationStatus = 'found';
        let notes = null;

        if (results.length > 1) {
            const firstName = results[0].name.toLowerCase();
            const searchName = wineryName.toLowerCase();
            if (!firstName.includes(searchName.split(' ')[0]) && !searchName.includes(firstName.split(' ')[0])) {
                verificationStatus = 'multiple_matches';
                notes = `Found ${results.length} results. First: "${results[0].name}"`;
                console.log(`  ⚠️  Multiple matches, using first: ${results[0].name}`);
            }
        }

        // Wait before details request
        await sleep(CONFIG.requestDelayMs);

        const detailsResponse = await getPlaceDetails(results[0].place_id);

        if (!detailsResponse.result) {
            return { name: wineryName, verificationStatus: 'partial', placeId: results[0].place_id };
        }

        const place = detailsResponse.result;
        console.log(`  ✓ Found: ${place.name}`);

        return {
            name: place.name,
            originalSearchName: wineryName,
            address: place.formatted_address || null,
            coordinates: place.geometry ? {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            } : null,
            phone: place.formatted_phone_number || null,
            website: place.website || null,
            hours: place.opening_hours ? place.opening_hours.weekday_text : null,
            googleRating: place.rating || null,
            reviewCount: place.user_ratings_total || null,
            placeId: place.place_id,
            googleMapsUrl: place.url || null,
            businessStatus: place.business_status || null,
            verificationStatus: verificationStatus,
            notes: notes,
            collectedAt: new Date().toISOString()
        };

    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        return { name: wineryName, verificationStatus: 'error', error: error.message };
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('='.repeat(60));
    console.log('Retry Failed Wineries');
    console.log('='.repeat(60));

    if (!CONFIG.apiKey) {
        console.error('\n❌ Error: GOOGLE_PLACES_API_KEY required');
        process.exit(1);
    }

    // Load existing data
    console.log(`\nLoading existing data from: ${CONFIG.dataFile}`);
    const existingData = JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf-8'));
    console.log(`Existing wineries: ${existingData.wineries.length}`);

    console.log(`\nRetrying ${FAILED_WINERIES.length} failed wineries...`);
    console.log(`Using ${CONFIG.requestDelayMs}ms delay between requests`);
    console.log('-'.repeat(60));

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < FAILED_WINERIES.length; i++) {
        const winery = FAILED_WINERIES[i];
        console.log(`\n[${i + 1}/${FAILED_WINERIES.length}]`);

        const result = await processWinery(winery);
        results.push(result);

        if (result.verificationStatus === 'found' || result.verificationStatus === 'multiple_matches') {
            successCount++;

            // Check if this winery already exists (by originalSearchName)
            const existingIndex = existingData.wineries.findIndex(
                w => w.originalSearchName === winery || w.name === winery
            );

            if (existingIndex >= 0) {
                existingData.wineries[existingIndex] = result;
                console.log(`  → Updated existing entry`);
            } else {
                existingData.wineries.push(result);
                console.log(`  → Added new entry`);
            }
        } else {
            failCount++;
        }

        // Wait between wineries
        if (i < FAILED_WINERIES.length - 1) {
            await sleep(CONFIG.requestDelayMs);
        }
    }

    // Update metadata
    existingData.metadata.lastUpdated = new Date().toISOString();
    existingData.metadata.totalWineries = existingData.wineries.length;

    // Save updated data
    console.log('\n' + '='.repeat(60));
    console.log('Saving results...');

    fs.writeFileSync(CONFIG.dataFile, JSON.stringify(existingData, null, 2));
    console.log(`✓ Updated ${CONFIG.dataFile}`);
    console.log(`  Total wineries now: ${existingData.wineries.length}`);

    // Update cost tracking
    let costHistory = [];
    if (fs.existsSync(CONFIG.costFile)) {
        costHistory = JSON.parse(fs.readFileSync(CONFIG.costFile, 'utf-8'));
    }
    costHistory.push({
        timestamp: new Date().toISOString(),
        operation: 'retry-failed',
        apiCalls: { textSearch: apiUsage.textSearchCalls, placeDetails: apiUsage.placeDetailsCalls },
        estimatedCost: apiUsage.getCost()
    });
    fs.writeFileSync(CONFIG.costFile, JSON.stringify(costHistory, null, 2));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Succeeded:    ${successCount}`);
    console.log(`❌ Failed:      ${failCount}`);
    console.log(`\n📊 API Usage:`);
    console.log(`   Text Search: ${apiUsage.textSearchCalls} ($${apiUsage.getCost().textSearch.toFixed(2)})`);
    console.log(`   Place Details: ${apiUsage.placeDetailsCalls} ($${apiUsage.getCost().placeDetails.toFixed(2)})`);
    console.log(`   Total cost: $${apiUsage.getCost().total.toFixed(2)}`);

    if (failCount > 0) {
        console.log('\n❌ Still failing:');
        results.filter(r => r.verificationStatus === 'error' || r.verificationStatus === 'not_found')
            .forEach(r => console.log(`   - ${r.name}: ${r.error || 'not found'}`));
    }

    console.log('='.repeat(60));
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
