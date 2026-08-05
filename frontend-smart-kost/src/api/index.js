import api from './axios'

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  uploadAvatar: (data) => api.post('/auth/avatar', data),
}

export const userApi = {
  list: (params) => api.get('/developer/users', { params }),
  get: (id) => api.get(`/developer/users/${id}`),
  create: (data) => api.post('/developer/users', data),
  update: (id, data) => api.put(`/developer/users/${id}`, data),
  delete: (id) => api.delete(`/developer/users/${id}`),
  owners: () => api.get('/developer/owners'),
  syncPermissions: (id, permissions) => api.put(`/developer/users/${id}/permissions`, { permissions }),
}

export const roleApi = {
  list: () => api.get('/developer/roles'),
}

export const permissionApi = {
  list: () => api.get('/developer/permissions'),
}

export const auditApi = {
  list: (params) => api.get('/developer/audit-logs', { params }),
}

export const propertyApi = {
  list: (params) => api.get('/properties', { params }),
  get: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
}

export const roomTypeApi = {
  list: (propertyId, params) => api.get(`/properties/${propertyId}/room-types`, { params }),
  create: (propertyId, data) => api.post(`/properties/${propertyId}/room-types`, data),
  update: (propertyId, id, data) => api.put(`/properties/${propertyId}/room-types/${id}`, data),
  delete: (propertyId, id) => api.delete(`/properties/${propertyId}/room-types/${id}`),
}

export const roomApi = {
  list: (propertyId, params) => api.get(`/properties/${propertyId}/rooms`, { params }),
  get: (propertyId, id) => api.get(`/properties/${propertyId}/rooms/${id}`),
  create: (propertyId, data) => api.post(`/properties/${propertyId}/rooms`, data),
  update: (propertyId, id, data) => api.put(`/properties/${propertyId}/rooms/${id}`, data),
  delete: (propertyId, id) => api.delete(`/properties/${propertyId}/rooms/${id}`),
  updateStatus: (propertyId, id, data) => api.patch(`/properties/${propertyId}/rooms/${id}/status`, data),
}

export const tenantApi = {
  list: (params) => api.get('/tenants', { params }),
  get: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`),
  checkout: (id, data) => api.post(`/tenants/${id}/checkout`, data),
  checkoutPreview: (id, params) => api.get(`/tenants/${id}/checkout-preview`, { params }),
}

export const contractApi = {
  list: (params) => api.get('/contracts', { params }),
  get: (id) => api.get(`/contracts/${id}`),
  update: (id, data) => api.put(`/contracts/${id}`, data),
  billingData: (id, params) => api.get(`/contracts/${id}/billing-data`, { params }),
}

export const utilityApi = {
  getSettings: (propertyId) => api.get(`/properties/${propertyId}/utility-settings`),
  createSetting: (propertyId, data) => api.post(`/properties/${propertyId}/utility-settings`, data),
  updateSetting: (propertyId, id, data) => api.put(`/properties/${propertyId}/utility-settings/${id}`, data),
  deleteSetting: (propertyId, id) => api.delete(`/properties/${propertyId}/utility-settings/${id}`),
  listReadings: (params) => api.get('/utility-readings', { params }),
  createReading: (data) => api.post('/utility-readings', data),
  updateReading: (id, data) => api.put(`/utility-readings/${id}`, data),
}

export const invoiceApi = {
  list: (params) => api.get('/invoices', { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  generate: (data) => api.post('/invoices/generate', data),
  delete: (id) => api.delete(`/invoices/${id}`),
  updateStatus: (id, data) => api.patch(`/invoices/${id}/status`, data),
}

export const paymentApi = {
  list: (params) => api.get('/payments', { params }),
  get: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  confirm: (id, data) => api.patch(`/payments/${id}/confirm`, data),
  reject: (id) => api.patch(`/payments/${id}/reject`),
  delete: (id) => api.delete(`/payments/${id}`),
}

export const expenseApi = {
  list: (params) => api.get('/expenses', { params }),
  get: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getCategories: (propertyId) => api.get(`/properties/${propertyId}/expense-categories`),
}

export const cleaningApi = {
  list: (params) => api.get('/cleaning-tasks', { params }),
  get: (id) => api.get(`/cleaning-tasks/${id}`),
  create: (data) => api.post('/cleaning-tasks', data),
  updateStatus: (id, data) => api.patch(`/cleaning-tasks/${id}/status`, data),
  addPhoto: (id, data) => api.post(`/cleaning-tasks/${id}/photos`, data),
  assignableUsers: (params) => api.get('/cleaning-tasks/assignable-users', { params }),
}

export const taskGroupApi = {
  list: (params) => api.get('/task-groups', { params }),
  candidates: (params) => api.get('/task-groups/candidates', { params }),
  create: (data) => api.post('/task-groups', data),
  update: (id, data) => api.put(`/task-groups/${id}`, data),
  destroy: (id) => api.delete(`/task-groups/${id}`),
}

export const dashboardApi = {
  owner: () => api.get('/dashboard/owner'),
  admin: () => api.get('/dashboard/admin'),
  staff: () => api.get('/dashboard/staff'),
}

export const reportApi = {
  finance: (params) => api.get('/reports/finance', { params }),
  occupancy: (params) => api.get('/reports/occupancy', { params }),
  tenant: (params) => api.get('/reports/tenant', { params }),
}

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.post('/notifications/read-all'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
}
