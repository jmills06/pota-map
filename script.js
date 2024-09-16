// Initialize the map and set its view
var map = L.map('map', {
    center: [37.8, -96], // Center of the US
    zoom: 4,
    zoomControl: false,
    attributionControl: false
});

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

// Adjust map bounds to fit the US
var usBounds = [
    [24.396308, -124.848974], // Southwest coordinates
    [49.384358, -66.885444]   // Northeast coordinates
];
map.fitBounds(usBounds);

// Global variables
var parksData = {};
var markersLayer = L.layerGroup().addTo(map);
var refreshInterval = 60000; // 1 minute

// Function to load park data
function loadParkData() {
    fetch('https://potaparksk8jku.s3.amazonaws.com/national_parks_us.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(park => {
                parksData[park.reference] = {
                    name: park.name,
                    latitude: parseFloat(park.latitude),
                    longitude: parseFloat(park.longitude),
                    locationDesc: park.locationDesc
                };
            });
            // After loading park data, load spot data
            loadSpotData();
            // Start the refresh cycle
            setInterval(loadSpotData, refreshInterval);
        })
        .catch(error => console.error('Error loading park data:', error));
}

// Function to load spot data
function loadSpotData() {
    fetch('https://api.pota.app/spot/')
        .then(response => response.json())
        .then(spots => {
            updateMarkers(spots);
        })
        .catch(error => {
            console.error('Error loading spot data:', error);
            // Retain existing markers on error
        });
}

// Function to update markers
function updateMarkers(spots) {
    var newMarkersLayer = L.layerGroup();

    spots.forEach(spot => {
        var reference = spot.reference;
        var park = parksData[reference];

        if (park && park.latitude && park.longitude) {
            var marker = L.circleMarker([park.latitude, park.longitude], {
                radius: 10,
                fillColor: "#FF0000",
                color: "#FFFFFF",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });

            var popupContent = `
                <strong>${park.name}</strong><br>
                Activator: ${spot.activator}<br>
                Frequency: ${spot.frequency} kHz<br>
                Mode: ${spot.mode}<br>
                Time: ${new Date(spot.spotTime).toLocaleTimeString()}<br>
                Comments: ${spot.comments || 'N/A'}
            `;

            marker.bindPopup(popupContent);

            newMarkersLayer.addLayer(marker);
        }
    });

    // Replace the old markers layer with the new one
    map.removeLayer(markersLayer);
    markersLayer = newMarkersLayer;
    map.addLayer(markersLayer);
}

// Initial data load
loadParkData();
