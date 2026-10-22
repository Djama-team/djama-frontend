import { useAuth } from './features/auth/AuthContext';
import AuthPage from './features/auth/AuthPage';
import { ChatProvider } from './features/chat/ChatContext';
import ChatLayout from './features/chat/ChatLayout';
import { CallProvider } from './features/calls/CallContext';
import CallOverlay from './features/calls/CallOverlay';

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="splash"><img src="/djama-logo.svg" alt="Djama" /></div>;
  if (!user) return <AuthPage />;
  return (
    <ChatProvider>
      <CallProvider>
        <ChatLayout />
        <CallOverlay />
      </CallProvider>
    </ChatProvider>
  );
}
