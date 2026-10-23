import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './features/auth/AuthContext';
import { I18nProvider } from './shared/i18n';
import { ThemeProvider } from './shared/theme';
import { ToastProvider } from './shared/toast';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </I18nProvider>,
);
