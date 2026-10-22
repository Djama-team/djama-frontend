// One function per backend endpoint. Names and JSON fields mirror docs/api-contracts.md (camelCase).
import { api } from './client';

export const authApi = {
  register: ({ username, displayName, email, password }) => api.post('/auth/register', { username, displayName, email, password }),
  login: ({ usernameOrEmail, password }) => api.post('/auth/login', { usernameOrEmail, password }),
  me: () => api.get('/auth/me'),
};

export const usersApi = {
  search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  get: (id) => api.get(`/users/${id}`),
  updateMe: ({ displayName, about }) => api.put('/users/me', { displayName, about }),
};

export const contactsApi = {
  list: () => api.get('/contacts'),
  add: (userId) => api.post('/contacts', { userId }),
  remove: (userId) => api.del(`/contacts/${userId}`),
};

export const blocksApi = {
  list: () => api.get('/blocks'),
  block: (userId) => api.post('/blocks', { userId }),
  unblock: (userId) => api.del(`/blocks/${userId}`),
};

export const conversationsApi = {
  list: () => api.get('/conversations'),
  get: (id) => api.get(`/conversations/${id}`),
  createDirect: (userId) => api.post('/conversations/direct', { userId }),
  createGroup: (title, memberIds) => api.post('/conversations/group', { title, memberIds }),
  rename: (id, title) => api.put(`/conversations/${id}`, { title }),
  addMember: (id, userId) => api.post(`/conversations/${id}/members`, { userId }),
  removeMember: (id, userId) => api.del(`/conversations/${id}/members/${userId}`),
  setRole: (id, userId, role) => api.put(`/conversations/${id}/members/${userId}/role`, { role }), // 'Admin' | 'Member'
};

export const messagesApi = {
  list: (conversationId, before) =>
    api.get(`/conversations/${conversationId}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`),
  send: (conversationId, text, replyToId) => api.post(`/conversations/${conversationId}/messages`, { text, replyToId: replyToId ?? null }),
  edit: (messageId, text) => api.put(`/messages/${messageId}`, { text }),
  /** files: File[] · opts: { caption, replyToId, voice, durationMs } -> MessageDto[] (one message per file) */
  upload: (conversationId, files, { caption, replyToId, voice, durationMs } = {}) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f, f.name));
    if (caption) fd.append('caption', caption);
    if (replyToId) fd.append('replyToId', replyToId);
    if (voice) { fd.append('voice', 'true'); fd.append('durationMs', String(Math.round(durationMs || 0))); }
    return api.upload(`/conversations/${conversationId}/attachments`, fd);
  },
  markRead: (conversationId) => api.post(`/conversations/${conversationId}/read`),
  remove: (messageId) => api.del(`/messages/${messageId}`),
  react: (messageId, emoji) => api.put(`/messages/${messageId}/reaction`, { emoji }),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  read: (id) => api.post(`/notifications/${id}/read`),
  readAll: () => api.post('/notifications/read-all'),
};
