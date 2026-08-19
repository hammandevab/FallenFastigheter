import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const visa = useCallback((text, typ = 'ok') => {
    const id = nextId++;
    setToasts((t) => [...t, { id, text, typ }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <Ctx.Provider value={{ visa }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`card px-4 py-3 text-sm font-medium shadow-lift border-l-4 ${t.typ === 'fel' ? 'border-l-destructive text-destructive' : 'border-l-primary'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
