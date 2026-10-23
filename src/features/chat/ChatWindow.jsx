import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { useChat } from './ChatContext';
import { useAuth } from '../auth/AuthContext';
import { useCall } from '../calls/CallContext';
import { useI18n } from '../../shared/i18n';
import { Avatar, formatDay } from '../../shared/ui';
import { Icon } from '../../shared/icons';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import AttachmentPreview from './AttachmentPreview';
import Lightbox from './Lightbox';
import GroupInfoPanel from '../groups/GroupInfoPanel';

const GROUP_GAP_MS = 5 * 60 * 1000;

export default function ChatWindow() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { active, messages, hasMore, typingUsers, loadOlder, openConversation, deleteMessage, react, sendFiles, setReplyTo, setEditing } = useChat();
  const { startCall, call } = useCall();
  const [info, setInfo] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState([]);       // files waiting in the preview modal
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef(null);
  const atBottomRef = useRef(true);
  const restoreRef = useRef(null);
  const dragDepth = useRef(0);

  const list = messages[active.id] || [];
  const last = list[list.length - 1];
  const isGroup = active.type === 'Group';
  const other = isGroup ? null : active.members.find((m) => m.user.id !== user.id)?.user;

  // Keep the view at the bottom for new messages, but keep the position when older ones are loaded above.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (restoreRef.current != null) { el.scrollTop = el.scrollHeight - restoreRef.current; restoreRef.current = null; }
    else if (atBottomRef.current || last?.senderId === user.id) el.scrollTop = el.scrollHeight;
  }, [list.length, last?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = (e) => {
    const el = e.currentTarget;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    atBottomRef.current = near;
    setAtBottom(near);
  };
  const toBottom = () => { const el = scrollRef.current; el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); };
  const keepBottom = () => { if (atBottomRef.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; };
  const loadMore = async () => {
    restoreRef.current = scrollRef.current.scrollHeight;
    const n = await loadOlder(active.id);
    if (!n) restoreRef.current = null;
  };
  const jump = (id) => {
    const el = document.getElementById('m-' + id);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1400);
  };

  const dnd = {
    onDragEnter: (e) => { e.preventDefault(); dragDepth.current += 1; setDragging(true); },
    onDragOver: (e) => e.preventDefault(),
    onDragLeave: () => { dragDepth.current -= 1; if (dragDepth.current <= 0) setDragging(false); },
    onDrop: (e) => {
      e.preventDefault(); dragDepth.current = 0; setDragging(false);
      const files = [...e.dataTransfer.files];
      if (files.length) setPending(files);
    },
  };

  const typingNames = typingUsers
    .map((id) => active.members.find((m) => m.user.id === id)?.user.displayName).filter(Boolean).join(', ');
  const subtitle = typingNames ? `${typingNames} ${t('chat.typing')}`
    : isGroup ? `${t('chat.members')}: ${active.members.length}`
    : other?.isOnline ? t('chat.online') : t('chat.offline');

  return (
    <section className="chat" {...dnd}>
      <header className="chat-head">
        <button className="icon back" onClick={() => openConversation(null)} aria-label={t('common.back')}><Icon.ArrowLeft size={22} /></button>
        <Avatar name={active.title} online={other ? other.isOnline : undefined} />
        <div className="chat-title"><strong>{active.title}</strong><span className={typingNames ? 'typing' : ''}>{subtitle}</span></div>
        {!isGroup && (
          <>
            <button className="icon" disabled={!!call} onClick={() => startCall(active, 'Video')} title={t('call.start.video')} aria-label={t('call.start.video')}><Icon.Video size={22} /></button>
            <button className="icon" disabled={!!call} onClick={() => startCall(active, 'Audio')} title={t('call.start.audio')} aria-label={t('call.start.audio')}><Icon.Phone size={21} /></button>
          </>
        )}
        {isGroup && <button className="icon" onClick={() => setInfo(!info)} title={t('groups.info')} aria-label={t('groups.info')}><Icon.Info size={22} /></button>}
      </header>

      <div className="chat-body">
        <div className="messages-wrap">
          <div className="messages" ref={scrollRef} onScroll={onScroll}>
            {hasMore[active.id] && <button className="link center" onClick={loadMore}>{t('chat.loadOlder')}</button>}
            {list.map((m, i) => {
              const prev = list[i - 1];
              const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              const first = newDay || prev.senderId !== m.senderId || prev.kind === 'Call' || m.kind === 'Call'
                || new Date(m.createdAt) - new Date(prev.createdAt) > GROUP_GAP_MS;
              return (
                <Fragment key={m.id}>
                  {newDay && <div className="day">{formatDay(m.createdAt)}</div>}
                  <MessageBubble m={m} mine={m.senderId === user.id} isGroup={isGroup} first={first}
                    membersCount={active.members.length} myId={user.id}
                    onReply={(x) => { setEditing(null); setReplyTo(x); }} onEdit={(x) => { setReplyTo(null); setEditing(x); }}
                    onDelete={deleteMessage} onReact={react} onOpenImage={setLightbox} onJump={jump} onMediaLoad={keepBottom} />
                </Fragment>
              );
            })}
          </div>
          {!atBottom && <button className="to-bottom" onClick={toBottom} aria-label={t('chat.scrollDown')}><Icon.ArrowDown size={20} /></button>}
        </div>
        {info && isGroup && <GroupInfoPanel conversation={active} onClose={() => setInfo(false)} />}
      </div>

      <MessageInput onFiles={setPending} />
      {dragging && <div className="drop-overlay"><Icon.Paperclip size={40} /><span>{t('chat.dropHere')}</span></div>}
      {pending.length > 0 && (
        <AttachmentPreview files={pending} onClose={() => setPending([])}
          onSend={async (caption) => { await sendFiles(pending, { caption }); setPending([]); }} />
      )}
      {lightbox && <Lightbox attachment={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  );
}
