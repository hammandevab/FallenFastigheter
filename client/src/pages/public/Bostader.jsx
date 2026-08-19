import { usePageMeta } from '../../lib/meta.js';
import { ObjektLista } from './ObjektLista.jsx';

export default function Bostader() {
  usePageMeta({
    title: 'Lediga lägenheter i Trollhättan & Vänersborg | Fallens Fastigheter',
    description: 'Sök bland lediga hyresbostäder hos Fallens Fastigheter i Trollhättan och Vänersborg. Filtrera på ort, antal rum, hyra och tillträde.',
  });
  return (
    <ObjektLista
      typ="bostad"
      rubrik="Lediga bostäder"
      ingress="Trygga hyresrätter hos en hyresvärd som bryr sig – i Trollhättan och Vänersborg."
      filterFalt={[
        ['ort', 'Ort', [['trollhattan', 'Trollhättan'], ['vanersborg', 'Vänersborg']]],
        ['rum', 'Antal rum', [['1', '1 rum'], ['2', '2 rum'], ['3', '3 rum'], ['4', '4 rum'], ['5', '5+ rum']]],
        ['maxhyra', 'Maxhyra (kr/mån)'],
        ['tilltrade', 'Tillträde senast'],
      ]}
      tomRubrik="Inga lediga bostäder just nu"
      tomText="Just nu är alla våra bostäder uthyrda. Anmäl ditt intresse nedan så hör vi av oss när något blir ledigt."
      intresseRubrik="Anmäl intresse"
      intresseKnapp="Skicka intresseanmälan"
      meddelandeLabel="Berätta vad du söker (t.ex. storlek, ort och önskat tillträde)"
    />
  );
}
