import { supabase } from '@/lib/supabase';

type Emission = {
  id: string;
  titre: string;
  date_diffusion: string;
  duree: string | null;
};

type PaysCount = {
  pays_id: number;
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

export default async function NetPage() {
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

  const { data: paysData } = await supabase
    .from('artistes')
    .select('pays_id')
    .not('pays_id', 'is', null);

  const territoiresCount = new Set(
    ((paysData ?? []) as PaysCount[]).map((item) => item.pays_id),
  ).size;

  const { data: emissionsData } = await supabase
    .from('emissions')
    .select('id, titre, date_diffusion, duree')
    .order('date_diffusion', { ascending: false })
    .limit(4);

  const recentEmissions = (emissionsData ?? []) as Emission[];

  return (
    <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
      <header>
        <p className="font-mono text-sm uppercase tracking-widest text-transmission">
          NET
        </p>

        <h1 className="mt-3 font-display text-5xl">
          Cartographie documentaire du réseau
        </h1>

        <p className="mt-6 max-w-2xl leading-7 text-muted">
          Explorer les relations présentes dans les transmissions.
        </p>
      </header>

      <section className="relative mt-10 min-h-[520px] overflow-hidden border border-border bg-black p-8">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[radial-gradient(circle_at_18%_45%,rgba(255,42,24,0.45),transparent_12%),radial-gradient(circle_at_42%_30%,rgba(255,138,42,0.28),transparent_14%),radial-gradient(circle_at_67%_58%,rgba(255,42,24,0.35),transparent_13%),radial-gradient(circle_at_82%_36%,rgba(255,138,42,0.22),transparent_12%)]" />
        </div>

        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative z-10 flex min-h-[460px] flex-col justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-transmission">
              Carte documentaire
            </p>

            <h2 className="mt-4 max-w-3xl font-display text-5xl">
              {territoiresCount || '—'} territoires documentés
            </h2>

            <p className="mt-6 max-w-2xl leading-7 text-muted">
              Vue globale des territoires représentés dans le catalogue.
              Cette carte matérialise les zones d'origine des artistes présents
              dans les transmissions.
            </p>
          </div>

          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-5">
            <div className="border border-border bg-black/60 p-4">
              <p className="font-display text-3xl">{emissionsCount ?? '—'}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
                émissions
              </p>
            </div>

            <div className="border border-border bg-black/60 p-4">
              <p className="font-display text-3xl">{artistesCount ?? '—'}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
                artistes
              </p>
            </div>

            <div className="border border-border bg-black/60 p-4">
              <p className="font-display text-3xl">{albumsCount ?? '—'}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
                albums
              </p>
            </div>

            <div className="border border-border bg-black/60 p-4">
              <p className="font-display text-3xl">{morceauxCount ?? '—'}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
                morceaux
              </p>
            </div>

            <div className="border border-border bg-black/60 p-4">
              <p className="font-display text-3xl">{territoiresCount || '—'}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
                territoires
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 border border-border p-6">
        <div className="grid gap-4 desktop:grid-cols-[1fr_auto]">
          <label>
            <span className="font-mono text-sm uppercase tracking-widest text-transmission">
              Explorer le réseau
            </span>

            <input
              type="search"
              placeholder="Rechercher un artiste, album, morceau, tag ou émission..."
              className="mt-4 w-full border border-border bg-black px-4 py-3 text-sm text-neutral-100 placeholder:text-muted"
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            {['Artiste', 'Album', 'Morceau', 'Tag', 'Émission'].map((filter) => (
              <button
                key={filter}
                type="button"
                className="border border-border px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 desktop:grid-cols-[1fr_0.8fr_1.4fr]">
        <article className="border border-border p-6">
          <p className="font-mono text-sm uppercase tracking-widest text-transmission">
            Relations documentaires
          </p>

          <div className="mt-8 space-y-4">
            <div className="border border-transmission p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-transmission">
                Artiste
              </p>
              <p className="mt-2">Sélection à venir</p>
            </div>

            <div className="border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Album
              </p>
              <p className="mt-2 text-muted">Relations à charger</p>
            </div>

            <div className="border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Morceau
              </p>
              <p className="mt-2 text-muted">Relations à charger</p>
            </div>

            <div className="border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Transmission
              </p>
              <p className="mt-2 text-muted">Relations à charger</p>
            </div>
          </div>
        </article>

        <article className="border border-border p-6">
          <p className="font-mono text-sm uppercase tracking-widest text-transmission">
            Résultats
          </p>

          <h2 className="mt-6 font-display text-3xl">Réseau en attente</h2>

          <p className="mt-4 leading-7 text-muted">
            La recherche documentaire reliera artistes, albums, morceaux,
            territoires et transmissions.
          </p>

          <div className="mt-8 space-y-3 text-sm text-muted">
            <p>{artistesCount ?? '—'} artistes présents dans le catalogue.</p>
            <p>{albumsCount ?? '—'} albums référencés.</p>
            <p>{morceauxCount ?? '—'} morceaux indexés.</p>
          </div>
        </article>

        <article className="border border-border p-6">
          <p className="font-mono text-sm uppercase tracking-widest text-transmission">
            Émissions associées
          </p>

          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
            4 transmissions récentes
          </p>

          <div className="mt-6 grid gap-4 tablet:grid-cols-2">
            {recentEmissions.map((emission) => {
              const visuel = imagePathForEmission(emission.id);

              return (
                <article key={emission.id} className="border border-border p-4">
                  {visuel ? (
                    <img
                      src={visuel}
                      alt={emission.titre}
                      className="aspect-square w-full border border-border object-cover"
                    />
                  ) : null}

                  <p className="mt-4 font-mono text-xs uppercase tracking-widest text-transmission">
                    {emission.id}
                  </p>

                  <h3 className="mt-2 font-display text-xl">
                    {emission.titre}
                  </h3>

                  {emission.duree ? (
                    <p className="mt-3 font-mono text-xs text-muted">
                      Durée : {emission.duree}
                    </p>
                  ) : null}

                  <a
                    href="/im"
                    className="mt-4 inline-flex font-mono text-xs uppercase tracking-widest text-transmission hover:underline"
                  >
                    Accéder à la transmission
                  </a>
                </article>
              );
            })}
          </div>
        </article>
      </section>

      <footer className="mt-12 border-t border-border pt-6">
        <p className="text-sm text-muted">
          Interférence Métalicielle — NET — cartographie documentaire du réseau.
        </p>
      </footer>
    </section>
  );
}