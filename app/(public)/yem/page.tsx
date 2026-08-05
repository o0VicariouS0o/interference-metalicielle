import { supabase } from '@/lib/supabase';

type Observation = {
  id: string;
  numero: number | null;
  titre: string;
  yem_type: string | null;
  yem_observation: string | null;
  date_diffusion: string;
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export default async function YemPage() {
  const { data, error } = await supabase
    .from('emissions')
    .select(`
      id,
      numero,
      titre,
      yem_type,
      yem_observation,
      date_diffusion
    `)
    .not('yem_observation', 'is', null)
    .order('date_diffusion', { ascending: false });

  const observations = (data ?? []) as Observation[];

  return (
    <main className="yemPage">
      <section className="yemHero" aria-labelledby="yem-title">
        <img
          className="yemHero__image"
          src="/assets/yem/yem-hero.jpg"
          alt=""
          aria-hidden="true"
        />
        <div className="yemHero__veil" aria-hidden="true" />
        <div className="yemHero__noise" aria-hidden="true" />

        <div className="yemHero__content">
          <p className="yemHero__eyebrow">Gardienne des archives du Metal</p>
          <h1 id="yem-title" className="yemHero__title">YEM</h1>
          <p className="yemHero__intro">
            Chaque semaine, Interférence Métalicielle explore les racines et les
            mutations du metal. Des pionniers obscurs aux distorsions les plus
            extrêmes, suivez YEM, entité glitchée et guide spectral, dans une
            traversée sonore unique.
          </p>
          <p className="yemHero__manifesto">
            Ici, l&apos;histoire du metal ne se raconte pas — elle s&apos;invoque.
          </p>
          <a className="yemHero__anchor" href="#journal-yem">
            Ouvrir le registre <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section id="journal-yem" className="yemJournal">
        <div className="yemJournal__intro">
          <p className="yemJournal__eyebrow">Registre mémoriel</p>
          <h2 className="yemJournal__title">Journal de bord</h2>
          <p className="yemJournal__text">
            YEM observe les transmissions archivées par le réseau. Les fragments
            consignés ici représentent les traces mémorielles détectées au fil
            des émissions.
          </p>
        </div>

        {error ? (
          <div className="yemJournal__message">
            Le registre mémoriel est momentanément inaccessible.
          </div>
        ) : observations.length === 0 ? (
          <div className="yemJournal__message">
            Aucune observation n&apos;a encore été consignée.
          </div>
        ) : (
          <div className="yemJournal__entries">
            {observations.map((observation, index) => (
              <article
                key={observation.id}
                className="yemEntry"
                style={{ ['--yem-entry-index' as string]: String(index) }}
              >
                <img
                  className="yemEntry__frame"
                  src="/assets/yem/yem-register-page.png"
                  alt=""
                  aria-hidden="true"
                />
                <div className="yemEntry__glass" aria-hidden="true" />
                <div className="yemEntry__memoryLine" aria-hidden="true" />

                <div className="yemEntry__content">
                  <header className="yemEntry__header">
                    <div>
                      <p className="yemEntry__type">
                        {observation.yem_type ?? 'Observation'}
                      </p>
                      <p className="yemEntry__id">{observation.id}</p>
                    </div>
                    <time
                      className="yemEntry__date"
                      dateTime={observation.date_diffusion}
                    >
                      {formatDate(observation.date_diffusion)}
                    </time>
                  </header>

                  <h3 className="yemEntry__title">{observation.titre}</h3>
                  <blockquote className="yemEntry__text">
                    {observation.yem_observation}
                  </blockquote>

                  <footer className="yemEntry__footer">
                    <span>Observation enregistrée</span>
                    <a href={`/im?e=${encodeURIComponent(observation.id)}`}>
                      Consulter la transmission <span aria-hidden="true">→</span>
                    </a>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
