import { Link } from 'react-router-dom';
import { Badge } from './ui.jsx';
import { kr, datum, ortNamn, lokaltypNamn, nyhetsKategori, filstorlek, bildUrl } from '../lib/format.js';

/** Bild med "tända fönster"-fallback när bild saknas. */
export function BildYta({ bild, alt = '', className = '' }) {
  const url = bildUrl(bild);
  if (url) return <img src={url} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  return (
    <div className={`flex h-full w-full items-center justify-center bg-secondary ${className}`} aria-hidden="true">
      <svg width="56" height="56" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="7" fill="var(--primary)" opacity="0.12" />
        {[[7,7],[13.5,7],[20,7],[7,13.5],[20,13.5],[7,20],[13.5,20]].map(([x,y]) => (
          <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" rx="1.2" fill="var(--primary)" opacity="0.25" />
        ))}
        <rect x="13.5" y="13.5" width="5" height="5" rx="1.2" fill="var(--accent)" />
        <rect x="20" y="20" width="5" height="5" rx="1.2" fill="var(--accent)" />
      </svg>
    </div>
  );
}

const nyinlagd = (d) => d && (Date.now() - new Date(d).getTime()) < 14 * 24 * 3600 * 1000;

/** Objektkort (§9.5): bild 3:2 med badge, adress, meta, faktarad, hover-lyft. */
export function ObjectCard({ objekt }) {
  const o = objekt;
  const till = `/${o.typ === 'bostad' ? 'bostader' : 'lokaler'}/${o._id}`;
  const fakta = o.typ === 'bostad'
    ? [o.rum && `${o.rum} rum`, o.ytaM2 && `${o.ytaM2} m²`, o.hyraKrMan && kr(o.hyraKrMan)]
    : [o.lokaltyp && lokaltypNamn(o.lokaltyp), o.ytaM2 && `${o.ytaM2} m²`, o.hyraKrMan && kr(o.hyraKrMan)];
  return (
    <Link to={till} className="card card-hover overflow-hidden flex flex-col group">
      <div className="relative aspect-[3/2]">
        <BildYta bild={o.bilder?.[0]} alt={`${o.adress}, ${ortNamn(o.property?.ort)}`} />
        <div className="absolute left-3 top-3 flex gap-2">
          {nyinlagd(o.publiceradDatum) && <Badge color="primary" className="bg-primary text-white">Nyinlagd</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="h3 group-hover:text-primary transition-colors">{o.adress}</h3>
        <p className="mt-1 text-sm text-muted-ink">{ortNamn(o.property?.ort)} · {o.property?.namn}</p>
        <p className="mt-3 flex flex-wrap gap-x-2 text-[15px] font-medium">
          {fakta.filter(Boolean).map((f, i) => <span key={i}>{i > 0 && <span className="text-line mr-2">·</span>}{f}</span>)}
        </p>
        <p className="mt-auto pt-3 text-sm text-muted-ink">
          Tillträde {o.tilltradeDatum ? datum(o.tilltradeDatum) : 'enligt överenskommelse'}
        </p>
      </div>
    </Link>
  );
}

export function PropertyCard({ fastighet }) {
  const f = fastighet;
  return (
    <Link to={`/fastigheter/${f.slug}`} className="card card-hover overflow-hidden flex flex-col group">
      <div className="aspect-[3/2]"><BildYta bild={f.bilder?.[0]} alt={f.namn} /></div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="h3 group-hover:text-primary transition-colors">{f.namn}</h3>
          <Badge color="ort">{ortNamn(f.ort)}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-ink">{f.adress}</p>
        <p className="mt-3 text-[15px] font-medium">{f.antalObjekt ?? 0} objekt · {f.lediga ?? 0} lediga</p>
      </div>
    </Link>
  );
}

const IKONER = {
  ora: <path d="M12 3a7 7 0 0 0-7 7v4l-2 3h18l-2-3v-4a7 7 0 0 0-7-7Zm0 18a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z" />,
  verktyg: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8Z" />,
  kort: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
  fraga: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.8.4-1.2 1-1.2 1.8v.5" /><path d="M12 17h.01" /></>,
  nyckel: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 2 2-2 2 2 2-3 3-2-2-2 2" /></>,
  lada: <><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21V12h6v9" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></>,
  dokument: <><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" /><path d="M14 2v6h6" /></>,
  telefon: <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  pil: <path d="M5 12h14m-6-6 6 6-6 6" />,
  hjart: <path d="M12 21s-7.5-4.6-9.5-9A5.4 5.4 0 0 1 12 6.6 5.4 5.4 0 0 1 21.5 12c-2 4.4-9.5 9-9.5 9Z" />,
  blixt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  puzzel: <path d="M10 3a2 2 0 0 1 4 0v2h4a1 1 0 0 1 1 1v4h-2a2 2 0 0 0 0 4h2v4a1 1 0 0 1-1 1h-4v-2a2 2 0 0 0-4 0v2H6a1 1 0 0 1-1-1v-4H3a1 1 0 0 1 0-4h2V6a1 1 0 0 1 1-1h4V3Z" />,
  hus: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
};
export function Ikon({ namn, storlek = 22, className = '' }) {
  return (
    <svg width={storlek} height={storlek} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {IKONER[namn] || IKONER.info}
    </svg>
  );
}

/** Värdekort (Lyhörda/Drivande/… och B2B-varianten). */
export function ValueCard({ ikon, titel, text }) {
  return (
    <div className="card p-6">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-primary">
        <Ikon namn={ikon} />
      </span>
      <h3 className="h3 mt-4">{titel}</h3>
      <p className="mt-2 text-muted-ink leading-relaxed">{text}</p>
    </div>
  );
}

/** Hubbkort – hela ytan klickbar, hover-lyft + pil. */
export function LinkCard({ till, ikon, titel, text }) {
  return (
    <Link to={till} className="card card-hover p-6 flex flex-col group">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Ikon namn={ikon} />
      </span>
      <h3 className="h3 mt-4 group-hover:text-primary transition-colors">{titel}</h3>
      <p className="mt-1.5 text-muted-ink">{text}</p>
      <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        Öppna <Ikon namn="pil" storlek={16} />
      </span>
    </Link>
  );
}

/** Steglista (inflytt 8, utflytt 6, utvecklingsprocess 3). */
export function StepList({ steg }) {
  return (
    <ol className="relative space-y-6">
      {steg.map((s, i) => (
        <li key={s.titel} className="relative flex gap-4 md:gap-5">
          {i < steg.length - 1 && <span className="absolute left-[19px] top-11 bottom-[-24px] w-px bg-line" aria-hidden="true" />}
          <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-ink font-bold">
            {i + 1}
          </span>
          <div className="card flex-1 p-5">
            <h3 className="h3">{s.titel}</h3>
            <p className="mt-1.5 text-muted-ink leading-relaxed">{s.text}</p>
            {s.extra}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Nyhetsnotis (§4.7.3/§5.6) med kategori-badge och ev. riktningsmarkering. */
export function NewsItem({ post, riktad = false }) {
  const farg = { planerat_arbete: 'ny', driftstorning: 'avvisad', forbattring: 'atgardad', information: 'neutral' }[post.kategori] || 'neutral';
  return (
    <article className="card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={farg}>{nyhetsKategori(post.kategori)}</Badge>
        {riktad && <Badge color="primary">Gäller din fastighet</Badge>}
        <span className="text-sm text-muted-ink">{datum(post.publiceradFran || post.createdAt)}</span>
        {post.property?.namn && <span className="text-sm text-muted-ink">· {post.property.namn}</span>}
      </div>
      <h3 className="h3 mt-3">{post.rubrik}</h3>
      <div className="prose-fallens mt-2 text-muted-ink whitespace-pre-line">{post.brodtext}</div>
    </article>
  );
}

/** Dokumentrad med nedladdning. */
export function DocumentRow({ dok, href }) {
  return (
    <li className="card flex items-center gap-4 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <Ikon namn="dokument" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{dok.titel}</p>
        <p className="mt-0.5 text-sm text-muted-ink truncate">
          {[dok.kategoriNamn || dok.kategori, dok.filtyp?.toUpperCase(), filstorlek(dok.storlek), dok.beskrivning].filter(Boolean).join(' · ')}
        </p>
      </div>
      <a href={href} className="btn-outline btn-sm shrink-0" download>Ladda ner</a>
    </li>
  );
}

/** Tjänstekort (förvaltning) med statusbadge. */
export function ServiceCard({ titel, text, status }) {
  const badge = { aktiv: ['atgardad', 'Aktiv'], uppbyggnad: ['pagaende', 'Under uppbyggnad'], kommande: ['vantar', 'Kommande'] }[status];
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="h3">{titel}</h3>
        <Badge color={badge[0]}>{badge[1]}</Badge>
      </div>
      <p className="mt-2 text-muted-ink leading-relaxed">{text}</p>
    </div>
  );
}

/** Före/efter-projektkort. */
export function ProjectCard({ projekt }) {
  const p = projekt;
  return (
    <article className="card overflow-hidden">
      <div className="grid grid-cols-2">
        {[['Före', p.bilderFore?.[0]], ['Efter', p.bilderEfter?.[0]]].map(([etikett, bild]) => (
          <div key={etikett} className="relative aspect-[4/3]">
            <BildYta bild={bild} alt={`${etikett}: ${p.titel}`} />
            <span className="absolute left-3 top-3 badge bg-ink/75 text-white">{etikett}</span>
          </div>
        ))}
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={p.status === 'genomfort' ? 'atgardad' : 'pagaende'}>{p.status === 'genomfort' ? 'Genomfört' : 'Pågående'}</Badge>
          {p.property?.namn && <span className="text-sm text-muted-ink">{p.property.namn}</span>}
        </div>
        <h3 className="h3 mt-3">{p.titel}</h3>
        <dl className="mt-4 space-y-3 text-[15px]">
          {[['Vad vi identifierade', p.identifierade], ['Vad vi gjorde', p.gjorde], ['Vad resultatet blev', p.resultat]].map(([r, t]) => t && (
            <div key={r}>
              <dt className="font-semibold">{r}</dt>
              <dd className="mt-0.5 text-muted-ink">{t}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
