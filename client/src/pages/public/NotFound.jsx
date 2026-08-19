import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';

export default function NotFound() {
  usePageMeta({ title: 'Sidan hittades inte | Fallens Fastigheter', noindex: true });
  const genvagar = [['Lediga bostäder', '/bostader'], ['Lediga lokaler', '/lokaler'], ['Felanmälan', '/felanmalan'], ['Kontakt', '/kontakt']];
  return (
    <div className="container-site section text-center">
      <p className="overline-badge justify-center">404</p>
      <h1 className="h1 mt-3">Här fanns inga möjligheter.</h1>
      <p className="ingress mx-auto mt-4 max-w-xl">Sidan du letar efter finns inte – men det gör mycket annat. Prova någon av genvägarna nedan.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {genvagar.map(([namn, till]) => <Link key={till} to={till} className="btn-outline">{namn}</Link>)}
      </div>
      <Link to="/" className="btn-primary mt-6 inline-flex">Till startsidan</Link>
    </div>
  );
}
