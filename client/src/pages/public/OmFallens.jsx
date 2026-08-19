import { Link } from 'react-router-dom';
import { usePageMeta } from '../../lib/meta.js';
import { PageHeader } from '../../components/layout.jsx';
import { Ikon } from '../../components/cards.jsx';

export default function OmFallens() {
  usePageMeta({
    title: 'Om Fallens Fastigheter – lokal fastighetsägare i Trollhättan',
    description: 'Fallens Fastigheter äger, utvecklar och förvaltar hyresfastigheter i Trollhättan och Vänersborg – med aktivt ägarskap, närhet och närvaro.',
  });
  const punkter = [
    'Bostadsuthyrning i Trollhättan och Vänersborg',
    'Lokaluthyrning – kontor, butik, lager och verkstad',
    'Förvaltning av egna fastigheter, varje dag',
    'Löpande förbättringar och utvecklingsprojekt',
    'Extern förvaltning för andra fastighetsägare',
  ];
  return (
    <>
      <PageHeader rubrik="Vi ser möjligheterna."
        ingress="Fallens Fastigheter är en lokal fastighetsägare som äger, utvecklar och förvaltar hyresfastigheter i Trollhättan och Vänersborg." />
      <div className="container-site section !pt-8 max-w-3xl">
        <div className="prose-fallens text-[17px]">
          <p>
            Vi tror på aktivt ägarskap. Det betyder att vi finns nära våra hus, känner våra hyresgäster och
            hela tiden letar efter sätt att göra fastigheterna bättre – inte bara underhålla dem.
          </p>
          <p>
            Närhet och närvaro är inte bara ord för oss. Vi är ett lokalt bolag med korta beslutsvägar:
            den du pratar med är ofta samma person som löser ditt ärende.
          </p>
        </div>
        <h2 className="h3 mt-10 mb-4">Det här gör vi</h2>
        <ul className="space-y-3">
          {punkter.map((t) => (
            <li key={t} className="flex gap-3">
              <Ikon namn="hus" className="mt-0.5 shrink-0 text-accent" storlek={20} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/om-fallens/sa-arbetar-vi" className="btn-primary">Så arbetar vi</Link>
          <Link to="/utveckling" className="btn-outline">Vi utvecklar</Link>
        </div>
      </div>
    </>
  );
}
