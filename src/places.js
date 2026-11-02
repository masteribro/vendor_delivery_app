const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

// Google Places API requires a proxy in the browser (CORS blocked).
// We use the jsonp-style approach via the Places Autocomplete Service loaded from Google's JS SDK.

let autocompleteService = null;
let placesService = null;
let geocoder = null;
let scriptLoaded = false;

function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (scriptLoaded) return resolve();
    if (document.getElementById('google-maps-script')) {
      // Script tag exists, wait for it
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          scriptLoaded = true;
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function getServices() {
  if (!autocompleteService) {
    autocompleteService = new google.maps.places.AutocompleteService();
  }
  if (!placesService) {
    // needs a div, but we never show it
    placesService = new google.maps.places.PlacesService(document.createElement('div'));
  }
  if (!geocoder) {
    geocoder = new google.maps.Geocoder();
  }
  return { autocompleteService, placesService, geocoder };
}

export async function searchPlaces(query) {
  if (!query || query.trim().length < 3) return [];
  await loadGoogleMapsScript();
  const { autocompleteService } = getServices();

  return new Promise((resolve) => {
    autocompleteService.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'ng' },
        types: ['geocode', 'establishment'],
      },
      (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(
          predictions.map((p) => ({
            placeId: p.place_id,
            description: p.description,
          }))
        );
      }
    );
  });
}

export async function getPlaceDetails(placeId) {
  await loadGoogleMapsScript();
  const { placesService } = getServices();

  return new Promise((resolve) => {
    placesService.getDetails(
      {
        placeId,
        fields: ['formatted_address', 'geometry'],
      },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          resolve(null);
          return;
        }
        resolve({
          address: place.formatted_address,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        });
      }
    );
  });
}
