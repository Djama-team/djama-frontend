const COLORS = ['#C8553D', '#1F5F4A', '#B7791F', '#8A4B2D', '#2F7D6B', '#9B3D2A'];

export function Avatar({ name = '?', online, size = 40 }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  const color = COLORS[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLORS.length];
  return (
    <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials}
      {online !== undefined && <i className={'dot' + (online ? ' on' : '')} />}
    </span>
  );
}

export const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const formatDay = (iso) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'long' });

export function formatDuration(ms) {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Conversation list timestamp: time today, weekday this week, otherwise date. */
export function listTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(iso);
  if (now - d < 6 * 24 * 3600 * 1000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}
