import { HomeFeaturedPlayer } from '@/components/home/home-featured-player';

type HomeHeroProps = {
  emission: {
    id: string;
    titre: string;
    description_courte: string | null;
    duree: string | null;
    audio_url: string | null;
  };
  visuel: string | null;
};

export function HomeHero({ emission, visuel }: HomeHeroProps) {
  return (
    <section
      className="homeHero"
      aria-labelledby="home-hero-title"
    >
      <div className="homeHero__artwork">
        {visuel ? (
          <img
            src={visuel}
            alt={emission.titre}
            className="homeHero__image"
          />
        ) : (
          <div
            className="homeHero__imageFallback"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="homeHero__content">
        <div className="homeHero__topline">
          <span>Émission à la une</span>

          <span className="homeHero__identifier">
            Identifiant&nbsp;: {emission.id}
          </span>
        </div>

        <p className="homeHero__id">{emission.id}</p>

        <h1
          id="home-hero-title"
          className="homeHero__title"
        >
          {emission.titre}
        </h1>

        {emission.description_courte ? (
          <p className="homeHero__description">
            {emission.description_courte}
          </p>
        ) : null}

        <div className="homeHero__player">
          <HomeFeaturedPlayer
            audioUrl={emission.audio_url}
            durationLabel={emission.duree}
          />
        </div>

        <div className="homeHero__metadata">
          <div className="homeHero__metadataItem">
            <span>Catégorie</span>
            <strong>Thématique</strong>
          </div>

          <div className="homeHero__metadataItem">
            <span>Niveau d’intégrité</span>
            <strong>100%</strong>
          </div>

          <div className="homeHero__metadataItem">
            <span>Statut</span>
            <strong>Disponible</strong>
          </div>
        </div>

        <a className="homeHero__cta" href="/im">
          <span>Accéder à IM</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
