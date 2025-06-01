import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: User;
}

export const auth = {
  register: async (data: RegisterData) => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    console.log("Login response:", response.data); // Debug log
    return response.data;
  },

  logout: async () => {
    const response = await api.get("/auth/logout");
    return response.data;
  },

  getMe: async () => {
    try {
      console.log("Fetching user data..."); // Debug log
      const response = await api.get<AuthResponse>("/auth/me", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      console.log("getMe response:", response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error("getMe error:", error); // Debug log
      if (axios.isAxiosError(error)) {
        console.error("Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      }
      throw error;
    }
  },
};

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default api;
