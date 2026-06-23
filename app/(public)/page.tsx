import { supabase } from '@/lib/supabase';

type FeaturedResult = {
  emission_id: string;
  source: string;
};

type Emission = {
  id: string;
  titre: string;
  description_courte: string | null;
  duree: string | null;
};

type YemEmission = {
  id: string;
  titre: string;
  yem_type: string | null;
  yem_observation: string | null;
};

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

function formatSource(source: string): string {
  return source === 'manual' ? 'Sélection éditoriale' : 'Rotation automatique';
}

export default async function AccueilPage() {
  const { data: featuredData, error: featuredError } = await supabase.rpc(
    'get_home_featured_emission',
  );

  const { data: recentEmissionsData } = await supabase
    .from('emissions')
    .select('id, titre, description_courte, duree')
    .order('date_diffusion', { ascending: false })
    .limit(4);

  const { count: emissionsCount } = await supabase
    .from('emissions')
    .select('*', { count: 'exact', head: true });

  const { count: artistesCount } = await supabase
    .from('artistes')
    .select('*', { count: 'exact', head: true });

  const { count: albumsCount } = await supabase
    .from('albums')
    .select('*', { count: 'exact', head: true });

  const { count: morceauxCount } = await supabase
    .from('morceaux')
    .select('*', { count: 'exact', head: true });

  const { data: yemData } = await supabase
    .from('emissions')
    .select('id, titre, yem_type, yem_observation')
    .not('yem_observation', 'is', null)
    .order('date_diffusion', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (featuredError || !featuredData?.length) {
    return (
      <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
        <h1 className="font-display text-3xl">Interférence Métalicielle</h1>

        <p className="mt-6 text-transmission">
          Impossible de déterminer l'émission mise en avant.
        </p>
      </section>
    );
  }

  const featured = featuredData[0] as FeaturedResult;

  const { data: emissionData } = await supabase
    .from('emissions')
    .select('id, titre, description_courte, duree')
    .eq('id', featured.emission_id)
    .single();

  const emission = emissionData as Emission | null;
  const recentEmissions = (recentEmissionsData ?? []) as Emission[];
  const yem = yemData as YemEmission | null;

  if (!emission) {
    return (
      <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
        <h1 className="font-display text-3xl">Interférence Métalicielle</h1>

        <p className="mt-6 text-transmission">
          Émission mise en avant introuvable.
        </p>
      </section>
    );
  }

  const visuel = imagePathForEmission(emission.id);

  return (
    <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
      <header>
        <p className="font-mono text-sm uppercase tracking-widest text-transmission">
          Mémoire active du réseau
        </p>

        <h1 className="mt-3 font-display text-5xl">
          Interférence Métalicielle
        </h1>
      </header>

      <section className="mt-10 border border-border p-6">
        <div className="grid gap-8 desktop:grid-cols-[480px_1fr]">
          <div>
            {visuel ? (
              <img
                src={visuel}
                alt={emission.titre}
                className="w-full border border-border"
              />
            ) : null}
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-mono text-sm uppercase tracking-widest text-transmission">
              Émission à la une — {emission.id}
            </p>

            <h2 className="mt-3 font-display text-5xl">{emission.titre}</h2>

            {emission.description_courte ? (
              <p className="mt-6 max-w-2xl leading-8 text-muted">
                {emission.description_courte}
              </p>
            ) : null}

            <div className="mt-8 flex items-center gap-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Durée
                </p>

                <p className="mt-2 font-mono">{emission.duree ?? '—'}</p>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Mise en avant
                </p>

                <p className="mt-2 font-mono">{formatSource(featured.source)}</p>
              </div>
            </div>

            <a
              href="/im"
              className="mt-10 inline-flex w-fit border border-transmission px-6 py-3 font-mono text-sm uppercase tracking-widest text-transmission hover:bg-transmission hover:text-black"
            >
              Accéder à IM
            </a>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 desktop:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-border p-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-sm uppercase tracking-widest text-muted">
                IM
              </p>
              <h2 className="mt-2 font-display text-3xl">
                Dernières transmissions
              </h2>
            </div>

            <a
              href="/im"
              className="font-mono text-xs uppercase tracking-widest text-transmission hover:underline"
            >
              Catalogue complet
            </a>
          </div>

          <div className="mt-6 grid gap-4 tablet:grid-cols-2">
            {recentEmissions.map((recent) => {
              const recentVisuel = imagePathForEmission(recent.id);

              return (
                <article key={recent.id} className="border border-border p-4">
                  {recentVisuel ? (
                    <img
                      src={recentVisuel}
                      alt={recent.titre}
                      className="aspect-square w-full border border-border object-cover"
                    />
                  ) : null}

                  <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted">
                    {recent.id}
                  </p>

                  <h3 className="mt-2 font-display text-xl">{recent.titre}</h3>

                  {recent.duree ? (
                    <p className="mt-2 font-mono text-sm text-muted">
                      {recent.duree}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <section className="border border-border p-6">
            <p className="font-mono text-sm uppercase tracking-widest text-muted">
              NET
            </p>

            <h2 className="mt-2 font-display text-3xl">Réseau documentaire</h2>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="font-display text-3xl">{emissionsCount ?? '—'}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  émissions
                </p>
              </div>

              <div>
                <p className="font-display text-3xl">{artistesCount ?? '—'}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  artistes
                </p>
              </div>

              <div>
                <p className="font-display text-3xl">{albumsCount ?? '—'}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  albums
                </p>
              </div>

              <div>
                <p className="font-display text-3xl">{morceauxCount ?? '—'}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  morceaux
                </p>
              </div>
            </div>

            <a
              href="/net"
              className="mt-8 inline-flex border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:border-transmission hover:text-transmission"
            >
              Explorer NET
            </a>
          </section>

          <section className="border border-border p-6">
            <p className="font-mono text-sm uppercase tracking-widest text-muted">
              YEM
            </p>

            <h2 className="mt-2 font-display text-3xl">Mémoire observée</h2>

            {yem ? (
              <>
                <p className="mt-4 font-mono text-xs uppercase tracking-widest text-transmission">
                  {yem.id} — {yem.yem_type ?? 'Observation'}
                </p>

                <blockquote className="mt-4 leading-7 text-muted">
                  {yem.yem_observation}
                </blockquote>
              </>
            ) : (
              <p className="mt-4 text-muted">Aucune observation disponible.</p>
            )}

            <a
              href="/yem"
              className="mt-8 inline-flex border border-transmission px-4 py-2 font-mono text-xs uppercase tracking-widest text-transmission hover:bg-transmission hover:text-black"
            >
              Accéder à la mémoire
            </a>
          </section>
        </div>
      </section>

      <footer className="mt-12 border-t border-border pt-6">
        <p className="text-sm text-muted">
          Interférence Métalicielle — en lien avec Radio Pons 97 FM.
        </p>
      </footer>
    </section>
  );
}