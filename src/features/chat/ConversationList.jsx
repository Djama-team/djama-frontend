import { useState } from 'react';
import { useChat } from './ChatContext';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../../shared/i18n';
import { Avatar, listTime } from '../../shared/ui';
import { previewOf } from '../../shared/messageUtils';
import { Icon } from '../../shared/icons';

export default function ConversationList({ onNewGroup }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { conversations, activeId, openConversation, typing } = useChat();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const shown = conversations.filter((c) =>
    (filter === 'unread' ? c.unreadCount > 0 : filter === 'groups' ? c.type === 'Group' : true)
    && c.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="list-pane">
      <div className="list-tools">
        <label className="search-box"><Icon.Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('chat.search')} /></label>
        <div className="chips">
          {['all', 'unread', 'groups'].map((f) => (
            <button key={f} className={'chip' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>{t('chat.filter.' + f)}</button>
          ))}
        </div>
      </div>
      <div className="list">
        {conversations.length === 0 && <p className="hint">{t('chat.noChats')}</p>}
        {conversations.length > 0 && shown.length === 0 && <p className="hint">{t('chat.noResults')}</p>}
        {shown.map((c) => {
          const other = c.type === 'Direct' ? c.members.find((m) => m.user.id !== user.id)?.user : null;
          const isTyping = Object.keys(typing[c.id] || {}).length > 0;
          return (
            <button key={c.id} className={'row' + (c.id === activeId ? ' on' : '')} onClick={() => openConversation(c.id)}>
              <Avatar name={c.title} online={other ? other.isOnline : undefined} size={48} />
              <span className="row-main">
                <span className="row-top"><strong>{c.title}</strong><time className={c.unreadCount > 0 ? 'unread' : ''}>{c.lastMessage ? listTime(c.lastMessage.createdAt) : ''}</time></span>
                <span className="row-bottom">
                  <span className={'preview' + (isTyping ? ' typing' : '')}>{isTyping ? t('chat.typing') : previewOf(c.lastMessage, t, user.id, c.type === 'Group')}</span>
                  {c.unreadCount > 0 && <b className="badge">{c.unreadCount}</b>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button className="fab floating" onClick={onNewGroup} title={t('groups.new')} aria-label={t('groups.new')}><Icon.Plus size={22} /></button>
    </div>
  );
}
