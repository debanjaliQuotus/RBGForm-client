// Location API utilities for fetching states and cities
// Includes caching, retries, and fallbacks to local data

import { LOCAL_CITIES } from "../data/cities";

// API response caches
export const API_CACHE = new Map();
export const CITY_VALIDITY_CACHE = new Map();

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

// State to state code mapping for API calls
export const STATE_CODE_MAPPING = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CG",
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
  "Andaman and Nicobar Islands": "AN",
  Chandigarh: "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DH",
  Delhi: "DL",
  "Jammu and Kashmir": "JK",
  Ladakh: "LA",
  Lakshadweep: "LD",
  Puducherry: "PY",
};

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
              "13101479d5msh200aeefac521f12p1d43a3jsnbdda36d0645e",
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

  // Cities - using GeoDB Rapid API with local fallback (no backend API)
  cities: async (query, stateCode = null, abortSignal) => {
    if (!query) {
      // Return all cities for the state when no query (for select dropdown) - use local data
      const stateName = Object.keys(STATE_CODE_MAPPING).find(
        (state) => STATE_CODE_MAPPING[state] === stateCode
      );
      if (stateName && LOCAL_CITIES[stateName]) {
        console.log(
          `🏙️ All cities for ${stateName} (local):`,
          LOCAL_CITIES[stateName]
        );
        return LOCAL_CITIES[stateName];
      }
      return [];
    }

    const cacheKey = `cities-${query}-${stateCode || 'all'}`;
    if (API_CACHE.has(cacheKey)) {
      return API_CACHE.get(cacheKey);
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use GeoDB Rapid API for searching cities
        let url = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=IN&namePrefix=${encodeURIComponent(
          query
        )}&limit=10`;

        // Add state filter if state is selected
        if (stateCode) {
          url += `&stateCode=${stateCode}`;
          console.log(
            `🔍 Cities API: Filtering by stateCode=${stateCode}, URL: ${url}`
          );
        } else {
          console.log(`🔍 Cities API: No state filter, URL: ${url}`);
        }

        const responseData = await fetchWithAbort(
          url,
          {
            headers: {
              "X-RapidAPI-Key":
                "8acb9381a3mshea3bfd0bb433a6dp197841jsn1a5356656ec7",
              "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
            },
          },
          abortSignal
        );

        const data = responseData.data || [];
        if (!Array.isArray(data)) {
          console.warn("❌ GeoDB Cities API returned non-array data:", data);
          return [];
        }

        const cities = data
          .map((city) => city.name || "Unknown City")
          .filter(Boolean);
        API_CACHE.set(cacheKey, cities);
        return cities;
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Cities API request aborted');
          return [];
        }
        console.error(
          `❌ Cities API attempt ${attempt + 1} failed:`,
          err.message
        );
        if (attempt === maxRetries - 1) {
          // Fallback to local cities if all retries fail and we have local data
          const stateName = Object.keys(LOCAL_CITIES).find(
            (state) => STATE_CODE_MAPPING[state] === stateCode
          );

          if (stateName && LOCAL_CITIES[stateName]) {
            console.log(
              `🔄 API failed after retries, falling back to local cities for ${stateName}`
            );
            const localCities = LOCAL_CITIES[stateName].filter((city) =>
              city.toLowerCase().includes(query.toLowerCase())
            );
            API_CACHE.set(cacheKey, localCities.slice(0, 10));
            return localCities.slice(0, 10);
          }

          return [];
        }
      }
    }
  },
};

// City validity check with caching and local fallback
export const checkCityValidity = async (city, stateName, abortSignal) => {
  if (!city || !stateName) return true;

  const cacheKey = `${city}-${stateName}`;
  if (CITY_VALIDITY_CACHE.has(cacheKey)) {
    return CITY_VALIDITY_CACHE.get(cacheKey);
  }

  const stateCode = STATE_CODE_MAPPING[stateName];
  try {
    console.log(
      `🔍 Validating city "${city}" for state "${stateName}" (code: ${stateCode})`
    );
    // Check local data first for faster validation
    if (LOCAL_CITIES[stateName]) {
      const isValid = LOCAL_CITIES[stateName].some(
        (c) => c.toLowerCase() === city.toLowerCase()
      );
      if (isValid) {
        CITY_VALIDITY_CACHE.set(cacheKey, true);
        return true;
      }
    }
    // Fallback to API search
    const matchingCities = await LOCATION_APIS.cities(city, stateCode, abortSignal);
    console.log(`📡 Matching cities found:`, matchingCities);

    const isValid = matchingCities.some(
      (c) => c.toLowerCase() === city.toLowerCase()
    );
    CITY_VALIDITY_CACHE.set(cacheKey, isValid);
    console.log(
      `✅ City validation result for "${city}" in "${stateName}": ${isValid}`
    );
    return isValid;
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log('City validation request aborted');
      return false;
    }
    console.error("City validation failed:", e);

    // Fallback to local cities list
    if (LOCAL_CITIES[stateName]) {
      const isValid = LOCAL_CITIES[stateName].some(
        (c) => c.toLowerCase() === city.toLowerCase()
      );
      CITY_VALIDITY_CACHE.set(cacheKey, isValid);
      return isValid;
    }

    CITY_VALIDITY_CACHE.set(cacheKey, false);
    // Strict: If we can’t verify, reject it
    return false;
  }
};
