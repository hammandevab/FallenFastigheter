/** Centraliserat API-lager (blueprint §4.1) – komponenter anropar aldrig fetch direkt. */
const BASE = import.meta.env.VITE_API_URL || '/api/v1';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || `Fel ${res.status}`);
  return data;
}

async function requestForm(method, path, formData) {
  const res = await fetch(`${BASE}${path}`, { method, credentials: 'include', body: formData });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || `Fel ${res.status}`);
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  patch: (p, b) => request('PATCH', p, b),
  delete: (p) => request('DELETE', p),
  postForm: (p, f) => requestForm('POST', p, f),
};

const qs = (q) => {
  const p = new URLSearchParams();
  Object.entries(q || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const auth = {
  login: (b) => api.post('/auth/login', b),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  uppdateraMig: (b) => api.patch('/auth/me', b),
  bytLosenord: (b) => api.post('/auth/me/losenord', b),
  bytEpost: (b) => api.post('/auth/me/epost', b),
  verifieraEpost: (b) => api.post('/auth/verifiera-epost', b),
  glomtLosenord: (b) => api.post('/auth/glomt-losenord', b),
  aterstallLosenord: (b) => api.post('/auth/aterstall-losenord', b),
  aktiveraKonto: (b) => api.post('/auth/aktivera-konto', b),
};

export const pub = {
  site: () => api.get('/public/site'),
  objekt: (q) => api.get('/public/objekt' + qs(q)),
  objektDetalj: (id) => api.get(`/public/objekt/${id}`),
  fastigheter: () => api.get('/public/fastigheter'),
  fastighet: (slug) => api.get(`/public/fastigheter/${slug}`),
  aktuellt: () => api.get('/public/aktuellt'),
  faq: () => api.get('/public/faq'),
  dokument: () => api.get('/public/dokument'),
  utveckling: () => api.get('/public/utveckling'),
  lead: (typ, b) => api.post(`/public/leads/${typ}`, b),
  felanmalan: (f) => api.postForm('/public/felanmalan', f),
};

export const portal = {
  oversikt: () => api.get('/portal/oversikt'),
  boende: () => api.get('/portal/boende'),
  arenden: (q) => api.get('/portal/felanmalningar' + qs(q)),
  arende: (id) => api.get(`/portal/felanmalningar/${id}`),
  nyFelanmalan: (f) => api.postForm('/portal/felanmalningar', f),
  komplettera: (id, f) => api.postForm(`/portal/felanmalningar/${id}/komplettering`, f),
  dokument: () => api.get('/portal/dokument'),
  aktuellt: () => api.get('/portal/aktuellt'),
};

export const admin = {
  stats: () => api.get('/admin/stats'),
  diagnostik: () => api.get('/admin/diagnostik'),
  epostlogg: () => api.get('/admin/epostlogg'),

  fastigheter: (q) => api.get('/admin/fastigheter' + qs(q)),
  fastighet: (id) => api.get(`/admin/fastigheter/${id}`),
  skapaFastighet: (b) => api.post('/admin/fastigheter', b),
  uppdateraFastighet: (id, b) => api.patch(`/admin/fastigheter/${id}`, b),
  fastighetBilder: (id, f) => api.postForm(`/admin/fastigheter/${id}/bilder`, f),
  taBortFastighetBild: (id, i) => api.delete(`/admin/fastigheter/${id}/bilder/${i}`),
  taBortFastighet: (id) => api.delete(`/admin/fastigheter/${id}`),

  objektLista: (q) => api.get('/admin/objekt' + qs(q)),
  objekt: (id) => api.get(`/admin/objekt/${id}`),
  skapaObjekt: (b) => api.post('/admin/objekt', b),
  uppdateraObjekt: (id, b) => api.patch(`/admin/objekt/${id}`, b),
  objektBilder: (id, f) => api.postForm(`/admin/objekt/${id}/bilder`, f),
  taBortObjektBild: (id, i) => api.delete(`/admin/objekt/${id}/bilder/${i}`),
  taBortObjekt: (id) => api.delete(`/admin/objekt/${id}`),

  hyresgaster: (q) => api.get('/admin/hyresgaster' + qs(q)),
  hyresgast: (id) => api.get(`/admin/hyresgaster/${id}`),
  skapaHyresgast: (b) => api.post('/admin/hyresgaster', b),
  uppdateraHyresgast: (id, b) => api.patch(`/admin/hyresgaster/${id}`, b),
  bjudIn: (id) => api.post(`/admin/hyresgaster/${id}/bjud-in`),
  inaktiveraKonto: (id) => api.post(`/admin/hyresgaster/${id}/inaktivera-konto`),
  anonymisera: (id) => api.post(`/admin/hyresgaster/${id}/anonymisera`),
  skapaHyresforhallande: (b) => api.post('/admin/hyresforhallanden', b),
  uppdateraHyresforhallande: (id, b) => api.patch(`/admin/hyresforhallanden/${id}`, b),
  taBortHyresforhallande: (id) => api.delete(`/admin/hyresforhallanden/${id}`),

  arenden: (q) => api.get('/admin/felanmalningar' + qs(q)),
  arende: (id) => api.get(`/admin/felanmalningar/${id}`),
  uppdateraArende: (id, b) => api.patch(`/admin/felanmalningar/${id}`, b),
  arendeHandelse: (id, b) => api.post(`/admin/felanmalningar/${id}/handelser`, b),
  skapaArende: (b) => api.post('/admin/felanmalningar', b),
  arendeUnderlag: () => api.get('/admin/felanmalningar/underlag/val'),

  leads: (q) => api.get('/admin/leads' + qs(q)),
  lead: (id) => api.get(`/admin/leads/${id}`),
  uppdateraLead: (id, b) => api.patch(`/admin/leads/${id}`, b),
  taBortLead: (id) => api.delete(`/admin/leads/${id}`),

  aktuellt: () => api.get('/admin/aktuellt'),
  skapaAktuellt: (b) => api.post('/admin/aktuellt', b),
  uppdateraAktuellt: (id, b) => api.patch(`/admin/aktuellt/${id}`, b),
  taBortAktuellt: (id) => api.delete(`/admin/aktuellt/${id}`),

  utveckling: () => api.get('/admin/utveckling'),
  skapaProjekt: (b) => api.post('/admin/utveckling', b),
  uppdateraProjekt: (id, b) => api.patch(`/admin/utveckling/${id}`, b),
  projektBilder: (id, sida, f) => api.postForm(`/admin/utveckling/${id}/bilder/${sida}`, f),
  taBortProjektBild: (id, sida, i) => api.delete(`/admin/utveckling/${id}/bilder/${sida}/${i}`),
  taBortProjekt: (id) => api.delete(`/admin/utveckling/${id}`),

  dokument: (q) => api.get('/admin/dokument' + qs(q)),
  laddaUppDokument: (f) => api.postForm('/admin/dokument', f),
  uppdateraDokument: (id, b) => api.patch(`/admin/dokument/${id}`, b),
  taBortDokument: (id) => api.delete(`/admin/dokument/${id}`),

  faq: () => api.get('/admin/faq'),
  skapaFaqKategori: (b) => api.post('/admin/faq/kategorier', b),
  uppdateraFaqKategori: (id, b) => api.patch(`/admin/faq/kategorier/${id}`, b),
  taBortFaqKategori: (id) => api.delete(`/admin/faq/kategorier/${id}`),
  skapaFraga: (b) => api.post('/admin/faq/fragor', b),
  uppdateraFraga: (id, b) => api.patch(`/admin/faq/fragor/${id}`, b),
  taBortFraga: (id) => api.delete(`/admin/faq/fragor/${id}`),

  anvandare: () => api.get('/admin/anvandare'),
  skapaAnvandare: (b) => api.post('/admin/anvandare', b),
  inaktiveraAnvandare: (id) => api.post(`/admin/anvandare/${id}/inaktivera`),
  aktiveraAnvandare: (id) => api.post(`/admin/anvandare/${id}/aktivera`),
  aterstallAnvandare: (id) => api.post(`/admin/anvandare/${id}/aterstall`),

  installningar: () => api.get('/admin/installningar'),
  sparaInstallningar: (b) => api.patch('/admin/installningar', b),
};
