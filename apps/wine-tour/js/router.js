/**
 * Route optimization using pre-computed distance matrix - instant results!
 */

const Router = {
    // Pre-computed data (loaded on init)
    wineries: [],
    distances: null,
    durations: null,

    // OSRM API for route geometry only
    OSRM_API: 'https://router.project-osrm.org',

    // Time spent at each winery (minutes)
    VISIT_DURATION_MINUTES: 45,

    // Optimization settings
    MAX_CANDIDATES: 10,
    MAX_COMBINATIONS: 30,

    /**
     * Load pre-computed data
     */
    async loadData() {
        try {
            const [wineriesRes, matrixRes] = await Promise.all([
                fetch('data/wineries.json'),
                fetch('data/distance-matrix.json')
            ]);

            const wineriesData = await wineriesRes.json();
            const matrixData = await matrixRes.json();

            this.wineries = wineriesData.wineries;
            this.distances = matrixData.distances;
            this.durations = matrixData.durations;

            console.log(`Loaded ${this.wineries.length} wineries with pre-computed distances`);
            return true;
        } catch (error) {
            console.error('Failed to load data:', error);
            return false;
        }
    },

    /**
     * Get all wineries
     */
    getAllWineries() {
        return this.wineries;
    },

    /**
     * Calculate straight-line distance (for filtering by max distance from start)
     */
    haversineDistance(p1, p2) {
        const R = 3959;
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLng = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(p1.lat * Math.PI / 180) *
            Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    /**
     * Get driving duration between two wineries (from pre-computed matrix)
     */
    getDuration(fromId, toId) {
        return this.durations[fromId]?.[toId] ?? Infinity;
    },

    /**
     * Get driving distance between two wineries (from pre-computed matrix)
     */
    getDistance(fromId, toId) {
        return this.distances[fromId]?.[toId] ?? Infinity;
    },

    /**
     * Generate combinations of k items from array
     */
    getCombinations(array, k) {
        const results = [];
        function combine(start, combo) {
            if (combo.length === k) {
                results.push([...combo]);
                return;
            }
            for (let i = start; i < array.length; i++) {
                combo.push(array[i]);
                combine(i + 1, combo);
                combo.pop();
            }
        }
        combine(0, []);
        return results;
    },

    /**
     * Solve TSP for a set of wineries using nearest neighbor (fast approximation)
     */
    solveTSP(startPoint, wineries) {
        if (wineries.length === 0) return { order: [], totalDuration: 0 };
        if (wineries.length === 1) {
            const w = wineries[0];
            const toWinery = this.estimateDurationFromPoint(startPoint, w);
            const back = this.estimateDurationFromPoint(w, startPoint);
            return { order: [w], totalDuration: toWinery + back };
        }

        // Try all permutations for small sets (optimal solution)
        if (wineries.length <= 6) {
            return this.solveOptimalTSP(startPoint, wineries);
        }

        // Nearest neighbor for larger sets
        return this.solveNearestNeighborTSP(startPoint, wineries);
    },

    /**
     * Optimal TSP solution (brute force - only for small sets)
     */
    solveOptimalTSP(startPoint, wineries) {
        const permutations = this.getPermutations(wineries);
        let bestOrder = null;
        let bestDuration = Infinity;

        for (const perm of permutations) {
            let duration = this.estimateDurationFromPoint(startPoint, perm[0]);

            for (let i = 0; i < perm.length - 1; i++) {
                duration += this.getDuration(perm[i].id, perm[i + 1].id);
            }

            duration += this.estimateDurationFromPoint(perm[perm.length - 1], startPoint);

            if (duration < bestDuration) {
                bestDuration = duration;
                bestOrder = perm;
            }
        }

        return { order: bestOrder, totalDuration: bestDuration };
    },

    /**
     * Nearest neighbor TSP approximation
     */
    solveNearestNeighborTSP(startPoint, wineries) {
        const unvisited = [...wineries];
        const order = [];
        let current = startPoint;
        let totalDuration = 0;

        while (unvisited.length > 0) {
            let nearestIdx = 0;
            let nearestDuration = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const dur = current.id
                    ? this.getDuration(current.id, unvisited[i].id)
                    : this.estimateDurationFromPoint(current, unvisited[i]);

                if (dur < nearestDuration) {
                    nearestDuration = dur;
                    nearestIdx = i;
                }
            }

            totalDuration += nearestDuration;
            current = unvisited[nearestIdx];
            order.push(current);
            unvisited.splice(nearestIdx, 1);
        }

        // Return to start
        totalDuration += this.estimateDurationFromPoint(current, startPoint);

        return { order, totalDuration };
    },

    /**
     * Generate all permutations
     */
    getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            for (const perm of this.getPermutations(rest)) {
                result.push([arr[i], ...perm]);
            }
        }
        return result;
    },

    /**
     * Estimate duration from an arbitrary point to a winery (uses haversine approximation)
     */
    estimateDurationFromPoint(from, to) {
        const dist = this.haversineDistance(from, { lat: to.lat, lng: to.lng });
        // Estimate ~2 min per mile (30 mph average)
        return dist * 2;
    },

    /**
     * Calculate total route duration for a combination
     */
    calculateRouteDuration(startPoint, wineries) {
        const tsp = this.solveTSP(startPoint, wineries);
        return tsp.totalDuration;
    },

    /**
     * Format minutes as time string
     */
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    },

    /**
     * Add minutes to a time string
     */
    addMinutesToTime(timeStr, minutes) {
        const [hours, mins] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins, 0, 0);
        date.setMinutes(date.getMinutes() + Math.round(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    /**
     * Find optimal route - INSTANT with pre-computed data!
     */
    optimizeRoute(start, count, maxDistanceMiles, startTime) {
        // Filter wineries within max distance
        const inRange = this.wineries.filter(w => {
            return this.haversineDistance(start, { lat: w.lat, lng: w.lng }) <= maxDistanceMiles;
        });

        if (inRange.length === 0) {
            return { stops: [], totalDistance: 0, totalDuration: 0, drivingTime: 0 };
        }

        const targetCount = Math.min(count, inRange.length);

        // Sort by distance from start
        const sorted = inRange
            .map(w => ({
                winery: w,
                dist: this.haversineDistance(start, { lat: w.lat, lng: w.lng })
            }))
            .sort((a, b) => a.dist - b.dist);

        const candidates = sorted.slice(0, this.MAX_CANDIDATES).map(w => w.winery);

        // If we have exactly what we need, just optimize order
        if (candidates.length <= targetCount) {
            return this.buildRoute(start, candidates, startTime);
        }

        // Generate combinations and find best
        let combinations = this.getCombinations(candidates, targetCount);

        if (combinations.length > this.MAX_COMBINATIONS) {
            // Sample: always include closest, then sample rest
            const sampled = [combinations[0]];
            const step = Math.floor(combinations.length / this.MAX_COMBINATIONS);
            for (let i = step; i < combinations.length && sampled.length < this.MAX_COMBINATIONS; i += step) {
                sampled.push(combinations[i]);
            }
            combinations = sampled;
        }

        // Find best combination
        let bestCombo = null;
        let bestDuration = Infinity;

        for (const combo of combinations) {
            const duration = this.calculateRouteDuration(start, combo);
            if (duration < bestDuration) {
                bestDuration = duration;
                bestCombo = combo;
            }
        }

        return this.buildRoute(start, bestCombo, startTime);
    },

    /**
     * Build the final route object with timing
     */
    buildRoute(start, wineries, startTime) {
        const tsp = this.solveTSP(start, wineries);
        const orderedWineries = tsp.order;

        const stops = [];
        let elapsedMinutes = 0;
        let totalDistance = 0;
        let current = start;

        for (let i = 0; i < orderedWineries.length; i++) {
            const winery = orderedWineries[i];

            // Calculate travel from previous
            const travelTime = current.id
                ? this.getDuration(current.id, winery.id)
                : this.estimateDurationFromPoint(current, winery);

            const travelDist = current.id
                ? this.getDistance(current.id, winery.id)
                : this.haversineDistance(current, { lat: winery.lat, lng: winery.lng });

            elapsedMinutes += travelTime;
            totalDistance += travelDist;

            stops.push({
                ...winery,
                stopNumber: i + 1,
                distanceFromPrevious: travelDist,
                travelTimeFromPrevious: travelTime,
                arrivalTime: this.addMinutesToTime(startTime, elapsedMinutes),
                departureTime: this.addMinutesToTime(startTime, elapsedMinutes + this.VISIT_DURATION_MINUTES),
                visitDuration: this.VISIT_DURATION_MINUTES
            });

            elapsedMinutes += this.VISIT_DURATION_MINUTES;
            current = winery;
        }

        // Return trip
        const returnTime = this.estimateDurationFromPoint(current, start);
        const returnDist = this.haversineDistance(current, start);
        totalDistance += returnDist;

        return {
            stops,
            totalDistance,
            totalDuration: elapsedMinutes + returnTime,
            drivingTime: tsp.totalDuration,
            returnDistance: returnDist,
            returnTime,
            endTime: this.addMinutesToTime(startTime, elapsedMinutes + returnTime)
        };
    },

    /**
     * Optimize a specific set of wineries (for add/remove)
     */
    optimizeSelectedWineries(start, selectedWineries, startTime) {
        if (selectedWineries.length === 0) {
            return { stops: [], totalDistance: 0, totalDuration: 0, drivingTime: 0 };
        }
        return this.buildRoute(start, selectedWineries, startTime);
    },

    /**
     * Fetch actual road geometry from OSRM for display (one API call)
     * @param {Object} start - Starting point
     * @param {Array} stops - Ordered array of stops
     * @returns {Promise<Array>} Array of [lat, lng] coordinates for the route
     */
    async fetchRouteGeometry(start, stops) {
        if (stops.length === 0) return [];

        // Build coordinates: start -> all stops -> back to start
        const coords = [
            `${start.lng},${start.lat}`,
            ...stops.map(s => `${s.lng},${s.lat}`),
            `${start.lng},${start.lat}`
        ].join(';');

        const url = `${this.OSRM_API}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // Convert from [lng, lat] to [lat, lng] for Leaflet
                return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
        } catch (error) {
            console.error('Failed to fetch route geometry:', error);
        }

        return null;
    }
};
