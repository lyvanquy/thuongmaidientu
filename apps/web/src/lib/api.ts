import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          original.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
      }
    }
    return Promise.reject(err);
  },
);

// Auth
export const authApi = {
  register: (d: any) => api.post('/auth/register', d),
  login: (d: any) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

// Products
export const productApi = {
  list: (params: any) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  create: (d: any) => api.post('/products', d),
  update: (id: string, d: any) => api.patch(`/products/${id}`, d),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Companies
export const companyApi = {
  list: (params: any) => api.get('/companies', { params }),
  getDashboardStats: () => api.get('/companies/my/dashboard-stats'),
  get: (id: string) => api.get(`/companies/${id}`),
  getBySlug: (slug: string) => api.get(`/companies/slug/${slug}`),
  create: (d: any) => api.post('/companies', d),
  update: (id: string, d: any) => api.patch(`/companies/${id}`, d),
};

// Categories
export const categoryApi = {
  tree: () => api.get('/categories'),
  get: (id: string) => api.get(`/categories/${id}`),
};

// RFQ
export const rfqApi = {
  create: (d: any) => api.post('/rfqs', d),
  myList: () => api.get('/rfqs/my'),
  open: () => api.get('/rfqs/open'),
  get: (id: string) => api.get(`/rfqs/${id}`),
};

// Quotation
export const quotationApi = {
  create: (d: any) => api.post('/quotations', d),
  myList: () => api.get('/quotations/my'),
  byRfq: (rfqId: string) => api.get('/quotations', { params: { rfqId } }),
  accept: (id: string) => api.patch(`/quotations/${id}/accept`),
  reject: (id: string) => api.patch(`/quotations/${id}/reject`),
};

// Contract
export const contractApi = {
  create: (d: any) => api.post('/contracts', d),
  myList: () => api.get('/contracts/my'),
  get: (id: string) => api.get(`/contracts/${id}`),
  update: (id: string, d: any) => api.patch(`/contracts/${id}`, d),
  submit: (id: string) => api.post(`/contracts/${id}/submit`),
  sign: (id: string, d: any) => api.post(`/contracts/${id}/sign`, d),
  complete: (id: string) => api.post(`/contracts/${id}/complete`),
};

// Chat
export const chatApi = {
  create: (d: any) => api.post('/chats', d),
  myList: () => api.get('/chats/my'),
  messages: (chatId: string, params?: any) => api.get(`/chats/${chatId}/messages`, { params }),
};

// Notifications
export const notificationApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Favorites
export const favoriteApi = {
  toggle: (d: any) => api.post('/favorites/toggle', d),
  list: () => api.get('/favorites'),
};

// Upload
export const uploadApi = {
  image: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  file: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload/file', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Admin
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params?: any) => api.get('/admin/users', { params }),
  companies: (params?: any) => api.get('/admin/companies', { params }),
  verifyCompany: (id: string, status = 'VERIFIED') => api.patch(`/admin/companies/${id}/verify`, null, { params: { status } }),
  products: (params?: any) => api.get('/admin/products', { params }),
  approveProduct: (id: string) => api.patch(`/admin/products/${id}/approve`),
  rejectProduct: (id: string) => api.patch(`/admin/products/${id}/reject`),
  contracts: (params?: any) => api.get('/admin/contracts', { params }),
  approveContract: (id: string) => api.patch(`/admin/contracts/${id}/approve`),
  rejectContract: (id: string) => api.patch(`/admin/contracts/${id}/reject`),
};
