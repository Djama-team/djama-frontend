import { useState } from 'react';
import { useChat } from './ChatContext';
import { useAuth } from '../auth/AuthContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ContactsPanel from '../contacts/ContactsPanel';
import NotificationsPanel from '../notifications/NotificationsPanel';
import ProfilePanel from '../profile/ProfilePanel';
import NewGroupModal from '../groups/NewGroupModal';
import { useI18n } from '../../shared/i18n';
import { useTheme } from '../../shared/theme';
import { Avatar } from '../../shared/ui';
import { Icon } from '../../shared/icons';

export default function ChatLayout() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { resolved, setTheme } = useTheme();
  const { active, status, unreadNotifications, conversations } = useChat();
  const [tab, setTab] = useState('chats');
  const [showGroup, setShowGroup] = useState(false);
  const unreadChats = conversations.filter((c) => c.unreadCount > 0).length;

  const tabs = [
    ['chats', t('nav.chats'), Icon.Chat, unreadChats],
    ['contacts', t('nav.contacts'), Icon.Users, 0],
    ['notifications', t('nav.notifications'), Icon.Bell, unreadNotifications],
  ];

  return (
    <div className="app" data-chat-open={active ? 'true' : 'false'}>
      <nav className="rail" aria-label="Navigation">
        <img className="rail-logo" src="/djama-logo.svg" alt="Djama" />
        {tabs.map(([key, label, Ico, badge]) => (
          <button key={key} className={'rail-btn' + (tab === key ? ' on' : '')} onClick={() => setTab(key)} title={label} aria-label={label} aria-current={tab === key}>
            <Ico size={22} />{badge > 0 && <b className="badge">{badge}</b>}
          </button>
        ))}
        <span className="rail-space" />
        <button className="rail-btn" onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')} title={t('profile.theme')} aria-label={t('profile.theme')}>
          {resolved === 'dark' ? <Icon.Sun size={21} /> : <Icon.Moon size={21} />}
        </button>
        <button className={'rail-btn' + (tab === 'profile' ? ' on' : '')} onClick={() => setTab('profile')} title={t('nav.profile')} aria-label={t('nav.profile')}>
          <Avatar name={user.displayName} size={34} />
        </button>
      </nav>

      <aside className="sidebar">
        <header className="side-head"><h2>{tab === 'chats' ? t('nav.chats') : tab === 'contacts' ? t('nav.contacts') : tab === 'notifications' ? t('nav.notifications') : t('nav.profile')}</h2></header>
        {tab === 'chats' && <ConversationList onNewGroup={() => setShowGroup(true)} />}
        {tab === 'contacts' && <ContactsPanel onOpenChat={() => setTab('chats')} />}
        {tab === 'notifications' && <NotificationsPanel onOpenChat={() => setTab('chats')} />}
        {tab === 'profile' && <ProfilePanel />}
      </aside>

      <main className="main">
        {status !== 'connected' && <div className="banner" role="status">{t('chat.reconnecting')}</div>}
        {active ? <ChatWindow key={active.id} /> : <div className="empty"><img src="/djama-logo.svg" alt="" /><h3>Djama</h3><p>{t('chat.empty')}</p></div>}
      </main>
      {showGroup && <NewGroupModal onClose={() => setShowGroup(false)} onCreated={() => setTab('chats')} />}
    </div>
  );
}
