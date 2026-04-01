// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers['x-admin-token'] = token;
  return config;
});

export const productAPI = {
  getAll: (params) => API.get('/api/products', { params }),
  getById: (id) => API.get(`/api/products/${id}`),
  create: (data) => API.post('/api/products', data),
  update: (id, data) => API.put(`/api/products/${id}`, data),
  delete: (id) => API.delete(`/api/products/${id}`),
  seed: () => API.get('/api/products/seed')
};

export const invoiceAPI = {
  getAll: (params) => API.get('/api/invoices', { params }),
  getById: (id) => API.get(`/api/invoices/${id}`),
  create: (data) => API.post('/api/invoices', data),
  update: (id, data) => API.put(`/api/invoices/${id}`, data),
  delete: (id) => API.delete(`/api/invoices/${id}`),
  calculate: (data) => API.post('/api/invoices/calculate', data),
  getReport: (params) => API.get('/api/invoices/report', { params })
};

export const customerAPI = {
  getAll: () => API.get('/api/customers'),
  create: (data) => API.post('/api/customers', data),
  update: (id, data) => API.put(`/api/customers/${id}`, data),
  delete: (id) => API.delete(`/api/customers/${id}`)
};

export const accountingYearAPI = {
  getAll: () => API.get('/api/accounting-years'),
  getActive: () => API.get('/api/accounting-years/active'),
  create: (data) => API.post('/api/accounting-years', data),
  activate: (id) => API.put(`/api/accounting-years/${id}/activate`),
  getRevenue: (id) => API.get(`/api/accounting-years/${id}/revenue`)
};

export const adminAPI = {
  login: (data) => API.post('/api/admin/login', data),
  getAll: () => API.get('/api/admin'),
  create: (data) => API.post('/api/admin', data),
  delete: (id) => API.delete(`/api/admin/${id}`)
};

export const fishPriceAPI = {
  getAll: () => API.get('/api/fish-prices'),
  update: (id, data) => API.put(`/api/fish-prices/${id}`, data),
  seed: () => API.get('/api/fish-prices/seed')
};

export default API;
