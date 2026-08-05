import { NetClient } from '@/components/net/net-client';
import { supabase } from '@/lib/supabase';

type Artiste = {
  id: number;
  nom: string;
  pays_id: number | null;
  ville_region: string | null;
};

type Album = {
  id: number;
  titre: string;
  artiste_id: number | null;
};

type Morceau = {
  id: number;
  titre: string;
  artiste_id: number | null;
  album_id: number | null;
  emission_id: string;
};

type Emission = {
  id: string;
  titre: string;
  date_diffusion: string;
  duree: string | null;
};

type Pays = {
  id: number;
  nom: string;
};

async function loadMorceaux(): Promise<Morceau[]> {
  const pages = await Promise.all([
    supabase
      .from('morceaux')
      .select('id, titre, artiste_id, album_id, emission_id')
      .range(0, 999),
    supabase
      .from('morceaux')
      .select('id, titre, artiste_id, album_id, emission_id')
      .range(1000, 1999),
    supabase
      .from('morceaux')
      .select('id, titre, artiste_id, album_id, emission_id')
      .range(2000, 2999),
  ]);

  return pages.flatMap((page) => (page.data ?? []) as Morceau[]);
}

export default async function NetPage() {
  const [
    artistesResult,
    albumsResult,
    morceaux,
    emissionsResult,
    paysResult,
  ] = await Promise.all([
    supabase
      .from('artistes')
      .select('id, nom, pays_id, ville_region')
      .order('nom'),
    supabase
      .from('albums')
      .select('id, titre, artiste_id')
      .order('titre'),
    loadMorceaux(),
    supabase
      .from('emissions')
      .select('id, titre, date_diffusion, duree')
      .order('date_diffusion', { ascending: false }),
    supabase
      .from('pays')
      .select('id, nom')
      .order('nom'),
  ]);

  const artistes = (artistesResult.data ?? []) as Artiste[];
  const albums = (albumsResult.data ?? []) as Album[];
  const emissions = (emissionsResult.data ?? []) as Emission[];
  const pays = (paysResult.data ?? []) as Pays[];

  const territoiresCount = new Set(
    artistes
      .map((artiste) => artiste.ville_region?.trim())
      .filter((value): value is string => Boolean(value)),
  ).size;

  const errors = [
    artistesResult.error,
    albumsResult.error,
    emissionsResult.error,
    paysResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    return (
      <section className="netPage">
        <div className="netPage__error">
          Impossible de charger complètement le réseau documentaire.
        </div>
      </section>
    );
  }

  return (
    <section className="netPage">
      <header className="netIntro">
        <p className="netEyebrow">NET</p>
        <h1 className="netIntro__title">
          Cartographie documentaire du réseau
        </h1>
        <p className="netIntro__text">
          Explore les relations présentes dans les transmissions et observe
          comment les artistes, les œuvres, les territoires et les émissions
          se répondent à travers le catalogue.
        </p>
      </header>

      <NetClient
        artistes={artistes}
        albums={albums}
        morceaux={morceaux}
        emissions={emissions}
        pays={pays}
        stats={{
          emissions: emissions.length,
          artistes: artistes.length,
          albums: albums.length,
          morceaux: morceaux.length,
          territoires: territoiresCount,
        }}
      />
    </section>
  );
}
