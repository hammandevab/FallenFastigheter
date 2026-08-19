import { usePageMeta } from '../../lib/meta.js';
import { pub } from '../../lib/api.js';
import { useAsync, PageSpinner, EmptyState } from '../../components/ui.jsx';
import { PageHeader } from '../../components/layout.jsx';
import { DocumentRow } from '../../components/cards.jsx';

const KAT = { blankett: 'Blanketter', information: 'Information', avtal: 'Avtal', protokoll: 'Protokoll', ovrigt: 'Övrigt' };

export default function DokumentPublik() {
  usePageMeta({
    title: 'Dokument och blanketter | Fallens Fastigheter',
    description: 'Blanketter och dokument att ladda ner – till exempel uppsägning och autogiroanmälan – för dig som hyr hos Fallens Fastigheter.',
  });
  const { data, laddar } = useAsync(() => pub.dokument(), []);
  const grupper = Object.entries((data || []).reduce((acc, d) => {
    (acc[d.kategori] ||= []).push(d);
    return acc;
  }, {}));
  return (
    <>
      <PageHeader rubrik="Dokument" ingress="Blanketter och dokument att ladda ner." />
      <div className="container-site section !pt-8 max-w-3xl">
        {laddar ? <PageSpinner /> : grupper.length === 0 ? (
          <EmptyState rubrik="Inga dokument publicerade ännu"
            text="Behöver du en blankett eller ett dokument redan nu?"
            cta="Kontakta oss så hjälper vi dig" ctaTill="/kontakt" />
        ) : (
          <div className="space-y-10">
            {grupper.map(([kat, dok]) => (
              <section key={kat} aria-labelledby={`dok-${kat}`}>
                <h2 id={`dok-${kat}`} className="h3 mb-4">{KAT[kat] || kat}</h2>
                <ul className="space-y-3">
                  {dok.map((d) => <DocumentRow key={d._id} dok={d} href={`/api/v1/public/dokument/${d._id}/fil`} />)}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
