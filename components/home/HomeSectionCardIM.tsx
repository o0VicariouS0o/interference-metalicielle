import Image from 'next/image';
import { HomeSectionCard } from './HomeSectionCard';
import { HomeTransmissionMiniCard } from './HomeTransmissionMiniCard';

type RecentEmission = {
  id: string;
  titre: string;
};

type HomeSectionCardIMProps = {
  recentEmissions: RecentEmission[];
};

function squareImagePathForEmission(id: string): string | null {
  const standardMatch = id.match(/^IM-(\d{3})$/);

  if (standardMatch) {
    return `/visuels/emissions/avec-titres/Episode ${standardMatch[1]}.jpg`;
  }

  if (id === 'IM-HS001') {
    return '/visuels/emissions/avec-titres/Episode HS001.jpg';
  }

  return null;
}

export function HomeSectionCardIM({
  recentEmissions,
}: HomeSectionCardIMProps) {
  return (
    <HomeSectionCard
      variant="im"
      sectionLabel="IM"
      ledColor="red"
      ledLabel="Section IM active"
      title="Écouter les transmissions"
      description="Accédez à la bibliothèque des transmissions. La mémoire sonore du Metal se conserve, transmission après transmission."
      ctaLabel="Accéder à la bibliothèque"
      ctaHref="/im"
      contentLabelledBy="home-im-recent-title"
    >
      <h3
        id="home-im-recent-title"
        className="homeSectionCard__contentTitle"
      >
        Dernières transmissions
      </h3>

      <div className="homeSectionCard__transmissions">
        {recentEmissions.map((emission) => (
          <HomeTransmissionMiniCard
            key={emission.id}
            id={emission.id}
            title={emission.titre}
            imageSrc={squareImagePathForEmission(emission.id)}
          />
        ))}
      </div>

      <div
        className="homeImBroadcast"
        aria-label="Canal de diffusion du réseau IM actif"
      >
        <div className="homeImBroadcast__visual" aria-hidden="true">
          <span className="homeImBroadcast__pulse homeImBroadcast__pulse--one" />
          <span className="homeImBroadcast__pulse homeImBroadcast__pulse--two" />

          <Image
            src="/assets/svg/common/A-022_TransmissionRadar.svg"
            alt=""
            width={118}
            height={118}
            className="homeImBroadcast__radar"
          />
        </div>

        <div className="homeImBroadcast__content">
          <div className="homeImBroadcast__topline">
            <span className="homeImBroadcast__statusDot" aria-hidden="true" />
            <span>Canal de diffusion</span>
          </div>

          <strong className="homeImBroadcast__state">
            Transmission active
          </strong>

          <p className="homeImBroadcast__description">
            Signal actuellement diffusé dans le réseau IM.
          </p>

          <div className="homeImBroadcast__footer">
            <span>Canal IM</span>
            <span>Signal stable</span>
          </div>
        </div>
      </div>
    </HomeSectionCard>
  );
}