

// API response caches
export const API_CACHE = new Map();
export const CITY_VALIDITY_CACHE = new Map();

// Import local cities data
import { LOCAL_CITIES } from '../data/cities.js';

// Indian states list for fallback
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const STATE_CODE_MAPPING = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CT",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OR",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  "Tamil Nadu": "TN",
  Telangana: "TG",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttarakhand: "UT",
  "West Bengal": "WB",

  // Union Territories
  "Andaman and Nicobar Islands": "AN",
  Chandigarh: "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DH",
  Delhi: "DL",
  "Jammu and Kashmir": "JK",
  Ladakh: "LA",
  Lakshadweep: "LD",
  Puducherry: "PY",
};

// Reverse mapping for state code to name
export const STATE_NAME_MAPPING = Object.fromEntries(
  Object.entries(STATE_CODE_MAPPING).map(([name, code]) => [code, name])
);




// Helper function for API fetch with abort signal
const fetchWithAbort = async (url, options = {}, abortSignal) => {
  const controller = new AbortController();
  const signal = abortSignal || controller.signal;

  const response = await fetch(url, { ...options, signal });

  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`);
  }

  return response.json();
};

// API endpoints for fetching location data
export const LOCATION_APIS = {
  // States of India - using Rapid API (GeoDB)
  states: async (query, abortSignal) => {
    if (!query) return [];
    const cacheKey = `states-${query}`;
    if (API_CACHE.has(cacheKey)) {
      return API_CACHE.get(cacheKey);
    }
    try {
      const url = `https://wft-geo-db.p.rapidapi.com/v1/geo/countries/IN/states?limit=10&namePrefix=${encodeURIComponent(
        query
      )}`;
      const responseData = await fetchWithAbort(
        url,
        {
          headers: {
            "X-RapidAPI-Key":
              import.meta.env.VITE_RAPID_API_KEY,
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
          },
        },
        abortSignal
      );
      console.log(`📡 States API Response:`, responseData);

      const data = responseData.data || [];
      if (!Array.isArray(data)) {
        console.warn("❌ States API returned non-array data:", data);
        throw new Error("Invalid response structure");
      }

      const states = data.map((state) => state.name).slice(0, 10);
      API_CACHE.set(cacheKey, states);
      return states;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('States API request aborted');
        return [];
      }
      console.error("❌ States API failed:", err.message);
      // Fallback to local states
      const filteredStates = INDIAN_STATES.filter((state) =>
        state.toLowerCase().includes(query.toLowerCase())
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      API_CACHE.set(cacheKey, filteredStates.slice(0, 10));
      return filteredStates.slice(0, 10);
    }
  },

  // Cities - using local cities data from cities.js
  cities: async (query, stateCode = null, abortSignal) => { // eslint-disable-line no-unused-vars
    const cacheKey = `cities-${query}-${stateCode || 'all'}`;
    if (API_CACHE.has(cacheKey)) {
      return API_CACHE.get(cacheKey);
    }

    let cities = [];
    const stateName = stateCode ? STATE_NAME_MAPPING[stateCode] : null;

    if (stateName && LOCAL_CITIES[stateName]) {
      // If state is specified, get cities from that state
      cities = LOCAL_CITIES[stateName];
      if (query && query.length > 0) {
        cities = cities.filter(city =>
          city.toLowerCase().includes(query.toLowerCase())
        );
      }
    } else if (!stateCode) {
      // If no state specified, return cities from all states that match the query
      cities = [];
      for (const stateCities of Object.values(LOCAL_CITIES)) {
        const matchingCities = stateCities.filter(city =>
          !query || city.toLowerCase().includes(query.toLowerCase())
        );
        cities.push(...matchingCities);
      }
      cities = [...new Set(cities)]; // Remove duplicates
    }

    // Sort cities alphabetically for better UX
    cities.sort((a, b) => a.localeCompare(b));

    API_CACHE.set(cacheKey, cities);
    console.log(`📍 Cities fetched from local data for query="${query}", stateCode="${stateCode}": ${cities.length} cities`);
    return cities;
  },
};

// City validity check using local cities data
export const checkCityValidity = async (city, stateName) => {
  if (!city || !stateName) return true;

  const cacheKey = `${city}-${stateName}`;
  if (CITY_VALIDITY_CACHE.has(cacheKey)) {
    return CITY_VALIDITY_CACHE.get(cacheKey);
  }

  let isValid = false;

  // Use local cities data for validation
  if (LOCAL_CITIES[stateName]) {
    isValid = LOCAL_CITIES[stateName].some(localCity =>
      localCity.toLowerCase() === city.toLowerCase()
    );
  }

  CITY_VALIDITY_CACHE.set(cacheKey, isValid);
  console.log(
    `✅ City validation result for "${city}" in "${stateName}": ${isValid}`
  );

  return isValid;
};
