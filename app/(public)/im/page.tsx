import { LecteurIM } from '@/components/im/lecteur-im';
import { supabase } from '@/lib/supabase';

type Emission = {
  id: string;
  titre: string;
  date_diffusion: string;
  description: string | null;
  description_courte: string | null;
  description_longue: string | null;
  yem_observation: string | null;
  yem_type: string | null;
  duree: string | null;
  playlist_pdf_path: string | null;
};

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function excerpt(text: string | null, maxLength = 180): string {
  if (!text) return '';

  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxLength) return clean;

  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return `${lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated}…`;
}

export default async function ImPage() {
  const { data, error } = await supabase
    .from('emissions')
    .select(
  'id, titre, date_diffusion, description, description_courte, description_longue, yem_observation, yem_type, duree, playlist_pdf_path',
  )
    .order('date_diffusion', { ascending: false });

  if (error) {
    return (
      <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
        <h1 className="font-display text-3xl">IM</h1>
        <p className="mt-8 border border-transmission p-4 text-sm text-transmission">
          Erreur de chargement des émissions : {error.message}
        </p>
      </section>
    );
  }

  const emissions = (data ?? []) as Emission[];
  const [featured, ...others] = emissions;

  return (
    <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
      <header>
        <p className="font-mono text-sm uppercase tracking-widest text-transmission">
          Transmissions
        </p>
        <h1 className="mt-3 font-display text-3xl">Interférence Métalicielle</h1>
        <p className="mt-4 text-muted">
          {emissions.length} émissions importées depuis les archives.
        </p>
      </header>

      <div className="mt-10">
        {featured ? (
          <LecteurIM emission={featured} />
        ) : (
          <p className="text-muted">Aucune émission disponible.</p>
        )}
      </div>

{featured?.description_longue ? (
  <section className="mt-8 border border-border p-6">
    <h2 className="font-mono text-sm uppercase tracking-widest text-transmission">
      Description de l'émission
    </h2>
    <div className="mt-6 whitespace-pre-line leading-7 text-muted">
      {featured.description_longue}
    </div>
  </section>
) : null}

{featured?.yem_observation ? (
  <section className="mt-6 border border-border p-6">
    <p className="font-mono text-sm uppercase tracking-widest text-transmission">
      Observation YEM
      {featured.yem_type ? ` — ${featured.yem_type}` : ''}
    </p>
    <blockquote className="mt-6 text-lg leading-8 text-muted">
      {featured.yem_observation}
    </blockquote>
  </section>
) : null}

      {others.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-mono text-sm uppercase tracking-widest text-muted">
            Archives
          </h2>

          <div className="mt-4 divide-y divide-border border-y border-border">
            {others.map((emission) => (
              <article key={emission.id} className="py-5">
                <p className="font-mono text-xs text-muted">{emission.id}</p>
                <h3 className="mt-2 font-display text-xl">{emission.titre}</h3>
                <p className="mt-1 text-sm text-muted">
                  {formatDateFr(emission.date_diffusion)}
                </p>
                {emission.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {excerpt(emission.description, 220)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}