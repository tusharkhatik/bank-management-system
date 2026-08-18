import axios from "axios";

const API_BASE_URL =
  "https://silver-waffle-4j65r775v6ggf95-8080.app.github.dev/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
| Always read the latest JWT from localStorage.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (!config.headers) {
      config.headers = {};
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    console.log("========== API REQUEST ==========");
    console.log("METHOD:", config.method?.toUpperCase());
    console.log("URL:", `${config.baseURL}${config.url}`);
    console.log("TOKEN EXISTS:", Boolean(token));
    console.log(
      "AUTH HEADER:",
      config.headers.Authorization
        ? "Bearer token attached"
        : "NOT ATTACHED"
    );
    console.log("=================================");

    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/
api.interceptors.response.use(
  (response) => {
    console.log("========== API RESPONSE ==========");
    console.log("STATUS:", response.status);
    console.log("URL:", response.config?.url);
    console.log("==================================");

    return response;
  },

  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;

    console.error("========== API ERROR ==========");
    console.error("STATUS:", status);
    console.error("URL:", url);
    console.error("DATA:", error?.response?.data);
    console.error("================================");

    /*
     * Only clear authentication for 401.
     *
     * 403 does NOT automatically mean the token is missing.
     * It can also mean insufficient authority.
     */
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }

    return Promise.reject(error);
  }
);

export default api;