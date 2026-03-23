// src/services/api.js - Centralized API calls
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  getById: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  seed: () => API.get('/products/seed')
};

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoiceAPI = {
  getAll: () => API.get('/invoices'),
  getById: (id) => API.get(`/invoices/${id}`),
  create: (data) => API.post('/invoices', data),
  update: (id, data) => API.put(`/invoices/${id}`, data),
  delete: (id) => API.delete(`/invoices/${id}`),
  calculate: (items) => API.post('/invoices/calculate', { items })
};

// ─── Fish Prices ──────────────────────────────────────────────────────────────
export const fishPriceAPI = {
  getAll: () => API.get('/fish-prices'),
  update: (id, data) => API.put(`/fish-prices/${id}`, data),
  seed: () => API.get('/fish-prices/seed')
};

export default API;
