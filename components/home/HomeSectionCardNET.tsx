import { HomeNetSignal } from './HomeNetSignal';
import { HomeSectionCard } from './HomeSectionCard';

type HomeSectionCardNETProps = {
  emissionsCount: number | null;
  artistesCount: number | null;
  albumsCount: number | null;
  morceauxCount: number | null;
};

type NetworkStatProps = {
  value: number | null;
  label: string;
};

function NetworkStat({ value, label }: NetworkStatProps) {
  return (
    <div className="homeNetworkStat">
      <strong>{value ?? '—'}</strong>
      <span>{label}</span>
    </div>
  );
}

export function HomeSectionCardNET({
  emissionsCount,
  artistesCount,
  albumsCount,
  morceauxCount,
}: HomeSectionCardNETProps) {
  return (
    <HomeSectionCard
      variant="net"
      sectionLabel="NET"
      ledColor="blue"
      ledLabel="Section NET active"
      title="Rechercher dans le réseau"
      description="Explorez l’ensemble des données issues des émissions : artistes, albums, morceaux et relations documentaires."
      ctaLabel="Accéder au moteur de recherche"
      ctaHref="/net"
      contentLabelledBy="home-net-content-title"
    >
      <h3
        id="home-net-content-title"
        className="sr-only"
      >
        Aperçu et statistiques du réseau
      </h3>

      <HomeNetSignal />

      <div className="homeNetworkStats">
        <NetworkStat
          value={emissionsCount}
          label="Émissions"
        />

        <NetworkStat
          value={artistesCount}
          label="Artistes"
        />

        <NetworkStat
          value={albumsCount}
          label="Albums"
        />

        <NetworkStat
          value={morceauxCount}
          label="Morceaux"
        />
      </div>
    </HomeSectionCard>
  );
}