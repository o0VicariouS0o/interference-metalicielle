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

function imagePathForEmission(id: string): string | null {
  const match = id.match(/^IM-(\d{3})$/);

  if (match) {
    return `/visuels/emissions/avec-titres/Episode ${match[1]}.jpg`;
  }

  if (id === 'IM-HS001') {
    return '/visuels/emissions/avec-titres/Episode HS001.jpg';
  }

  return null;
}
function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

function formatStats(titres: number, groupes: number, pays: number): string {
  return `${titres} ${pluralize(titres, 'titre', 'titres')} · ${groupes} ${pluralize(groupes, 'groupe', 'groupes')} · ${pays} ${pluralize(pays, 'pays', 'pays')}`;
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

  const emissionIds = emissions.map((emission) => emission.id);

  const { data: morceauxPage1 } = await supabase
    .from('morceaux')
    .select('emission_id, artiste_id')
    .in('emission_id', emissionIds)
    .range(0, 999);

  const { data: morceauxPage2 } = await supabase
    .from('morceaux')
    .select('emission_id, artiste_id')
    .in('emission_id', emissionIds)
    .range(1000, 1999);

  const morceauxData = [
    ...(morceauxPage1 ?? []),
    ...(morceauxPage2 ?? []),
  ];

  const artisteIds = Array.from(
    new Set(
      morceauxData
        .map((morceau) => morceau.artiste_id)
        .filter((id): id is number => id !== null),
    ),
  );

  const { data: artistesData } = await supabase
    .from('artistes')
    .select('id, pays_id')
    .in('id', artisteIds);

  const paysByArtiste = new Map<number, number | null>();

  for (const artiste of artistesData ?? []) {
    paysByArtiste.set(artiste.id, artiste.pays_id);
  }

  const statsByEmission = new Map<
    string,
    { titres: number; artistes: Set<number>; pays: Set<number> }
  >();

  for (const morceau of morceauxData) {
    const current = statsByEmission.get(morceau.emission_id) ?? {
      titres: 0,
      artistes: new Set<number>(),
      pays: new Set<number>(),
    };

    current.titres += 1;

    if (morceau.artiste_id !== null) {
      current.artistes.add(morceau.artiste_id);

      const paysId = paysByArtiste.get(morceau.artiste_id);
      if (paysId !== null && paysId !== undefined) {
        current.pays.add(paysId);
      }
    }

    statsByEmission.set(morceau.emission_id, current);
  }

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
          <LecteurIM
  emission={{
    ...featured,
    stats: statsByEmission.get(featured.id)
      ? {
          titres: statsByEmission.get(featured.id)?.titres ?? 0,
          groupes: statsByEmission.get(featured.id)?.artistes.size ?? 0,
          pays: statsByEmission.get(featured.id)?.pays.size ?? 0,
        }
      : undefined,
  }}
/>
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
            {others.map((emission) => {
  const visuel = imagePathForEmission(emission.id);

  return (
    <article
      key={emission.id}
      className="flex items-center justify-between gap-6 py-5"
    >
      <div className="flex items-center gap-4">
        {visuel ? (
          <img
            src={visuel}
            alt={`Visuel ${emission.id}`}
            className="h-24 w-24 shrink-0 object-cover border border-border"
          />
        ) : null}

        <div>
          <p className="font-mono text-xs text-muted">
            {emission.id}
          </p>

          <h3 className="mt-1 font-display text-xl">
            {emission.titre}
          </h3>
          {statsByEmission.get(emission.id) ? (
  <p className="mt-2 text-sm text-muted">
    {formatStats(
  statsByEmission.get(emission.id)?.titres ?? 0,
  statsByEmission.get(emission.id)?.artistes.size ?? 0,
  statsByEmission.get(emission.id)?.pays.size ?? 0,
)}
  </p>
) : null}
        </div>
      </div>

      {emission.playlist_pdf_path ? (
        <a
          href={emission.playlist_pdf_path}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 border border-border px-4 py-2 text-sm hover:border-transmission hover:text-transmission"
        >
          Playlist
        </a>
      ) : (
        <span className="text-sm text-muted">—</span>
      )}
    </article>
  );
})}
           
          </div>
        </section>
      ) : null}
    </section>
  );
}