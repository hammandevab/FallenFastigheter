import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '../lib/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const ladda = useCallback(async () => {
    try { const r = await auth.me(); setUser(r.data); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { ladda(); }, [ladda]);

  const loggaIn = async (epost, losenord) => {
    const r = await auth.login({ epost, losenord });
    setUser(r.data);
    return r.data;
  };
  const loggaUt = async () => { await auth.logout().catch(() => {}); setUser(null); };

  return <Ctx.Provider value={{ user, setUser, loading, loggaIn, loggaUt, laddaOm: ladda }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
