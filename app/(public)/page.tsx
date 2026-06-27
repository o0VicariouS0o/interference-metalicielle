import { HomeFeaturedPlayer } from '@/components/home/home-featured-player';
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
  audio_url: string | null;
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
    return `/visuels/emissions/paysage/AC Episode ${match[1]}.jpg`;
  }

  if (id === 'IM-HS001') {
    return '/visuels/emissions/paysage/AC Episode HS001.jpg';
  }

  return null;
}

function squareImagePathForEmission(id: string): string | null {
  const match = id.match(/^IM-(\d{3})$/);

  if (match) {
    return `/visuels/emissions/avec-titres/Episode ${match[1]}.jpg`;
  }

  if (id === 'IM-HS001') {
    return '/visuels/emissions/avec-titres/Episode HS001.jpg';
  }

  return null;
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
      <section className="mx-auto max-w-[1440px] px-6 py-16">
        <h1 className="font-display text-3xl">Interférence Metalicielle</h1>

        <p className="mt-6 text-transmission">
          Impossible de déterminer l'émission mise en avant.
        </p>
      </section>
    );
  }

  const featured = featuredData[0] as FeaturedResult;

  const { data: emissionData } = await supabase
    .from('emissions')
    .select('id, titre, description_courte, duree, audio_url')
    .eq('id', featured.emission_id)
    .single();

  const emission = emissionData as Emission | null;
  const recentEmissions = (recentEmissionsData ?? []) as Emission[];
  const yem = yemData as YemEmission | null;

  if (!emission) {
    return (
      <section className="mx-auto max-w-[1440px] px-6 py-16">
        <h1 className="font-display text-3xl">Interférence Metalicielle</h1>

        <p className="mt-6 text-transmission">
          Émission mise en avant introuvable.
        </p>
      </section>
    );
  }

  const visuel = imagePathForEmission(emission.id);

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-16">
      <header>
        <p className="font-mono text-sm uppercase tracking-widest text-transmission">
          Mémoire active du réseau
        </p>

        <h1 className="mt-3 font-display text-5xl">
          Interférence Metalicielle
        </h1>
      </header>

      <section className="mt-10 border border-border bg-black/40 p-6">
        <div className="grid items-start gap-12 desktop:grid-cols-[1.6fr_0.8fr]">
          <div className="aspect-[2/1] overflow-hidden border border-border bg-black">
            {visuel ? (
              <img
                src={visuel}
                alt={emission.titre}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="flex h-full flex-col">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-transmission">
                Émission à la une
              </p>

              <p className="mt-3 font-mono text-lg text-transmission">
                {emission.id}
              </p>

              <h2 className="mt-6 font-display text-7xl leading-none">
                {emission.titre}
              </h2>

              {emission.description_courte ? (
                <p className="mt-8 max-w-xl leading-8 text-muted">
                  {emission.description_courte}
                </p>
              ) : null}

              <div className="mt-10">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Durée
                </p>

                <p className="mt-2 font-mono">{emission.duree ?? '—'}</p>
              </div>
            </div>

            <div className="mt-auto pt-10">
              <HomeFeaturedPlayer audioUrl={emission.audio_url} />
            </div>
          </div>
        </div>
      </section>

     <section className="mt-12 grid gap-6 desktop:grid-cols-3 items-start">
        <div className="flex h-full flex-col border border-transmission/70 bg-black/30 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="border border-transmission px-2 py-1 font-mono text-xs text-transmission">
                  01
                </span>

                <p className="font-mono text-sm uppercase tracking-widest text-transmission">
                  IM
                </p>
              </div>

              <h2 className="mt-3 font-display text-3xl">
                Écouter les transmissions
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                Accédez à la bibliothèque des transmissions. La mémoire sonore du
                Metal se conserve, transmission après transmission.
              </p>
            </div>
            
          </div>
           <div className="flex-1"> 
          <div className="mt-8 border-t border-border pt-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Dernières transmissions
            </p>

            <div className="mt-4 grid gap-3 tablet:grid-cols-4">
              {recentEmissions.map((recent) => {
                const recentVisuel = squareImagePathForEmission(recent.id);

                return (
                  <article
                    key={recent.id}
                    className="border border-border bg-black/40 p-2"
                  >
                    {recentVisuel ? (
                      <img
                        src={recentVisuel}
                        alt={recent.titre}
                        className="aspect-square w-full border border-border object-cover"
                      />
                    ) : null}

                    <p className="mt-3 font-mono text-xs uppercase tracking-widest text-transmission">
                      {recent.id}
                    </p>

                    <h3 className="mt-1 line-clamp-2 font-display text-sm leading-5">
                      {recent.titre}
                    </h3>
                  </article>
                );
              })}
            </div>
          </div>
              </div>
          <a
  href="/im"
  className="mt-6 flex items-center justify-between border border-transmission px-4 py-3 font-mono text-xs uppercase tracking-widest text-transmission hover:bg-transmission hover:text-black"
>
  <span>Accéder à la bibliothèque</span>
  <span>→</span>
</a>
        </div>

        
          <section className="border border-[#2b5f7a] bg-black/30 p-6">
            <div className="flex items-center gap-3">
              <span className="border border-[#2b5f7a] px-2 py-1 font-mono text-xs text-[#6fb7d8]">
                02
              </span>

              <p className="font-mono text-sm uppercase tracking-widest text-[#6fb7d8]">
                NET
              </p>
            </div>

            <h2 className="mt-3 font-display text-3xl">
              Rechercher dans le réseau
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Explorez l'ensemble des données issues des émissions : artistes,
              albums, morceaux et relations documentaires.
            </p>

            <a
              href="/net"
              className="mt-6 flex items-center justify-between border border-border bg-black/40 px-4 py-3 text-left text-sm text-muted hover:border-[#2b5f7a] hover:text-[#6fb7d8]"
            >
              <span>Rechercher un artiste, album, morceau, émission...</span>
              <span className="font-mono text-[#6fb7d8]">⌕</span>
            </a>

            <div className="mt-6 grid grid-cols-2 gap-px border border-border">
              <div className="bg-black/60 p-4">
                <p className="font-display text-4xl">
                  {emissionsCount ?? '—'}
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  émissions
                </p>
              </div>

              <div className="bg-black/60 p-4">
                <p className="font-display text-4xl">
                  {artistesCount ?? '—'}
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  artistes
                </p>
              </div>

              <div className="bg-black/60 p-4">
                <p className="font-display text-4xl">{albumsCount ?? '—'}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  albums
                </p>
              </div>

              <div className="bg-black/60 p-4">
                <p className="font-display text-4xl">{morceauxCount ?? '—'}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
                  morceaux
                </p>
              </div>
            </div>

            <a
              href="/net"
              className="mt-6 flex items-center justify-between border border-[#2b5f7a] px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#6fb7d8] hover:bg-[#2b5f7a] hover:text-black"
            >
              <span>Accéder au moteur de recherche</span>
              <span>→</span>
            </a>
          </section>

          <section className="border border-[#6b3fa0] bg-black/30 p-6">
            <div className="flex items-center gap-3">
              <span className="border border-[#6b3fa0] px-2 py-1 font-mono text-xs text-[#a97be8]">
                03
              </span>

              <p className="font-mono text-sm uppercase tracking-widest text-[#a97be8]">
                YEM
              </p>
            </div>

            <h2 className="mt-3 font-display text-3xl">
              Consulter les observations
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Interface cognitive du réseau. Les observations consignées par YEM
              accompagnent la conservation des transmissions.
            </p>

            <div className="mt-8 border border-border bg-black/40 p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-[#a97be8]">
                Dernière observation
              </p>

              {yem ? (
                <>
                  <p className="mt-3 font-mono text-sm uppercase tracking-widest text-[#a97be8]">
                    {yem.id} — {yem.yem_type ?? 'Observation'}
                  </p>

                  <p className="mt-4 leading-7 text-muted">
                    {yem.yem_observation}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-muted">Aucune observation disponible.</p>
              )}
            </div>

            <div className="mt-6">
  <a
    href="/yem"
    className="flex items-center justify-between border border-[#6b3fa0] px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#a97be8] hover:bg-[#6b3fa0] hover:text-black"
  >
    <span>Accéder à la mémoire</span>
    <span>→</span>
  </a>
</div>
          </section>
        
      </section>

      <footer className="mt-12 border-t border-border pt-6">
        <p className="text-sm text-muted">
          Interférence Metalicielle — en lien avec Radio Pons 97 FM.
        </p>
      </footer>
    </section>
  );
}