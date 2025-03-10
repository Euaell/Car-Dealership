import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

// Define base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    // Get token from localStorage (in browser context only)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data;

          // Update token in localStorage
          localStorage.setItem("accessToken", accessToken);

          // Update the Authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token is invalid, redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");

          // Redirect to login page
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  signup: async (userData: any) => {
    const response = await api.post("/auth/signup", userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Car API calls
export const carAPI = {
  getCars: async (params: any = {}) => {
    const response = await api.get("/cars", { params });
    return response.data;
  },

  getCarById: async (id: number) => {
    const response = await api.get(`/cars/${id}`);
    return response.data;
  },

  createCar: async (carData: any) => {
    const response = await api.post("/cars", carData);
    return response.data;
  },

  updateCar: async (id: number, carData: any) => {
    const response = await api.put(`/cars/${id}`, carData);
    return response.data;
  },

  deleteCar: async (id: number) => {
    const response = await api.delete(`/cars/${id}`);
    return response.data;
  },

  getFeaturedCars: async () => {
    const response = await api.get("/cars/featured");
    return response.data;
  },

  searchCars: async (searchParams: any) => {
    const response = await api.post("/cars/search", searchParams);
    return response.data;
  },

  getCarStats: async () => {
    const response = await api.get("/cars/stats");
    return response.data;
  },
};

// Spare Parts API calls
export const sparePartAPI = {
  getSpareParts: async (params: any = {}) => {
    const response = await api.get("/spare-parts", { params });
    return response.data;
  },

  getSparePartById: async (id: number) => {
    const response = await api.get(`/spare-parts/${id}`);
    return response.data;
  },

  createSparePart: async (sparePartData: any) => {
    const response = await api.post("/spare-parts", sparePartData);
    return response.data;
  },

  updateSparePart: async (id: number, sparePartData: any) => {
    const response = await api.put(`/spare-parts/${id}`, sparePartData);
    return response.data;
  },

  deleteSparePart: async (id: number) => {
    const response = await api.delete(`/spare-parts/${id}`);
    return response.data;
  },
};

// Dashboard API calls
export const dashboardAPI = {
  getOverviewStats: async () => {
    const response = await api.get("/dashboard/overview");
    return response.data;
  },

  getSalesChartData: async (period: string = "monthly", year?: number) => {
    const params: any = { period };
    if (year) params.year = year;

    const response = await api.get("/dashboard/sales-chart", { params });
    return response.data;
  },

  getInventoryStats: async () => {
    const response = await api.get("/dashboard/inventory");
    return response.data;
  },

  getCustomerStats: async () => {
    const response = await api.get("/dashboard/customers");
    return response.data;
  },

  getRecentActivity: async () => {
    const response = await api.get("/dashboard/activity");
    return response.data;
  },
};

// Orders API calls
export const orderAPI = {
  getOrders: async (params: any = {}) => {
    const response = await api.get("/orders", { params });
    return response.data;
  },

  getOrderById: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: any) => {
    const response = await api.post("/orders", orderData);
    return response.data;
  },

  updateOrder: async (id: number, orderData: any) => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  },

  deleteOrder: async (id: number) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};

// Test Drives API calls
export const testDriveAPI = {
  getTestDrives: async (params: any = {}) => {
    const response = await api.get("/test-drives", { params });
    return response.data;
  },

  getTestDriveById: async (id: number) => {
    const response = await api.get(`/test-drives/${id}`);
    return response.data;
  },

  createTestDrive: async (testDriveData: any) => {
    const response = await api.post("/test-drives", testDriveData);
    return response.data;
  },

  updateTestDrive: async (id: number, testDriveData: any) => {
    const response = await api.put(`/test-drives/${id}`, testDriveData);
    return response.data;
  },

  deleteTestDrive: async (id: number) => {
    const response = await api.delete(`/test-drives/${id}`);
    return response.data;
  },
};

// Services API calls
export const serviceAPI = {
  getServices: async (params: any = {}) => {
    const response = await api.get("/services", { params });
    return response.data;
  },

  getServiceById: async (id: number) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  createService: async (serviceData: any) => {
    const response = await api.post("/services", serviceData);
    return response.data;
  },

  updateService: async (id: number, serviceData: any) => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data;
  },

  deleteService: async (id: number) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },
};

export default api;
