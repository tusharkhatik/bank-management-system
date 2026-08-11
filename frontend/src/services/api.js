import axios from "axios";

const api = axios.create({
  baseURL:
    "https://silver-waffle-4j65r775v6ggf95-8080.app.github.dev/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;