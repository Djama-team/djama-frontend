import { formatDuration } from './ui';

/** Text of a call message from the point of view of the person reading it. */
export function callLabel(m, t, myId) {
  const c = m.call;
  const iAmCaller = m.senderId === myId;
  const kind = c.media === 'Video' ? t('call.video') : t('call.audio');
  if (c.status === 'Missed') return iAmCaller ? `${kind} · ${t('call.noAnswer')}` : `${t('call.missed')} · ${kind}`;
  if (c.status === 'Declined') return iAmCaller ? `${kind} · ${t('call.declined')}` : `${t('call.declined')} · ${kind}`;
  return `${kind} · ${formatDuration(c.seconds * 1000)}`;
}

/** One-line preview used by the conversation list. */
export function previewOf(m, t, myId, isGroup) {
  if (!m) return '';
  if (m.isDeleted) return t('chat.deleted');
  let body;
  if (m.kind === 'Image') body = `📷 ${m.text || t('chat.photo')}`;
  else if (m.kind === 'File') body = `📎 ${m.attachments[0]?.fileName ?? t('chat.file')}`;
  else if (m.kind === 'Voice') body = `🎤 ${formatDuration(m.attachments[0]?.durationMs)}`;
  else if (m.kind === 'Call') return `📞 ${callLabel(m, t, myId)}`;
  else body = m.text;
  const who = m.senderId === myId ? `${t('chat.you')}: ` : isGroup ? `${m.senderName}: ` : '';
  return who + body;
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Short text of a message (or of a reply preview) for quotes. */
export function quoteText(m, t) {
  if (m.isDeleted) return t('chat.deleted');
  if (m.kind === 'Image') return `📷 ${m.text || t('chat.photo')}`;
  if (m.kind === 'Voice') return `🎤 ${t('chat.voice')}`;
  if (m.kind === 'File') return `📎 ${m.text || m.attachments?.[0]?.fileName || t('chat.file')}`;
  if (m.kind === 'Call') return `📞 ${t('call.audio')}`;
  return m.text;
}
