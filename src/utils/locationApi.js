

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
    if (!query) return INDIAN_STATES;
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

  // Cities - fetch from backend, fallback to local cities data from cities.js
  cities: async (query, stateCode = null, abortSignal) => {
    const cacheKey = `cities-${query}-${stateCode || 'all'}`;
    if (API_CACHE.has(cacheKey)) {
      return API_CACHE.get(cacheKey);
    }

    const stateName = stateCode ? STATE_NAME_MAPPING[stateCode] : null;

    // If no state is selected, we can't get cities.
    if (!stateName) {
      return [];
    }

    let dbCities = [];
    let localCities = [];

    // --- Step 1: Fetch cities from your database ---
    try {
      const url = `${import.meta.env.VITE_BACKEND_URI}/admin/cities?stateName=${encodeURIComponent(stateName)}`;
      const responseData = await fetchWithAbort(url, {}, abortSignal);
      const citiesFromDb = responseData.data || responseData || [];
      
      // The DB returns objects like {name: "BENGALURU"}, so we extract just the name.
      dbCities = citiesFromDb.map(city => city.name); 
      console.log(`📡 Fetched ${dbCities.length} cities from DB for ${stateName}`);

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('DB cities request aborted');
        return []; // Abort the whole process if the request is cancelled
      }
      console.error("❌ Database cities API failed:", err.message);
      // We don't stop here; we can still proceed with local data.
    }

    // --- Step 2: Get cities from your local 'cities.js' file ---
    if (LOCAL_CITIES[stateName]) {
      localCities = LOCAL_CITIES[stateName];
    }

    // --- Step 3: Combine both lists and remove any duplicates ---
    const combinedCities = [...new Set([...dbCities, ...localCities])];

    // --- Step 4: Filter the final list based on the user's search query ---
    let filteredCities = combinedCities;
    if (query && query.length > 0) {
      filteredCities = combinedCities.filter(city =>
        city.toLowerCase().includes(query.toLowerCase())
      );
    }

    // --- Step 5: Sort the list alphabetically ---
    filteredCities.sort((a, b) => a.localeCompare(b));

    API_CACHE.set(cacheKey, filteredCities);
    console.log(`📍 Combined list has ${filteredCities.length} cities for query="${query}", state="${stateName}"`);
    return filteredCities;
  },
};

export const getAllCitiesCombined = async () => {
  let dbCities = [];
  let localCities = [];

  // --- 1. Fetch ALL cities from the database ---
  try {
    // This endpoint should return all cities from your database
    const url = `${import.meta.env.VITE_BACKEND_URI}/cities`;
    const response = await fetch(url);
    if (response.ok) {
      const responseData = await response.json();
      const citiesFromDb = responseData.data || [];
      // Extract just the city name from each object
      dbCities = citiesFromDb.map(c => c.name);
    }
  } catch (err) {
    console.error("❌ Failed to fetch all DB cities for stats:", err.message);
  }

  // --- 2. Get ALL cities from the local file ---
  // We loop through each state in LOCAL_CITIES and collect all city names
  for (const stateCities of Object.values(LOCAL_CITIES)) {
    localCities.push(...stateCities);
  }

  // --- 3. Combine, remove duplicates, and return the complete list ---
  const combinedCities = [...new Set([...dbCities, ...localCities])];
  console.log(`📊 Found a total of ${combinedCities.length} unique cities.`);
  return combinedCities;
};

export const checkCityValidity = async (city, stateName) => {
  // 1. Basic checks and cache lookup (no changes here)
  if (!city || !stateName) return true;

  const cacheKey = `${city}-${stateName}`;
  if (CITY_VALIDITY_CACHE.has(cacheKey)) {
    return CITY_VALIDITY_CACHE.get(cacheKey);
  }

  let dbCities = [];
  let localCities = [];

  // --- 2. Fetch all cities for the state from your database ---
  try {
    const url = `${import.meta.env.VITE_BACKEND_URI}/admin/cities?stateName=${encodeURIComponent(stateName)}`;
    const response = await fetch(url);
    if (response.ok) {
      const responseData = await response.json();
      const citiesFromDb = responseData.data || responseData || [];
      // Your DB returns objects like {name: "BENGALURU"}, so we extract just the names.
      dbCities = citiesFromDb.map(c => c.name);
    }
  } catch (err) {
    console.error("❌ Backend city validation failed, but continuing with local data:", err.message);
  }

  // --- 3. Get all cities for the state from your local file ---
  if (LOCAL_CITIES[stateName]) {
    localCities = LOCAL_CITIES[stateName];
  }

  // --- 4. Combine both lists and remove duplicates ---
  // We convert all to lowercase for a case-insensitive check.
  const combinedCities = new Set([
    ...dbCities.map(c => c.toLowerCase()),
    ...localCities.map(c => c.toLowerCase())
  ]);
  
  // --- 5. Check if the input city exists in the combined list ---
  const isValid = combinedCities.has(city.toLowerCase());

  CITY_VALIDITY_CACHE.set(cacheKey, isValid);
  console.log(
    `✅ Final city validation result for "${city}" in "${stateName}": ${isValid}`
  );

  return isValid;
};
