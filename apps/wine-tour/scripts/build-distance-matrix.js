/**
 * Pre-compute driving distances between all wineries using OSRM
 * Run with: node scripts/build-distance-matrix.js
 */

const fs = require('fs');
const path = require('path');

const OSRM_API = 'https://router.project-osrm.org';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getDistanceMatrix(points) {
    const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_API}/table/v1/driving/${coords}?annotations=distance,duration`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
        throw new Error(`OSRM error: ${data.code}`);
    }

    return {
        distances: data.distances, // meters
        durations: data.durations  // seconds
    };
}

async function main() {
    console.log('Loading wineries...');

    const wineriesPath = path.join(__dirname, '..', 'data', 'wineries.json');
    const wineriesData = JSON.parse(fs.readFileSync(wineriesPath, 'utf8'));
    const wineries = wineriesData.wineries;

    console.log(`Found ${wineries.length} wineries`);

    // OSRM table API has limits, so we'll process in chunks if needed
    // For 40 wineries, we should be fine in one call

    const points = wineries.map(w => ({ lat: w.lat, lng: w.lng, id: w.id }));

    console.log('Fetching distance matrix from OSRM...');
    console.log('This may take a moment...');

    try {
        const matrix = await getDistanceMatrix(points);

        // Convert to a more usable format with winery IDs
        const distanceMatrix = {};
        const durationMatrix = {};

        for (let i = 0; i < wineries.length; i++) {
            const fromId = wineries[i].id;
            distanceMatrix[fromId] = {};
            durationMatrix[fromId] = {};

            for (let j = 0; j < wineries.length; j++) {
                const toId = wineries[j].id;
                // Convert meters to miles, seconds to minutes
                distanceMatrix[fromId][toId] = Math.round(matrix.distances[i][j] / 1609.34 * 10) / 10;
                durationMatrix[fromId][toId] = Math.round(matrix.durations[i][j] / 60 * 10) / 10;
            }
        }

        const output = {
            metadata: {
                generatedAt: new Date().toISOString(),
                wineryCount: wineries.length,
                units: {
                    distance: 'miles',
                    duration: 'minutes'
                }
            },
            wineryIds: wineries.map(w => w.id),
            distances: distanceMatrix,
            durations: durationMatrix
        };

        const outputPath = path.join(__dirname, '..', 'data', 'distance-matrix.json');
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

        console.log(`\nSuccess! Distance matrix saved to: ${outputPath}`);
        console.log(`Matrix size: ${wineries.length} x ${wineries.length} = ${wineries.length * wineries.length} pairs`);

        // Print some sample distances
        console.log('\nSample distances:');
        for (let i = 0; i < Math.min(3, wineries.length); i++) {
            for (let j = i + 1; j < Math.min(i + 3, wineries.length); j++) {
                const from = wineries[i];
                const to = wineries[j];
                console.log(`  ${from.name} → ${to.name}: ${distanceMatrix[from.id][to.id]} mi, ${durationMatrix[from.id][to.id]} min`);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
