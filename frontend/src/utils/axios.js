import axios from "axios";

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:5000/api";
axios.defaults.headers.common["Content-Type"] = "application/json";

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "Response Error:",
      error.response?.status,
      error.response?.data || error.message
    );
    
    // Check if it's a connection refused error
    if (error.code === "ECONNREFUSED" || error.message.includes("ERR_CONNECTION_REFUSED")) {
      console.error(
        "⚠️ Backend server is not running!\n" +
        "Please start the backend server:\n" +
        "1. Open a terminal in the 'backend' folder\n" +
        "2. Run: npm run dev\n" +
        "3. Make sure MongoDB is running\n" +
        "4. Check that the server is running on http://localhost:5000"
      );
      error.message = "Backend server is not running. Please start the server on port 5000.";
    }
    
    return Promise.reject(error);
  }
);

export default axios;
