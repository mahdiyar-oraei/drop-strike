import axios, { AxiosResponse } from 'axios';
import { ApiResponse, User, DashboardStats, Payout, AdReward } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await api.get('/auth/profile');
    return response.data;
  },
};

export const adminApi = {
  getDashboard: async (): Promise<ApiResponse<DashboardStats>> => {
    const response: AxiosResponse<ApiResponse<DashboardStats>> = await api.get('/admin/dashboard');
    return response.data;
  },

  getAnalytics: async (timeframe: string, metric: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/admin/analytics', {
      params: { timeframe, metric },
    });
    return response.data;
  },

  getSystemHealth: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/admin/health');
    return response.data;
  },

  exportData: async (dataType: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/admin/export/${dataType}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export const userApi = {
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<{ users: User[]; stats: any; pagination: any }>> => {
    const response: AxiosResponse<ApiResponse<{ users: User[]; stats: any; pagination: any }>> = await api.get('/users/admin/all', {
      params,
    });
    return response.data;
  },

  getUserDetails: async (userId: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/users/admin/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await api.put(`/users/admin/${userId}`, data);
    return response.data;
  },

  bulkUserAction: async (action: string, userIds: string[], data?: any): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/admin/users/bulk-action', {
      action,
      userIds,
      ...data,
    });
    return response.data;
  },
};

export const payoutApi = {
  getPayouts: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<ApiResponse<{ payouts: Payout[]; stats: any; pagination: any }>> => {
    const response: AxiosResponse<ApiResponse<{ payouts: Payout[]; stats: any; pagination: any }>> = await api.get('/payouts/admin/all', {
      params,
    });
    return response.data;
  },

  processPayout: async (payoutId: string, adminNotes?: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(`/payouts/admin/${payoutId}/process`, {
      adminNotes,
    });
    return response.data;
  },

  rejectPayout: async (payoutId: string, reason: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(`/payouts/admin/${payoutId}/reject`, {
      reason,
    });
    return response.data;
  },
};

export const adApi = {
  getAdRewards: async (params: {
    page?: number;
    limit?: number;
    adType?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{ adRewards: AdReward[]; pagination: any }>> => {
    const response: AxiosResponse<ApiResponse<{ adRewards: AdReward[]; pagination: any }>> = await api.get('/ads/admin/rewards', {
      params,
    });
    return response.data;
  },

  createAdReward: async (data: Partial<AdReward>): Promise<ApiResponse<{ adReward: AdReward }>> => {
    const response: AxiosResponse<ApiResponse<{ adReward: AdReward }>> = await api.post('/ads/admin/rewards', data);
    return response.data;
  },

  updateAdReward: async (id: string, data: Partial<AdReward>): Promise<ApiResponse<{ adReward: AdReward }>> => {
    const response: AxiosResponse<ApiResponse<{ adReward: AdReward }>> = await api.put(`/ads/admin/rewards/${id}`, data);
    return response.data;
  },

  getAdAnalytics: async (timeframe: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/ads/admin/analytics', {
      params: { timeframe },
    });
    return response.data;
  },
};

export default api;
