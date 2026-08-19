import { usePageMeta } from '../../lib/meta.js';
import { pub } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState, SectionHeading } from '../../components/ui.jsx';
import { PageHeader } from '../../components/layout.jsx';
import { StepList, ProjectCard } from '../../components/cards.jsx';

const PROCESS = [
  { titel: 'Vi identifierar', text: 'Vi går igenom våra fastigheter och hittar förbättringsmöjligheter – outnyttjade ytor, slitna miljöer, lokaler med potential.' },
  { titel: 'Vi genomför', text: 'Vi planerar och utför förbättringen med minsta möjliga störning för de som bor och verkar i huset.' },
  { titel: 'Vi följer upp', text: 'Vi utvärderar resultatet – för hyresgästerna och för fastighetens värde – och lär oss till nästa projekt.' },
];

export default function Utveckling() {
  usePageMeta({
    title: 'Vi utvecklar våra fastigheter | Fallens Fastigheter',
    description: 'Outnyttjade ytor blir nya förråd, gårdsmiljöer förbättras och lokaler utvecklas. Så arbetar Fallens Fastigheter med fastighetsutveckling.',
  });
  const { data, laddar } = useAsync(() => pub.utveckling(), []);
  return (
    <>
      <PageHeader rubrik="Vi nöjer oss inte med att förvalta"
        ingress="Outnyttjade ytor blir nya förråd, gårdsmiljöer förbättras och lokaler utvecklas. Här visar vi hur vi arbetar – och vad det leder till." />
      <div className="container-site section !pt-10 max-w-3xl">
        <SectionHeading overline="Vår process" rubrik="Tre steg – om och om igen" />
        <StepList steg={PROCESS} />
      </div>
      <div className="bg-muted/60">
        <div className="container-site section">
          <SectionHeading overline="Före och efter" rubrik="Projekt vi genomfört och driver"
            ingress="Verkliga exempel från våra fastigheter – vad vi såg, vad vi gjorde och vad det blev." />
          {laddar ? <PageSpinner /> : !data?.length ? (
            <EmptyState rubrik="Inga projekt publicerade ännu"
              text="Vi arbetar ständigt med förbättringar – de första projekten publiceras här inom kort."
              cta="Kontakta oss" ctaTill="/kontakt" />
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {data.map((p) => <ProjectCard key={p._id} projekt={p} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
