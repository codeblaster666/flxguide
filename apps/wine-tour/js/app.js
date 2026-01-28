/**
 * Main application logic - using pre-computed local data for instant results
 */

const App = {
    // DOM Elements
    elements: {
        form: null,
        startLocation: null,
        wineryCount: null,
        wineryCountDisplay: null,
        maxDistance: null,
        startTime: null,
        generateBtn: null,
        itinerary: null,
        itineraryList: null,
        tourSummary: null,
        errorMessage: null,
        loading: null
    },

    // Current state
    state: {
        startPlace: null,
        allWineries: [],
        selectedWineryIds: new Set(),
        currentRoute: null,
        startTime: '10:00',
        maxDistance: 30,
        dataLoaded: false
    },

    /**
     * Initialize the application
     */
    async init() {
        // Cache DOM elements
        this.elements.form = document.getElementById('tour-form');
        this.elements.startLocation = document.getElementById('start-location');
        this.elements.wineryCount = document.getElementById('winery-count');
        this.elements.wineryCountDisplay = document.getElementById('winery-count-display');
        this.elements.maxDistance = document.getElementById('max-distance');
        this.elements.startTime = document.getElementById('start-time');
        this.elements.generateBtn = document.getElementById('generate-btn');
        this.elements.itinerary = document.getElementById('itinerary');
        this.elements.itineraryList = document.getElementById('itinerary-list');
        this.elements.tourSummary = document.getElementById('tour-summary');
        this.elements.errorMessage = document.getElementById('error-message');
        this.elements.loading = document.getElementById('loading');

        // Initialize map
        MapManager.initMap('map');

        // Load pre-computed data
        this.showLoading('Loading winery data...');
        const dataLoaded = await Router.loadData();

        if (!dataLoaded) {
            this.showError('Failed to load winery data. Please refresh the page.');
            this.hideLoading();
            return;
        }

        this.state.allWineries = Router.getAllWineries();
        this.state.dataLoaded = true;
        this.hideLoading();

        // Initialize Places autocomplete for starting location
        if (typeof google !== 'undefined' && google.maps) {
            this.initPlacesAutocomplete();
        }

        // Set up event listeners
        this.setupEventListeners();

        // Show all wineries on map initially
        MapManager.showAllWineries(this.state.allWineries);
    },

    /**
     * Initialize Google Places autocomplete for starting location
     */
    initPlacesAutocomplete() {
        const fingerLakesBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(42.2, -77.5),
            new google.maps.LatLng(43.0, -76.3)
        );

        const autocomplete = new google.maps.places.Autocomplete(
            this.elements.startLocation,
            {
                bounds: fingerLakesBounds,
                componentRestrictions: { country: 'us' },
                fields: ['formatted_address', 'geometry', 'name']
            }
        );

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.geometry.location) {
                this.showError('Please select a location from the dropdown');
                return;
            }

            this.state.startPlace = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address,
                name: place.name
            };

            this.hideError();
            MapManager.centerOn(this.state.startPlace.lat, this.state.startPlace.lng, 11);
        });
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.elements.wineryCount.addEventListener('input', (e) => {
            this.elements.wineryCountDisplay.textContent = e.target.value;
        });

        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateRoute();
        });
    },

    /**
     * Generate the wine tour route - INSTANT with local data!
     */
    async generateRoute() {
        if (!this.state.startPlace) {
            this.showError('Please select a starting location from the dropdown');
            return;
        }

        const wineryCount = parseInt(this.elements.wineryCount.value);
        const maxDistance = parseInt(this.elements.maxDistance.value);
        const startTime = this.elements.startTime.value;

        this.state.startTime = startTime;
        this.state.maxDistance = maxDistance;
        this.hideError();

        // Instant optimization with pre-computed data!
        const route = Router.optimizeRoute(
            this.state.startPlace,
            wineryCount,
            maxDistance,
            startTime
        );

        if (route.stops.length === 0) {
            this.showError(
                `No wineries found within ${maxDistance} miles. Try increasing the distance.`
            );
            return;
        }

        // Track selected wineries
        this.state.selectedWineryIds = new Set(route.stops.map(s => s.id));
        this.state.currentRoute = route;

        // Display results immediately with straight lines
        MapManager.displayRoute(this.state.startPlace, route, this.state.allWineries);
        this.displayItinerary(this.state.startPlace, route, startTime);

        // Then fetch and display actual road geometry
        this.fetchAndDisplayRoadGeometry(route);
    },

    /**
     * Fetch road geometry from OSRM and update the map
     */
    async fetchAndDisplayRoadGeometry(route) {
        const geometry = await Router.fetchRouteGeometry(this.state.startPlace, route.stops);
        if (geometry) {
            MapManager.updateRouteGeometry(geometry);
        }
    },

    /**
     * Add a winery to the route
     */
    async addWineryToRoute(wineryId) {
        if (this.state.selectedWineryIds.has(wineryId)) return;

        this.state.selectedWineryIds.add(wineryId);

        const selectedWineries = this.state.allWineries.filter(
            w => this.state.selectedWineryIds.has(w.id)
        );

        const route = Router.optimizeSelectedWineries(
            this.state.startPlace,
            selectedWineries,
            this.state.startTime
        );

        this.state.currentRoute = route;
        MapManager.displayRoute(this.state.startPlace, route, this.state.allWineries);
        this.displayItinerary(this.state.startPlace, route, this.state.startTime);

        // Fetch road geometry
        this.fetchAndDisplayRoadGeometry(route);
    },

    /**
     * Remove a winery from the route
     */
    async removeWineryFromRoute(wineryId) {
        if (!this.state.selectedWineryIds.has(wineryId)) return;

        if (this.state.selectedWineryIds.size <= 1) {
            this.showError('Cannot remove the last winery from the route.');
            return;
        }

        this.state.selectedWineryIds.delete(wineryId);

        const selectedWineries = this.state.allWineries.filter(
            w => this.state.selectedWineryIds.has(w.id)
        );

        const route = Router.optimizeSelectedWineries(
            this.state.startPlace,
            selectedWineries,
            this.state.startTime
        );

        this.state.currentRoute = route;
        MapManager.displayRoute(this.state.startPlace, route, this.state.allWineries);
        this.displayItinerary(this.state.startPlace, route, this.state.startTime);

        // Fetch road geometry
        this.fetchAndDisplayRoadGeometry(route);
    },

    /**
     * Display the itinerary in the sidebar
     */
    displayItinerary(start, route, startTime) {
        let html = '';

        html += `
            <div class="itinerary-item">
                <div class="stop-number start">S</div>
                <div class="stop-details">
                    <div class="stop-name">Starting Point</div>
                    <div class="stop-address">${start.address}</div>
                    <div class="stop-time">Depart: ${Router.addMinutesToTime(startTime, 0)}</div>
                </div>
            </div>
        `;

        route.stops.forEach((stop, index) => {
            const ratingDisplay = stop.rating
                ? `<span class="stop-rating">${'★'.repeat(Math.round(stop.rating))} ${stop.rating.toFixed(1)}</span>`
                : '';

            html += `
                <div class="itinerary-item">
                    <div class="stop-number">${index + 1}</div>
                    <div class="stop-details">
                        <div class="stop-name">${stop.name}</div>
                        <div class="stop-address">${stop.address || ''}</div>
                        ${ratingDisplay}
                        <div class="stop-time">
                            ${Router.formatDuration(stop.travelTimeFromPrevious)} drive •
                            Arrive ${stop.arrivalTime} •
                            Depart ${stop.departureTime}
                        </div>
                        <button class="remove-btn" onclick="App.removeWineryFromRoute('${stop.id}')">
                            Remove from Route
                        </button>
                    </div>
                </div>
            `;
        });

        this.elements.itineraryList.innerHTML = html;

        const visitTime = route.stops.length * Router.VISIT_DURATION_MINUTES;
        this.elements.tourSummary.innerHTML = `
            <p><strong>Total Wineries:</strong> ${route.stops.length}</p>
            <p><strong>Total Distance:</strong> ${route.totalDistance.toFixed(1)} miles</p>
            <p><strong>Driving Time:</strong> ${Router.formatDuration(route.drivingTime)}</p>
            <p><strong>Visit Time:</strong> ${Router.formatDuration(visitTime)}</p>
            <p><strong>Return by:</strong> ${route.endTime}</p>
            <div class="export-buttons">
                <button class="export-btn apple-maps" onclick="App.openInAppleMaps()">
                    Open in Apple Maps
                </button>
                <button class="export-btn google-maps" onclick="App.openInGoogleMaps()">
                    Open in Google Maps
                </button>
            </div>
        `;

        this.elements.itinerary.classList.remove('hidden');
    },

    /**
     * Open route in Google Maps
     */
    openInGoogleMaps() {
        if (!this.state.currentRoute || this.state.currentRoute.stops.length === 0) return;

        const start = this.state.startPlace;
        const stops = this.state.currentRoute.stops;

        // Google Maps URL format:
        // https://www.google.com/maps/dir/?api=1&origin=LAT,LNG&destination=LAT,LNG&waypoints=LAT,LNG|LAT,LNG&travelmode=driving
        const origin = `${start.lat},${start.lng}`;
        const destination = origin; // Return to start

        // All wineries as waypoints
        const waypoints = stops.map(s => `${s.lat},${s.lng}`).join('|');

        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;

        window.open(url, '_blank');
    },

    /**
     * Open route in Apple Maps
     */
    openInAppleMaps() {
        if (!this.state.currentRoute || this.state.currentRoute.stops.length === 0) return;

        const start = this.state.startPlace;
        const stops = this.state.currentRoute.stops;

        // Apple Maps URL format with multiple stops:
        // https://maps.apple.com/?saddr=LAT,LNG&daddr=LAT,LNG+to:LAT,LNG+to:LAT,LNG&dirflg=d
        const saddr = `${start.lat},${start.lng}`;

        // Build destination string with +to: between stops, ending back at start
        const daddr = [...stops.map(s => `${s.lat},${s.lng}`), saddr].join('+to:');

        const url = `https://maps.apple.com/?saddr=${saddr}&daddr=${daddr}&dirflg=d`;

        window.open(url, '_blank');
    },

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
    },

    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    },

    showLoading(message = 'Loading...') {
        document.querySelector('#loading p').textContent = message;
        this.elements.loading.classList.remove('hidden');
        this.elements.generateBtn.disabled = true;
    },

    hideLoading() {
        this.elements.loading.classList.add('hidden');
        this.elements.generateBtn.disabled = false;
    },

    hideItinerary() {
        this.elements.itinerary.classList.add('hidden');
    }
};

/**
 * Global init function called by Google Maps API callback
 */
function initApp() {
    App.init();
}

// If Google Maps isn't loading, still initialize with local data
document.addEventListener('DOMContentLoaded', () => {
    // Give Google Maps a moment to load, then init anyway
    setTimeout(() => {
        if (!App.state.dataLoaded) {
            App.init();
        }
    }, 1000);
});
