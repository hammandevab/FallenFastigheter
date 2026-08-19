# Fallens Fastigheter – webbplattform

Fullstack-plattform för Fallens Fastigheter i Trollhättan & Vänersborg: publik webbplats, inloggad hyresgästportal (**Mina sidor**) och administrationsgränssnitt (**Förvaltning**) i en och samma deploy.

> *"Vi ser möjligheterna i våra fastigheter."*

## Innehåll

| Del | Väg | Beskrivning |
|---|---|---|
| Publik sajt | `/` | Lediga bostäder & lokaler, fastighetssidor med karta, hyresgästinformation, FAQ, aktuellt, utvecklingsprojekt, felanmälan och fyra lead-formulär till en gemensam inkorg |
| Hyresgästportal | `/mina-sidor` | Översikt, mitt boende, felanmälningar med tidslinje & komplettering, dokument, riktat aktuellt, profil |
| Admin | `/admin` | KPI-översikt med självdiagnostik, fastigheter, objekt, hyresgäster & hyresförhållanden, ärendehantering, leads, aktuellt, utveckling, dokument, FAQ, användare, inställningar |

## Teknik

- **Server:** Node 20 (ESM), Express 4, Mongoose 8, JWT i HttpOnly-cookie, Joi-validering, Helmet/CORS/rate-limit, Multer + Sharp för bilder, Winston-logg. All behörighet prövas serverside med radnivåskydd (en hyresgäst kan aldrig läsa någon annans data).
- **Klient:** React 18 + Vite 5, react-router-dom 6, Tailwind 3 (designtokens via CSS-variabler), Leaflet-kartor. Alla sidor lazy-laddas.
- **Databas:** MongoDB. Idempotent seed skapar grunddata och – med `SEED_DEMO=true` – ett komplett demoinnehåll.
- **Filer:** publika bilder serveras statiskt under `/uploads/public/*`; skyddade dokument och ärendebilder streamas via behörighetsprövade endpoints under `/api/v1/filer/*`.

## Snabbstart lokalt

```bash
# 1. Beroenden
cd server && npm install
cd ../client && npm install

# 2. MongoDB – egen instans, eller inbäddad för utveckling:
cd ../server && npm run dev:mongo        # startar mongodb-memory-server på :27017

# 3. Servern (nytt terminalfönster)
cd server
MONGODB_URI=mongodb://127.0.0.1:27017/fallens \
JWT_SECRET=valfri-lang-hemlighet \
SEED_DEMO=true \
npm run dev                              # API på http://localhost:5000

# 4. Klienten (nytt terminalfönster) – proxar /api och /uploads till :5000
cd client && npm run dev                 # http://localhost:5173
```

Byggd klient (`cd client && npm run build`) serveras automatiskt av servern från `client/dist` med SPA-fallback, så i produktion räcker en process.

### Demo-inloggningar (skapas av seeden)

| Roll | E-post | Lösenord |
|---|---|---|
| Administratör | `admin@fallens.se` | `FallensAdmin2026!` |
| Hyresgäst | `anna.hyresgast@example.com` | `FallensDemo2026!` |

## Miljövariabler

| Variabel | Krävs | Beskrivning |
|---|---|---|
| `MONGODB_URI` | ja | Anslutningssträng till MongoDB |
| `JWT_SECRET` | ja | Hemlighet för inloggningstoken |
| `APP_URL` | ja (prod) | Publik bas-URL, används i e-postlänkar |
| `PORT` | nej | Standard `5000` |
| `HOST` | nej | Standard `::` (IPv6, krävs av Railways interna nät); faller automatiskt tillbaka till `0.0.0.0` där IPv6 saknas |
| `UPLOAD_DIR` | nej | Lagringskatalog för uppladdade filer, standard `server/uploads`. Sätt till volymens sökväg i produktion |
| `SEED_DEMO` | nej | `true` ⇒ seeden fyller på med demoinnehåll (endast vid tom databas) |
| `SEED_ADMIN_EPOST` / `SEED_ADMIN_LOSEN` | nej | Överstyr admin-kontot som seeden skapar |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `SMTP_FROM` | nej | Utan dessa körs e-posten i **simulerat läge**: inget skickas, men allt loggas i admin → Inställningar → E-postlogg så att flödena kan verifieras |

## Deploy till Railway

Repot är förberett med flerstegs-`Dockerfile` (bygger klienten, kör servern som icke-root) och `railway.json` (healthcheck `/api/v1/health`).

```bash
railway init -n fallens-fastigheter
railway add --database mongo
railway volume add --mount-path /data          # beständig fillagring
railway variables set \
  MONGODB_URI='${{MongoDB.MONGO_URL}}' \
  JWT_SECRET='<lång slumpad hemlighet>' \
  UPLOAD_DIR=/data/uploads \
  SEED_DEMO=true
railway up
railway domain                                  # skapa publik domän
railway variables set APP_URL=https://<domänen>
```

Verifiera därefter `GET /api/v1/health`, logga in som admin och kontrollera systemstatusen på admin-översikten (självdiagnostiken kör kontroller av databas, fillagring och e-postläge).

## Säkerhet i korthet

- Roller Öppen / Hyresgäst / Admin prövas i middleware på varje skyddad route; portalens dataurval byggs alltid från inloggad användares hyresförhållanden (avslutade behåller läsåtkomst i 90 dagar).
- `/admin` och `/mina-sidor` svarar med `X-Robots-Tag: noindex` och är exkluderade i `robots.txt`; sitemap genereras dynamiskt för publika sidor.
- Publika formulär skyddas av honeypot + hastighetskontroll (träff ⇒ låtsad succé, inget sparas) samt rate-limiting; uppladdningar typ- och storleksfiltreras och bilder normaliseras med Sharp.
- Minst en aktiv administratör kan aldrig inaktiveras (utlåsningsskydd), och hyresgäster kan anonymiseras enligt GDPR-flödet.

## Medvetna avgränsningar

Enligt funktionsspecens fasindelning är fas 3-funktioner (bl.a. meddelandecenter, bokningar, ekonomiintegrationer) inte byggda. Swagger/OpenAPI-dokumentation och separat audit-logg är utelämnade; Winston-loggen och e-postloggen täcker spårbarhetsbehovet i denna leverans. E-post går i simulerat läge tills SMTP-uppgifter anges.
