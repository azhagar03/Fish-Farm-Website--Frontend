// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers['x-admin-token'] = token;
  return config;
});

export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  seed: () => API.get('/products/seed')
};

export const invoiceAPI = {
  getAll: (params) => API.get('/invoices', { params }),
  getById: (id) => API.get(`/invoices/${id}`),
  create: (data) => API.post('/invoices', data),
  update: (id, data) => API.put(`/invoices/${id}`, data),
  delete: (id) => API.delete(`/invoices/${id}`),
  calculate: (data) => API.post('/invoices/calculate', data),
  getReport: (params) => API.get('/invoices/report', { params })
};

export const customerAPI = {
  getAll: () => API.get('/customers'),
  create: (data) => API.post('/customers', data),
  update: (id, data) => API.put(`/customers/${id}`, data),
  delete: (id) => API.delete(`/customers/${id}`)
};

export const accountingYearAPI = {
  getAll: () => API.get('/accounting-years'),
  getActive: () => API.get('/accounting-years/active'),
  create: (data) => API.post('/accounting-years', data),
  activate: (id) => API.put(`/accounting-years/${id}/activate`),
  getRevenue: (id) => API.get(`/accounting-years/${id}/revenue`)
};

export const adminAPI = {
  login: (data) => API.post('/admin/login', data), // ✅ fixed
  getAll: () => API.get('/admin'),
  create: (data) => API.post('/admin', data),
  delete: (id) => API.delete(`/admin/${id}`)
};

export const fishPriceAPI = {
  getAll: () => API.get('/fish-prices'),
  update: (id, data) => API.put(`/fish-prices/${id}`, data),
  seed: () => API.get('/fish-prices/seed')
};

export default API;
