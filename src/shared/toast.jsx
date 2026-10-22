import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

/** toast({ title, text, type: 'info' | 'error', ttl, onClick }) */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = useCallback((t) => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-3), { id, type: 'info', ttl: 4500, ...t }]);
    setTimeout(() => dismiss(id), t.ttl ?? 4500);
  }, [dismiss]);

  const value = useMemo(() => toast, [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((x) => (
          <button key={x.id} className={'toast ' + x.type} onClick={() => { x.onClick?.(); dismiss(x.id); }}>
            {x.title && <strong>{x.title}</strong>}
            {x.text && <span>{x.text}</span>}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
