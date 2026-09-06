import axios from "axios";

const TOKEN_KEY =
  "aurumdesk_auth_token";

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Attach JWT to every request
|--------------------------------------------------------------------------
*/

apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        TOKEN_KEY
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| Handle expired / invalid sessions
|--------------------------------------------------------------------------
*/

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status;

    const url =
      error.config?.url || "";

    if (
      status === 401 &&
      !url.includes("/auth/login")
    ) {
      localStorage.removeItem(
        TOKEN_KEY
      );

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.assign(
          "/login"
        );
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;