import { usePageMeta } from '../../lib/meta.js';
import { ObjektLista } from './ObjektLista.jsx';

export default function Lokaler() {
  usePageMeta({
    title: 'Lediga lokaler i Trollhättan & Vänersborg | Fallens Fastigheter',
    description: 'Kontor, butik, lager eller verkstad – Fallens Fastigheter hyr ut flexibla lokaler i Trollhättan och Vänersborg och försöker hitta lösningar.',
  });
  return (
    <ObjektLista
      typ="lokal"
      rubrik="Lediga lokaler"
      ingress="Kontor, butik, lager eller verkstad – vi försöker hitta lösningar för din verksamhet."
      filterFalt={[
        ['ort', 'Ort', [['trollhattan', 'Trollhättan'], ['vanersborg', 'Vänersborg']]],
        ['lokaltyp', 'Typ', [['kontor', 'Kontor'], ['butik', 'Butik'], ['lager', 'Lager'], ['verkstad', 'Verkstad'], ['ovrigt', 'Övrigt']]],
        ['minyta', 'Minsta yta (m²)'],
        ['tilltrade', 'Tillträde senast'],
      ]}
      tomRubrik="Inga lediga lokaler just nu"
      tomText="Berätta vad du söker – vi återkommer när rätt lokal dyker upp eller kan skapas."
      intresseRubrik="Berätta vad du söker"
      intresseKnapp="Skicka intresseanmälan"
      meddelandeLabel="Beskriv din verksamhet och vad du behöver (yta, typ av lokal, ort)"
    />
  );
}
