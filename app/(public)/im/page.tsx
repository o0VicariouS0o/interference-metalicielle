import { ImClient } from '@/components/im/im-client';
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
  audio_url: string | null;
  playlist_pdf_path: string | null;
  type_id: number | null;
};

type TypeEmission = {
  id: number;
  libelle: string;
};

type Morceau = {
  id: number;
  emission_id: string;
  position: number;
  titre: string;
  artiste_id: number;
  album_id: number | null;
  annee: number | null;
  est_extrait: boolean;
  youtube_url: string | null;
  youtube_type: string | null;
};

type Artiste = { id: number; nom: string; pays_id: number | null };
type Album = { id: number; titre: string; annee: number | null };


export default async function ImPage() {
  
  const { data, error } = await supabase
    .from('emissions')
    .select(
      'id, titre, date_diffusion, description, description_courte, description_longue, yem_observation, yem_type, duree, audio_url, playlist_pdf_path, type_id',
    )
    .order('date_diffusion', { ascending: false });

  const { data: typesData } = await supabase
    .from('types_emission')
    .select('id, libelle');

  if (error) {
    return (
      <section className="mx-auto w-full max-w-[1440px] px-4 py-12 tablet:px-6 desktop:px-8">
        <h1 className="font-display text-3xl">IM</h1>
        <p className="mt-8 border border-transmission p-4 text-sm text-transmission">
          Erreur de chargement des émissions : {error.message}
        </p>
      </section>
    );
  }

  const emissions = (data ?? []) as Emission[];
  const types = (typesData ?? []) as TypeEmission[];
  const typesById = new Map(types.map((type) => [type.id, type.libelle]));

  const emissionIds = emissions.map((emission) => emission.id);

  const { data: morceauxPage1 } = await supabase
    .from('morceaux')
    .select('id, emission_id, position, titre, artiste_id, album_id, annee, est_extrait, youtube_url, youtube_type')
    .in('emission_id', emissionIds)
    .range(0, 999);

  const { data: morceauxPage2 } = await supabase
    .from('morceaux')
    .select('id, emission_id, position, titre, artiste_id, album_id, annee, est_extrait, youtube_url, youtube_type')
    .in('emission_id', emissionIds)
    .range(1000, 1999);

  const morceauxData = [...(morceauxPage1 ?? []), ...(morceauxPage2 ?? [])] as Morceau[];

  const artisteIds = Array.from(
    new Set(
      morceauxData
        .map((morceau) => morceau.artiste_id)
        .filter((id): id is number => id !== null),
    ),
  );

  const { data: artistesData } = await supabase
    .from('artistes')
    .select('id, nom, pays_id')
    .in('id', artisteIds);

  const artistes = (artistesData ?? []) as Artiste[];
  const artistesById = new Map(artistes.map((artiste) => [artiste.id, artiste]));

  const albumIds = Array.from(
    new Set(
      morceauxData
        .map((morceau) => morceau.album_id)
        .filter((id): id is number => id !== null),
    ),
  );

  const { data: albumsData } = await supabase
    .from('albums')
    .select('id, titre, annee')
    .in('id', albumIds);

  const albums = (albumsData ?? []) as Album[];
  const albumsById = new Map(albums.map((album) => [album.id, album]));

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

      const paysId = artistesById.get(morceau.artiste_id)?.pays_id;
      if (paysId !== null && paysId !== undefined) {
        current.pays.add(paysId);
      }
    }

    statsByEmission.set(morceau.emission_id, current);
  }

  const morceauxByEmission = new Map<string, Morceau[]>();

  for (const morceau of morceauxData) {
    const liste = morceauxByEmission.get(morceau.emission_id) ?? [];
    liste.push(morceau);
    morceauxByEmission.set(morceau.emission_id, liste);
  }

  const clientEmissions = emissions.map((emission) => {
    const stats = statsByEmission.get(emission.id);
    const playlist = (morceauxByEmission.get(emission.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((morceau) => {
        const artiste = artistesById.get(morceau.artiste_id);
        const album = morceau.album_id !== null ? albumsById.get(morceau.album_id) : undefined;

        return {
          id: morceau.id,
          position: morceau.position,
          titre: morceau.titre,
          artiste: artiste?.nom ?? 'Artiste inconnu',
          album: album?.titre ?? null,
          annee: morceau.annee ?? album?.annee ?? null,
          est_extrait: morceau.est_extrait,
          youtube_url: morceau.youtube_url,
          youtube_type: morceau.youtube_type,
        };
      });

    return {
      ...emission,
      type_libelle:
        emission.type_id !== null
          ? typesById.get(emission.type_id) ?? null
          : null,
      stats: stats
        ? {
            titres: stats.titres,
            groupes: stats.artistes.size,
            pays: stats.pays.size,
          }
        : undefined,
      playlist,
    };
  });

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-12 tablet:px-6 desktop:px-8">
    <header>
  <p className="font-mono text-sm uppercase tracking-widest text-transmission">
    Transmissions
  </p>

  <h1 className="mt-3 font-display text-3xl">
    Bibliothèque des transmissions
  </h1>

  <p className="mt-4 text-muted">
    {emissions.length} transmissions conservées dans les archives.
  </p>
</header>  

      <ImClient
  emissions={clientEmissions}
  />
    </section>
  );
}