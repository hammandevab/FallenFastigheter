import { createContext, useContext, useEffect, useState } from 'react';
import { pub } from '../lib/api.js';

const Ctx = createContext({ site: null });

/** Sajtinställningar + beståndsräknare – hämtas en gång, delas överallt. */
export function SiteProvider({ children }) {
  const [site, setSite] = useState(null);
  useEffect(() => { pub.site().then((r) => setSite(r.data)).catch(() => setSite({})); }, []);
  return <Ctx.Provider value={{ site }}>{children}</Ctx.Provider>;
}
export const useSite = () => useContext(Ctx);
