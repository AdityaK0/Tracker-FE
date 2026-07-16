import { apiClient } from './client';

// Auth
export const authApi = {
  login: (username, password) =>
    apiClient
      .post('/auth/login', { username, password })
      .then((r) => r.data),

  register: (username, fullname, email, password) =>
    apiClient
      .post('/auth/register', { username, fullname, email, password })
      .then((r) => r.data),

  logout: (refresh_token) =>
    apiClient.post('/auth/logout', { refresh_token }),

  me: () => apiClient.get('/auth/me').then((r) => r.data),
};

// Notes
export const notesApi = {
  list: (params) =>
    apiClient.get('/notes', { params }).then((r) => r.data),

  create: (title, content) =>
    apiClient.post('/notes', { title, content }).then((r) => r.data),

  update: (id, data) => apiClient.patch(`/notes/${id}`, data).then((r) => r.data),

  delete: (id) => apiClient.delete(`/notes/${id}`),
};

// Trackers
export const trackersApi = {
  list: (status) =>
    apiClient
      .get('/trackers', {
        params: status ? { status } : {},
      })
      .then((r) => r.data),

  create: (data) => apiClient.post('/trackers', data).then((r) => r.data),

  get: (id) =>
    apiClient.get(`/trackers/${id}`).then((r) => r.data),

  update: (id, data) =>
    apiClient
      .patch(`/trackers/${id}`, data)
      .then((r) => r.data),

  delete: (id) => apiClient.delete(`/trackers/${id}`),

  updateProgress: (id, day_index, habit_id, completed) =>
    apiClient
      .patch(`/trackers/${id}/progress`, { day_index, habit_id, completed })
      .then((r) => r.data),
};

// Dashboard
export const dashboardApi = {
  stats: () => apiClient.get('/dashboard').then((r) => r.data),
};
