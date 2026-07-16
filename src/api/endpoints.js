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

  togglePin: (id) => apiClient.patch(`/trackers/${id}/pin`).then((r) => r.data),
};

// Trash
export const trashApi = {
  list: () => apiClient.get('/trash').then(r => r.data),
  restoreNote: (id) => apiClient.post(`/trash/notes/${id}/restore`).then(r => r.data),
  restoreTracker: (id) => apiClient.post(`/trash/trackers/${id}/restore`).then(r => r.data),
  deleteNotePermanently: (id) => apiClient.delete(`/trash/notes/${id}`),
  deleteTrackerPermanently: (id) => apiClient.delete(`/trash/trackers/${id}`),
  emptyTrash: () => apiClient.delete('/trash').then(r => r.data),
};

// Dashboard
export const dashboardApi = {
  stats: () => apiClient.get('/dashboard').then((r) => r.data),
};

// Profile
export const profileApi = {
  getMe: () => apiClient.get('/users/me').then(r => r.data),
  updateMe: (data) => apiClient.patch('/users/me', data).then(r => r.data),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  deleteAvatar: () => apiClient.delete('/users/avatar').then(r => r.data),
};


// Activity (event log heatmap)
export const activityApi = {
  // Returns { data: [{date, count}], total_events, start_date, end_date }
  get: (params = {}) => apiClient.get('/activity', { params }).then(r => r.data),
};
