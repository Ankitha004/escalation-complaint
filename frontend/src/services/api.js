import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
  timeout: 10000,
});

// Interceptor to attach token to requests
API.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch (e) {}
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor for caching GET requests locally and serving cached data if offline
API.interceptors.response.use(
  (response) => {
    // Save successful GET response in local offline cache
    if (response.config.method === 'get' && response.data) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userKey = user?.employeeId || user?._id || user?.email || 'anon';
        const cacheKey = `api_cache_${userKey}_${response.config.url}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }
    return response;
  },
  (error) => {
    // If request failed (e.g. network error, 503 db connecting, offline) and it's a GET request, check local cache
    if (error.config && error.config.method === 'get') {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userKey = user?.employeeId || user?._id || user?.email || 'anon';
        const cacheKey = `api_cache_${userKey}_${error.config.url}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          console.warn(`[Offline Cache] Serving cached data for ${error.config.url}`);
          return Promise.resolve({
            data: parsed.data,
            status: 200,
            statusText: 'OK (From Local Cache)',
            headers: {},
            config: error.config,
            isFromLocalCache: true
          });
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);


export default API;

