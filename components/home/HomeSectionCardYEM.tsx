import { HomeSectionCard } from './HomeSectionCard';

type YemEmission = {
  id: string;
  titre: string;
  yem_type: string | null;
  yem_observation: string | null;
};

type HomeSectionCardYEMProps = {
  yem: YemEmission | null;
};

export function HomeSectionCardYEM({
  yem,
}: HomeSectionCardYEMProps) {
  return (
    <HomeSectionCard
      variant="yem"
      sectionLabel="YEM"
      ledColor="purple"
      ledLabel="Section YEM active"
      title="Consulter les observations"
      description="Interface cognitive du réseau. Les observations consignées par YEM accompagnent la conservation des transmissions."
      ctaLabel="Accéder à la mémoire"
      ctaHref="/yem"
      contentLabelledBy="home-yem-content-title"
    >
      <h3 id="home-yem-content-title" className="sr-only">
        Dernière observation enregistrée par YEM
      </h3>

      <article className="homeYemObservation">
        <span
          className="homeYemObservation__material"
          aria-hidden="true"
        />

        <div
          className="homeYemObservation__scan"
          aria-hidden="true"
        />

        <header className="homeYemObservation__header">
          <span>Dernière observation</span>

          {yem ? (
            <span className="homeYemObservation__status">
              <span
                className="homeYemObservation__statusDot"
                aria-hidden="true"
              />
              Mémoire active
            </span>
          ) : null}
        </header>

        {yem ? (
          <>
            <div className="homeYemObservation__identity">
              <span className="homeYemObservation__id">
                {yem.id}
              </span>

              <span className="homeYemObservation__type">
                {yem.yem_type ?? 'Observation'}
              </span>
            </div>

            <blockquote className="homeYemObservation__text">
              {yem.yem_observation}
            </blockquote>

            <footer className="homeYemObservation__footer">
              <span>Transmission associée</span>
              <strong>{yem.titre}</strong>
            </footer>
          </>
        ) : (
          <p className="homeYemObservation__empty">
            Aucune observation disponible.
          </p>
        )}
      </article>
    </HomeSectionCard>
  );
}