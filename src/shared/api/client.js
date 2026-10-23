// Single place that talks HTTP. Everything is under /api (proxied by Vite in dev, by nginx in Docker).
const TOKEN_KEY = 'djama_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Error with the stable backend code: BLOCKED, FORBIDDEN, NOT_FOUND, CONFLICT, VALIDATION, INVALID_CREDENTIALS... */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body, isForm = false) {
  const token = tokenStore.get();
  const res = await fetch('/api' + path, {
    method,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),   // the browser sets the multipart boundary itself
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('djama:unauthorized'));
    throw new ApiError(res.status, data?.code || 'ERROR', data?.error || data?.title || res.statusText);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b ?? {}),
  del: (p) => request('DELETE', p),
  upload: (p, formData) => request('POST', p, formData, true),
};

/** <img>, <audio> and <a download> cannot send headers: the JWT travels in the URL (accepted by /api/attachments only). */
export const mediaUrl = (attachmentId) => `/api/attachments/${attachmentId}?access_token=${encodeURIComponent(tokenStore.get() ?? '')}`;
