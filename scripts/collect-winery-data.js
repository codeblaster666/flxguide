#!/usr/bin/env node

/**
 * Winery Data Collection Script for FLXguide
 *
 * Collects winery data from Google Places API for the Finger Lakes region.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=your_key node scripts/collect-winery-data.js
 *
 * Options:
 *   --resume    Resume from last saved progress
 *   --dry-run   Parse wineries but don't call API
 *   --limit N   Only process first N wineries
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
    apiKey: process.env.GOOGLE_PLACES_API_KEY,
    inputFile: path.join(__dirname, '../docs/research/wineries-database.md'),
    outputFile: path.join(__dirname, '../data/wineries/wineries.json'),
    progressFile: path.join(__dirname, '../data/wineries/.progress.json'),
    reportFile: path.join(__dirname, '../data/wineries/collection-report.md'),

    // Rate limiting: Google Places API allows 100 requests per second,
    // but we'll be conservative to avoid issues
    requestDelayMs: 200,

    // Retry configuration
    maxRetries: 3,
    retryDelayMs: 1000,

    // Search region bias
    searchRegion: 'Finger Lakes NY',
    locationBias: {
        lat: 42.6,
        lng: -76.9,
        radius: 80000 // 80km radius covers the Finger Lakes region
    }
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    resume: args.includes('--resume'),
    dryRun: args.includes('--dry-run'),
    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null
};

/**
 * Parse winery names from the markdown database
 */
function parseWineriesFromMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const wineries = new Set();

    // Pattern 1: Table rows with winery names in first column
    // | Winery Name | Location | Highlights |
    const tableRowPattern = /^\|\s*([^|]+?)\s*\|/gm;

    // Pattern 2: Alphabetical list entries
    const listPattern = /^([A-Z][^|\n]+?)(?:\s*\([^)]+\))?$/gm;

    let match;

    // Extract from table rows
    while ((match = tableRowPattern.exec(content)) !== null) {
        const name = match[1].trim();
        // Skip header rows and empty cells
        if (name &&
            !name.startsWith('---') &&
            !name.toLowerCase().includes('winery') &&
            name !== 'Name' &&
            name !== 'Location' &&
            name !== 'Highlights' &&
            name !== 'Recognition' &&
            name !== 'Founded' &&
            name !== 'Significance' &&
            name !== 'Description' &&
            !name.startsWith('**')) {
            wineries.add(name);
        }
    }

    // Extract from the alphabetical list at the bottom (inside code block)
    const codeBlockMatch = content.match(/```\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
        const lines = codeBlockMatch[1].split('\n');
        for (const line of lines) {
            const name = line.trim();
            if (name && !name.startsWith('#')) {
                // Handle entries with parenthetical notes like "3 Brothers Winery (Three Brothers...)"
                const cleanName = name.replace(/\s*\([^)]+\)\s*$/, '').trim();
                wineries.add(cleanName);
            }
        }
    }

    // Convert to array and sort
    return Array.from(wineries).sort();
}

/**
 * Make an HTTPS request with retry logic
 */
function httpsRequest(url, retries = CONFIG.maxRetries) {
    return new Promise((resolve, reject) => {
        const makeRequest = (attemptsLeft) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
                    }
                });
            }).on('error', (err) => {
                if (attemptsLeft > 0) {
                    console.log(`  Retrying... (${attemptsLeft} attempts left)`);
                    setTimeout(() => makeRequest(attemptsLeft - 1), CONFIG.retryDelayMs);
                } else {
                    reject(err);
                }
            });
        };
        makeRequest(retries);
    });
}

/**
 * Search for a winery using Google Places Text Search
 */
async function searchPlace(wineryName) {
    const query = encodeURIComponent(`${wineryName} winery ${CONFIG.searchRegion}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${CONFIG.locationBias.lat},${CONFIG.locationBias.lng}&radius=${CONFIG.locationBias.radius}&key=${CONFIG.apiKey}`;

    const response = await httpsRequest(url);

    if (response.status === 'REQUEST_DENIED') {
        throw new Error(`API Error: ${response.error_message || 'Request denied'}`);
    }

    return response;
}

/**
 * Get detailed place information
 */
async function getPlaceDetails(placeId) {
    const fields = [
        'name',
        'formatted_address',
        'geometry',
        'formatted_phone_number',
        'website',
        'opening_hours',
        'rating',
        'user_ratings_total',
        'place_id',
        'business_status',
        'url'
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${CONFIG.apiKey}`;

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
        // Search for the winery
        const searchResponse = await searchPlace(wineryName);

        if (!searchResponse.results || searchResponse.results.length === 0) {
            console.log(`  ❌ Not found`);
            return {
                name: wineryName,
                verificationStatus: 'not_found',
                searchQuery: `${wineryName} winery ${CONFIG.searchRegion}`,
                error: 'No results found'
            };
        }

        // Check for multiple matches
        const results = searchResponse.results;
        let verificationStatus = 'found';
        let notes = null;

        if (results.length > 1) {
            // Check if the first result is a good match
            const firstName = results[0].name.toLowerCase();
            const searchName = wineryName.toLowerCase();

            if (!firstName.includes(searchName.split(' ')[0]) &&
                !searchName.includes(firstName.split(' ')[0])) {
                verificationStatus = 'multiple_matches';
                notes = `Found ${results.length} results. First: "${results[0].name}"`;
                console.log(`  ⚠️  Multiple matches (${results.length}), using first: ${results[0].name}`);
            }
        }

        // Get details for the best match
        const placeId = results[0].place_id;

        await sleep(CONFIG.requestDelayMs); // Rate limiting between search and details

        const detailsResponse = await getPlaceDetails(placeId);

        if (!detailsResponse.result) {
            console.log(`  ⚠️  Could not get details`);
            return {
                name: wineryName,
                verificationStatus: 'partial',
                placeId: placeId,
                error: 'Could not retrieve place details'
            };
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
        return {
            name: wineryName,
            verificationStatus: 'error',
            error: error.message
        };
    }
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load progress from file
 */
function loadProgress() {
    try {
        if (fs.existsSync(CONFIG.progressFile)) {
            return JSON.parse(fs.readFileSync(CONFIG.progressFile, 'utf-8'));
        }
    } catch (e) {
        console.log('Could not load progress file, starting fresh');
    }
    return { processed: [], results: [] };
}

/**
 * Save progress to file
 */
function saveProgress(progress) {
    fs.writeFileSync(CONFIG.progressFile, JSON.stringify(progress, null, 2));
}

/**
 * Generate collection report
 */
function generateReport(results, wineries) {
    const found = results.filter(r => r.verificationStatus === 'found');
    const notFound = results.filter(r => r.verificationStatus === 'not_found');
    const multipleMatches = results.filter(r => r.verificationStatus === 'multiple_matches');
    const errors = results.filter(r => r.verificationStatus === 'error');
    const partial = results.filter(r => r.verificationStatus === 'partial');

    let report = `# Winery Data Collection Report

**Generated:** ${new Date().toISOString()}
**Total Wineries in Database:** ${wineries.length}
**Total Processed:** ${results.length}

## Summary

| Status | Count |
|--------|-------|
| ✓ Found | ${found.length} |
| ⚠️ Multiple Matches | ${multipleMatches.length} |
| ⚠️ Partial Data | ${partial.length} |
| ❌ Not Found | ${notFound.length} |
| ❌ Errors | ${errors.length} |

## Success Rate

**${((found.length / results.length) * 100).toFixed(1)}%** of wineries found with high confidence

---

`;

    if (notFound.length > 0) {
        report += `## Wineries Not Found (${notFound.length})

These wineries could not be found via Google Places API. They may need manual verification:

| Winery | Search Query |
|--------|--------------|
`;
        for (const w of notFound) {
            report += `| ${w.name} | ${w.searchQuery || 'N/A'} |\n`;
        }
        report += '\n---\n\n';
    }

    if (multipleMatches.length > 0) {
        report += `## Multiple Matches Found (${multipleMatches.length})

These wineries returned multiple results. The first match was used but should be verified:

| Winery | Notes |
|--------|-------|
`;
        for (const w of multipleMatches) {
            report += `| ${w.originalSearchName || w.name} | ${w.notes || 'Multiple results'} |\n`;
        }
        report += '\n---\n\n';
    }

    if (errors.length > 0) {
        report += `## Errors (${errors.length})

These wineries encountered errors during processing:

| Winery | Error |
|--------|-------|
`;
        for (const w of errors) {
            report += `| ${w.name} | ${w.error} |\n`;
        }
        report += '\n---\n\n';
    }

    // Statistics on data completeness
    const withPhone = results.filter(r => r.phone).length;
    const withWebsite = results.filter(r => r.website).length;
    const withHours = results.filter(r => r.hours).length;
    const withRating = results.filter(r => r.googleRating).length;

    report += `## Data Completeness

| Field | Count | Percentage |
|-------|-------|------------|
| Address | ${results.filter(r => r.address).length} | ${((results.filter(r => r.address).length / results.length) * 100).toFixed(1)}% |
| Coordinates | ${results.filter(r => r.coordinates).length} | ${((results.filter(r => r.coordinates).length / results.length) * 100).toFixed(1)}% |
| Phone | ${withPhone} | ${((withPhone / results.length) * 100).toFixed(1)}% |
| Website | ${withWebsite} | ${((withWebsite / results.length) * 100).toFixed(1)}% |
| Hours | ${withHours} | ${((withHours / results.length) * 100).toFixed(1)}% |
| Rating | ${withRating} | ${((withRating / results.length) * 100).toFixed(1)}% |

---

## Next Steps

1. Manually verify wineries in the "Not Found" and "Multiple Matches" sections
2. Add missing data for wineries with incomplete information
3. Consider re-running for wineries with errors
`;

    return report;
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('FLXguide Winery Data Collection');
    console.log('='.repeat(60));

    // Check for API key
    if (!CONFIG.apiKey && !options.dryRun) {
        console.error('\n❌ Error: GOOGLE_PLACES_API_KEY environment variable is required');
        console.error('\nUsage:');
        console.error('  GOOGLE_PLACES_API_KEY=your_key node scripts/collect-winery-data.js');
        console.error('\nOptions:');
        console.error('  --resume    Resume from last saved progress');
        console.error('  --dry-run   Parse wineries but don\'t call API');
        console.error('  --limit N   Only process first N wineries');
        process.exit(1);
    }

    // Parse wineries from markdown
    console.log(`\nReading wineries from: ${CONFIG.inputFile}`);
    const wineries = parseWineriesFromMarkdown(CONFIG.inputFile);
    console.log(`Found ${wineries.length} wineries in database\n`);

    if (options.dryRun) {
        console.log('DRY RUN - Parsed wineries:');
        console.log('-'.repeat(40));
        wineries.forEach((w, i) => console.log(`${i + 1}. ${w}`));
        console.log('-'.repeat(40));
        console.log(`\nTotal: ${wineries.length} wineries`);
        return;
    }

    // Load or initialize progress
    let progress = options.resume ? loadProgress() : { processed: [], results: [] };

    if (options.resume && progress.processed.length > 0) {
        console.log(`Resuming from previous run. ${progress.processed.length} already processed.`);
    }

    // Determine which wineries to process
    let toProcess = wineries.filter(w => !progress.processed.includes(w));

    if (options.limit) {
        toProcess = toProcess.slice(0, options.limit);
        console.log(`Limited to ${options.limit} wineries`);
    }

    console.log(`Wineries to process: ${toProcess.length}`);
    console.log('-'.repeat(60));

    // Process each winery
    let processed = 0;
    for (const winery of toProcess) {
        processed++;
        console.log(`\n[${processed}/${toProcess.length}]`);

        const result = await processWinery(winery);

        progress.processed.push(winery);
        progress.results.push(result);

        // Save progress after each winery
        saveProgress(progress);

        // Rate limiting
        if (processed < toProcess.length) {
            await sleep(CONFIG.requestDelayMs);
        }
    }

    // Merge with any existing results if resuming
    const allResults = progress.results;

    // Save final results
    console.log('\n' + '='.repeat(60));
    console.log('Saving results...');

    const outputData = {
        metadata: {
            generatedAt: new Date().toISOString(),
            totalWineries: allResults.length,
            source: 'Google Places API',
            region: 'Finger Lakes, NY'
        },
        wineries: allResults.filter(r => r.verificationStatus !== 'not_found' && r.verificationStatus !== 'error')
    };

    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(outputData, null, 2));
    console.log(`✓ Saved ${outputData.wineries.length} wineries to: ${CONFIG.outputFile}`);

    // Generate report
    const report = generateReport(allResults, wineries);
    fs.writeFileSync(CONFIG.reportFile, report);
    console.log(`✓ Saved report to: ${CONFIG.reportFile}`);

    // Clean up progress file on successful completion
    if (fs.existsSync(CONFIG.progressFile)) {
        fs.unlinkSync(CONFIG.progressFile);
    }

    // Print summary
    const found = allResults.filter(r => r.verificationStatus === 'found').length;
    const notFound = allResults.filter(r => r.verificationStatus === 'not_found').length;
    const errors = allResults.filter(r => r.verificationStatus === 'error' || r.verificationStatus === 'multiple_matches').length;

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Found:        ${found}`);
    console.log(`⚠️  Issues:      ${errors}`);
    console.log(`❌ Not Found:   ${notFound}`);
    console.log(`Total:          ${allResults.length}`);
    console.log('='.repeat(60));
}

// Run
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
