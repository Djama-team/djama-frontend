// Heart of the app: conversations, messages, presence, typing, notifications, reply/edit state,
// kept in sync with the SignalR events. Owner: P3 (chat core).
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { conversationsApi, messagesApi, notificationsApi } from '../../shared/api/endpoints';
import { createChatConnection } from '../../shared/realtime/connection';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../shared/toast';
import { useI18n } from '../../shared/i18n';
import { previewOf } from '../../shared/messageUtils';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

const PAGE = 50;
const byUpdated = (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt);

/** SignalR errors look like "BLOCKED: User is blocked" -> give them the same shape as ApiError. */
function hubError(e) {
  if (e?.code) return e;
  const m = /([A-Z_]{3,}):/.exec(e?.message || '');
  const err = new Error(e?.message || 'ERROR');
  err.code = m ? m[1] : 'ERROR';
  return err;
}

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState({});             // { [conversationId]: MessageDto[] (old -> new) }
  const [hasMore, setHasMore] = useState({});
  const [typing, setTyping] = useState({});                 // { [conversationId]: { [userId]: timestamp } }
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [connection, setConnection] = useState(null);      // the SignalR HubConnection (used by CallContext)
  const [replyTo, setReplyTo] = useState(null);            // MessageDto being answered
  const [editing, setEditing] = useState(null);            // MessageDto being edited
  const connRef = useRef(null);
  const activeRef = useRef(null);
  const convsRef = useRef([]);
  const replyRef = useRef(null);
  const toastRef = useRef(toast);
  const tRef = useRef(t);
  activeRef.current = activeId;
  convsRef.current = conversations;
  replyRef.current = replyTo;
  toastRef.current = toast;
  tRef.current = t;

  const refreshConversations = useCallback(async () => {
    const list = await conversationsApi.list();
    setConversations(list);
    if (activeRef.current && !list.some((c) => c.id === activeRef.current)) setActiveId(null);
    return list;
  }, []);

  const loadMessages = useCallback(async (id) => {
    const list = await messagesApi.list(id);
    setMessages((m) => ({ ...m, [id]: list }));
    setHasMore((h) => ({ ...h, [id]: list.length >= PAGE }));
  }, []);

  const markRead = useCallback((id) => {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    setNotifications((ns) => ns.map((n) => (n.conversationId === id ? { ...n, isRead: true } : n)));
    return messagesApi.markRead(id).catch(() => {});
  }, []);

  const openConversation = useCallback(async (id) => {
    setActiveId(id);
    setReplyTo(null);
    setEditing(null);
    if (!id) return;
    await loadMessages(id).catch(() => {});
    markRead(id);
  }, [loadMessages, markRead]);

  /** Adds messages to a conversation (skips the ones already there: the same message can arrive by HTTP and by SignalR). */
  const appendMessages = useCallback((convId, list) => {
    setMessages((prev) => {
      const cur = prev[convId];
      if (!cur) return prev;
      const fresh = list.filter((m) => !cur.some((x) => x.id === m.id));
      return fresh.length ? { ...prev, [convId]: [...cur, ...fresh] } : prev;
    });
  }, []);

  // ---------- real-time connection ----------
  useEffect(() => {
    if (!user) return undefined;
    const meId = user.id;
    const conn = createChatConnection();
    connRef.current = conn;

    conn.on('ReceiveMessage', (m) => {
      appendMessages(m.conversationId, [m]);
      if (!convsRef.current.some((c) => c.id === m.conversationId)) { refreshConversations().catch(() => {}); return; }
      const isActive = activeRef.current === m.conversationId;
      const mine = m.senderId === meId;
      setConversations((cs) => cs
        .map((c) => (c.id === m.conversationId
          ? { ...c, lastMessage: m, updatedAt: m.createdAt, unreadCount: !isActive && !mine ? c.unreadCount + 1 : c.unreadCount }
          : c))
        .sort(byUpdated));
      if (isActive && !mine) messagesApi.markRead(m.conversationId).catch(() => {});
    });

    conn.on('MessageEdited', (m) => {
      setMessages((prev) => {
        const cur = prev[m.conversationId];
        if (!cur) return prev;
        return { ...prev, [m.conversationId]: cur.map((x) => (x.id === m.id ? m : x)) };
      });
      setConversations((cs) => cs.map((c) => (c.lastMessage?.id === m.id ? { ...c, lastMessage: m } : c)));
    });

    conn.on('MessagesRead', ({ conversationId, userId }) => {
      setMessages((prev) => {
        const cur = prev[conversationId];
        if (!cur) return prev;
        return {
          ...prev,
          [conversationId]: cur.map((m) => (m.senderId !== userId && !m.readByUserIds.includes(userId)
            ? { ...m, readByUserIds: [...m.readByUserIds, userId] } : m)),
        };
      });
    });

    conn.on('MessageDeleted', ({ conversationId, messageId }) => {
      setMessages((prev) => {
        const cur = prev[conversationId];
        if (!cur) return prev;
        return { ...prev, [conversationId]: cur.map((m) => (m.id === messageId ? { ...m, isDeleted: true, text: '', attachments: [] } : m)) };
      });
      refreshConversations().catch(() => {});
    });

    conn.on('ReactionChanged', ({ conversationId, messageId, reactions }) => {
      setMessages((prev) => {
        const cur = prev[conversationId];
        if (!cur) return prev;
        return { ...prev, [conversationId]: cur.map((m) => (m.id === messageId ? { ...m, reactions } : m)) };
      });
    });

    conn.on('Typing', ({ conversationId, userId }) => {
      setTyping((x) => ({ ...x, [conversationId]: { ...(x[conversationId] || {}), [userId]: Date.now() } }));
      setTimeout(() => setTyping((x) => {
        const cur = { ...(x[conversationId] || {}) };
        if (Date.now() - (cur[userId] || 0) >= 2900) delete cur[userId];
        return { ...x, [conversationId]: cur };
      }), 3000);
    });

    conn.on('PresenceChanged', ({ userId, isOnline }) => {
      setConversations((cs) => cs.map((c) => ({
        ...c,
        members: c.members.map((mb) => (mb.user.id === userId
          ? { ...mb, user: { ...mb.user, isOnline, lastSeenAt: isOnline ? mb.user.lastSeenAt : new Date().toISOString() } } : mb)),
      })));
    });

    conn.on('ConversationChanged', () => { refreshConversations().catch(() => {}); });
    conn.on('NotificationReceived', (n) => {
      setNotifications((ns) => [n, ...ns.filter((x) => x.id !== n.id)]);
      const tt = tRef.current;
      toastRef.current({
        title: n.title,
        text: n.type === 'NewMessage' ? n.body : `${tt('notif.AddedToGroup')} « ${n.body} »`,
        onClick: n.conversationId ? () => openConversationRef.current(n.conversationId) : undefined,
      });
    });

    conn.onreconnecting(() => setStatus('reconnecting'));
    conn.onreconnected(() => {
      setStatus('connected');
      refreshConversations().catch(() => {});
      if (activeRef.current) loadMessages(activeRef.current).catch(() => {});
    });
    conn.onclose(() => setStatus('disconnected'));
    setConnection(conn);
    conn.start().then(() => setStatus('connected')).catch(() => setStatus('disconnected'));

    refreshConversations().catch(() => {});
    notificationsApi.list().then(setNotifications).catch(() => {});
    return () => { conn.stop(); setConnection(null); };
  }, [user?.id, refreshConversations, loadMessages, appendMessages]);   // eslint-disable-line react-hooks/exhaustive-deps

  const openConversationRef = useRef(openConversation);
  openConversationRef.current = openConversation;

  // ---------- actions ----------
  const sendMessage = useCallback(async (text) => {
    const id = activeRef.current;
    const conn = connRef.current;
    const replyToId = replyRef.current?.id ?? null;
    try {
      if (conn && conn.state === 'Connected') {
        await conn.invoke('SendMessage', id, text, replyToId);   // comes back through "ReceiveMessage"
      } else {
        appendMessages(id, [await messagesApi.send(id, text, replyToId)]);   // REST fallback when the socket is down
      }
      setReplyTo(null);
    } catch (e) { throw hubError(e); }
  }, [appendMessages]);

  /** Photos, documents, voice notes. opts: { caption, voice, durationMs } */
  const sendFiles = useCallback(async (files, opts = {}) => {
    const id = activeRef.current;
    const list = await messagesApi.upload(id, files, { ...opts, replyToId: replyRef.current?.id });
    appendMessages(id, list);
    setReplyTo(null);
  }, [appendMessages]);

  const editMessage = useCallback(async (id, text) => {
    await messagesApi.edit(id, text);
    setEditing(null);
  }, []);

  const sendTyping = useCallback(() => {
    const conn = connRef.current;
    if (conn && conn.state === 'Connected' && activeRef.current) conn.invoke('Typing', activeRef.current).catch(() => {});
  }, []);

  /** Returns how many older messages were loaded. */
  const loadOlder = useCallback(async (id) => {
    const cur = messages[id];
    if (!cur?.length) return 0;
    const older = await messagesApi.list(id, cur[0].createdAt);
    setMessages((prev) => ({ ...prev, [id]: [...older, ...(prev[id] || [])] }));
    setHasMore((h) => ({ ...h, [id]: older.length >= PAGE }));
    return older.length;
  }, [messages]);

  const addConversation = useCallback(async (c) => {
    setConversations((cs) => (cs.some((x) => x.id === c.id) ? cs : [c, ...cs]));
    await openConversation(c.id);
    return c;
  }, [openConversation]);

  const startDirect = useCallback(async (userId) => addConversation(await conversationsApi.createDirect(userId)), [addConversation]);
  const createGroup = useCallback(async (title, memberIds) => addConversation(await conversationsApi.createGroup(title, memberIds)), [addConversation]);
  const deleteMessage = useCallback((id) => messagesApi.remove(id), []);
  const react = useCallback((id, emoji) => messagesApi.react(id, emoji), []);

  const readNotification = useCallback((n) => {
    setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    return notificationsApi.read(n.id).catch(() => {});
  }, []);
  const readAllNotifications = useCallback(() => {
    setNotifications((ns) => ns.map((x) => ({ ...x, isRead: true })));
    return notificationsApi.readAll().catch(() => {});
  }, []);

  const active = conversations.find((c) => c.id === activeId) || null;
  const value = {
    status, connection, conversations, active, activeId, messages, hasMore, notifications, typing,
    replyTo, setReplyTo, editing, setEditing,
    typingUsers: Object.keys(typing[activeId] || {}),
    unreadNotifications: notifications.filter((n) => !n.isRead).length,
    openConversation, refreshConversations, sendMessage, sendFiles, editMessage, sendTyping, loadOlder,
    startDirect, createGroup, deleteMessage, react, readNotification, readAllNotifications, previewOf,
  };
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
