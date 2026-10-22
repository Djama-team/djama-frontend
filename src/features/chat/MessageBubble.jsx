import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../shared/i18n';
import { useToast } from '../../shared/toast';
import { mediaUrl } from '../../shared/api/client';
import { formatBytes, formatTime } from '../../shared/ui';
import { callLabel, quoteText } from '../../shared/messageUtils';
import { Icon } from '../../shared/icons';
import VoicePlayer from './VoicePlayer';

const QUICK = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const EDIT_WINDOW_MS = 15 * 60 * 1000;      // same rule as the backend

export default function MessageBubble({ m, mine, isGroup, first, membersCount, myId, onReply, onEdit, onDelete, onReact, onOpenImage, onJump, onMediaLoad }) {
  const { t } = useI18n();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  if (m.kind === 'Call') {
    const missed = m.call.status !== 'Ended';
    const CallIcon = m.call.media === 'Video' ? Icon.Video : Icon.Phone;
    return (
      <div id={'m-' + m.id} className="call-pill-wrap">
        <div className={'call-pill' + (missed && !mine ? ' missed' : '')}>
          <CallIcon size={15} /> <span>{callLabel(m, t, myId)}</span> <time>{formatTime(m.createdAt)}</time>
        </div>
      </div>
    );
  }

  const att = m.attachments[0];
  const reads = m.readByUserIds.length;
  const read = mine && (isGroup ? reads >= membersCount - 1 : reads >= 1);          // ✓ sent · ✓✓ read
  const canEdit = mine && !m.isDeleted && ['Text', 'Image', 'File'].includes(m.kind)
    && Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS;
  const act = (fn) => () => { setMenu(false); fn(); };

  let body = null;
  if (m.isDeleted) body = <em className="deleted">{t('chat.deleted')}</em>;
  else if (m.kind === 'Voice' && att) body = <VoicePlayer attachment={att} />;
  else if (m.kind === 'Image' && att) {
    body = (
      <>
        <img className="media" src={mediaUrl(att.id)} alt={att.fileName} loading="lazy" onClick={() => onOpenImage(att)} onLoad={onMediaLoad} />
        {m.text && <p>{m.text}</p>}
      </>
    );
  } else if (m.kind === 'File' && att) {
    body = (
      <>
        {att.contentType.startsWith('video/')
          ? <video className="media" controls preload="metadata" src={mediaUrl(att.id)} onLoadedMetadata={onMediaLoad} />
          : (
            <a className="file" href={mediaUrl(att.id)} download={att.fileName}>
              <span className="file-ico"><Icon.File size={22} /></span>
              <span className="file-meta"><strong>{att.fileName}</strong><span>{formatBytes(att.sizeBytes)}</span></span>
              <Icon.Download size={18} />
            </a>
          )}
        {m.text && <p>{m.text}</p>}
      </>
    );
  } else body = <p>{m.text}</p>;

  return (
    <div id={'m-' + m.id} ref={ref} className={'msg' + (mine ? ' mine' : '') + (first ? ' first' : '')}>
      <div className={'bubble' + (m.kind === 'Image' && !m.text && !m.isDeleted ? ' media-only' : '')}>
        {isGroup && !mine && first && <div className="sender">{m.senderName}</div>}
        {m.replyTo && (
          <button className="quote" onClick={() => onJump(m.replyTo.id)}>
            <strong>{m.replyTo.senderName}</strong><span>{quoteText(m.replyTo, t)}</span>
          </button>
        )}
        {body}
        <div className="meta">
          {m.editedAt && !m.isDeleted && <span>{t('chat.edited')}</span>}
          <time>{formatTime(m.createdAt)}</time>
          {mine && !m.isDeleted && <span className={'ticks' + (read ? ' read' : '')}>{read ? <Icon.CheckCheck size={15} /> : <Icon.Check size={15} />}</span>}
        </div>
        {!m.isDeleted && <button className="chev" onClick={() => setMenu(!menu)} aria-label="Menu"><Icon.ChevronDown size={16} /></button>}
        {menu && (
          <div className="menu">
            <div className="menu-emoji">{QUICK.map((e) => <button key={e} onClick={act(() => onReact(m.id, e))}>{e}</button>)}</div>
            <button onClick={act(() => onReply(m))}><Icon.Reply size={16} /> {t('chat.reply')}</button>
            {m.text && <button onClick={act(() => { navigator.clipboard?.writeText(m.text); toast({ text: t('common.copied'), ttl: 1500 }); })}><Icon.Copy size={16} /> {t('chat.copy')}</button>}
            {canEdit && <button onClick={act(() => onEdit(m))}><Icon.Edit size={16} /> {t('chat.edit')}</button>}
            {mine && <button className="danger" onClick={act(() => onDelete(m.id))}><Icon.Trash size={16} /> {t('chat.delete')}</button>}
          </div>
        )}
      </div>
      {m.reactions.length > 0 && (
        <div className="reactions">
          {m.reactions.map((r) => (
            <button key={r.emoji} className={r.userIds.includes(myId) ? 'on' : ''} onClick={() => onReact(m.id, r.emoji)}>{r.emoji} {r.count}</button>
          ))}
        </div>
      )}
    </div>
  );
}
