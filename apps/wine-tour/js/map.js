/**
 * Leaflet map management
 */

const MapManager = {
    map: null,
    markers: [],
    routeLine: null,

    // Finger Lakes region center coordinates
    FINGER_LAKES_CENTER: [42.55, -76.85],
    DEFAULT_ZOOM: 10,

    /**
     * Initialize the Leaflet map
     */
    initMap(containerId) {
        this.map = L.map(containerId).setView(this.FINGER_LAKES_CENTER, this.DEFAULT_ZOOM);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        return this.map;
    },

    /**
     * Create a labeled marker icon
     */
    createLabeledIcon(number, name, isStart = false) {
        const bgColor = isStart ? '#2d5a27' : '#722f37';
        const label = isStart ? 'S' : number;
        const displayName = name.length > 20 ? name.substring(0, 18) + '...' : name;

        return L.divIcon({
            className: 'labeled-marker-container',
            html: `
                <div class="labeled-marker" style="background: ${bgColor};">
                    <span class="marker-number">${label}</span>
                    <span class="marker-name">${displayName}</span>
                </div>
            `,
            iconSize: [null, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });
    },

    /**
     * Create a grey marker for non-route wineries
     */
    createGreyIcon(name) {
        const displayName = name.length > 18 ? name.substring(0, 16) + '...' : name;

        return L.divIcon({
            className: 'labeled-marker-container',
            html: `
                <div class="labeled-marker grey-marker">
                    <span class="marker-name">${displayName}</span>
                </div>
            `,
            iconSize: [null, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        });
    },

    /**
     * Show all wineries on the map (initial view)
     */
    showAllWineries(wineries) {
        this.clearMap();

        wineries.forEach(winery => {
            const marker = L.marker([winery.lat, winery.lng], {
                icon: this.createGreyIcon(winery.name)
            }).addTo(this.map);

            const ratingStars = winery.rating
                ? '★'.repeat(Math.round(winery.rating)) + '☆'.repeat(5 - Math.round(winery.rating))
                : '';

            marker.bindPopup(`
                <div class="popup-title">${winery.name}</div>
                <div class="popup-address">${winery.address || ''}</div>
                <div class="popup-lake">${winery.lake} Lake Wine Trail</div>
                ${ratingStars ? `<div class="popup-rating">${ratingStars} (${winery.rating})</div>` : ''}
            `);

            this.markers.push(marker);
        });

        // Fit to show all wineries
        if (wineries.length > 0) {
            const bounds = L.latLngBounds(wineries.map(w => [w.lat, w.lng]));
            this.map.fitBounds(bounds, { padding: [30, 30] });
        }
    },

    /**
     * Display route on the map
     */
    displayRoute(start, route, allWineries = []) {
        this.clearMap();

        const routeWineryIds = new Set(route.stops.map(s => s.id));

        // Grey markers for non-route wineries
        allWineries.forEach(winery => {
            if (!routeWineryIds.has(winery.id)) {
                const marker = L.marker([winery.lat, winery.lng], {
                    icon: this.createGreyIcon(winery.name),
                    zIndexOffset: -1000
                }).addTo(this.map);

                const ratingStars = winery.rating
                    ? '★'.repeat(Math.round(winery.rating)) + '☆'.repeat(5 - Math.round(winery.rating))
                    : '';

                marker.bindPopup(`
                    <div class="popup-title">${winery.name}</div>
                    <div class="popup-address">${winery.address || ''}</div>
                    <div class="popup-lake">${winery.lake} Lake Wine Trail</div>
                    ${ratingStars ? `<div class="popup-rating">${ratingStars} (${winery.rating})</div>` : ''}
                    <button class="popup-btn add-btn" onclick="App.addWineryToRoute('${winery.id}')">
                        + Add to Route
                    </button>
                `);

                this.markers.push(marker);
            }
        });

        // Starting point marker
        const startMarker = L.marker([start.lat, start.lng], {
            icon: this.createLabeledIcon(0, 'Start', true),
            zIndexOffset: 1000
        }).addTo(this.map);

        startMarker.bindPopup(`
            <div class="popup-title">Starting Point</div>
            <div class="popup-address">${start.address || 'Your location'}</div>
        `);

        this.markers.push(startMarker);

        // Route coordinates for the line
        const routeCoords = [[start.lat, start.lng]];

        // Route winery markers
        route.stops.forEach((stop, index) => {
            const marker = L.marker([stop.lat, stop.lng], {
                icon: this.createLabeledIcon(index + 1, stop.name),
                zIndexOffset: 1000
            }).addTo(this.map);

            const ratingStars = stop.rating
                ? '★'.repeat(Math.round(stop.rating)) + '☆'.repeat(5 - Math.round(stop.rating))
                : '';

            marker.bindPopup(`
                <div class="popup-title">${stop.name}</div>
                <div class="popup-address">${stop.address || ''}</div>
                <div class="popup-lake">${stop.lake} Lake Wine Trail</div>
                ${ratingStars ? `<div class="popup-rating">${ratingStars} (${stop.rating})</div>` : ''}
                <div class="popup-time">
                    Arrive: ${stop.arrivalTime}<br>
                    Depart: ${stop.departureTime}
                </div>
                <button class="popup-btn remove-btn" onclick="App.removeWineryFromRoute('${stop.id}')">
                    − Remove from Route
                </button>
            `);

            this.markers.push(marker);
            routeCoords.push([stop.lat, stop.lng]);
        });

        // Close the loop back to start
        routeCoords.push([start.lat, start.lng]);

        // Draw route line
        this.routeLine = L.polyline(routeCoords, {
            color: '#722f37',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(this.map);

        // Fit map to route
        this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
    },

    /**
     * Clear all markers and route line
     */
    clearMap() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];

        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }
    },

    /**
     * Center map on a location
     */
    centerOn(lat, lng, zoom = 12) {
        this.map.setView([lat, lng], zoom);
    },

    /**
     * Update route line with actual road geometry from OSRM
     */
    updateRouteGeometry(coordinates) {
        if (!coordinates || coordinates.length === 0) return;

        // Remove existing route line
        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
        }

        // Draw new route with actual road geometry
        this.routeLine = L.polyline(coordinates, {
            color: '#722f37',
            weight: 5,
            opacity: 0.8
        }).addTo(this.map);
    }
};
