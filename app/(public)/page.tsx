import { NetClient } from '@/components/net/net-client';
import { supabase } from '@/lib/supabase';

type Artiste = { id: number; nom: string; pays_id: number | null };
type Album = { id: number; titre: string; artiste_id: number | null };
type Morceau = {
  id: number;
  titre: string;
  artiste_id: number | null;
  album_id: number | null;
  emission_id: string;
};
type Emission = { id: string; titre: string; date_diffusion: string; duree: string | null };
type Pays = { id: number; nom: string };

export default async function NetPage() {
  const { data: artistesData, count: artistesCount } = await supabase
    .from('artistes')
    .select('id, nom, pays_id', { count: 'exact' });

  const { data: albumsData, count: albumsCount } = await supabase
    .from('albums')
    .select('id, titre, artiste_id', { count: 'exact' });

  const { data: morceauxData, count: morceauxCount } = await supabase
    .from('morceaux')
    .select('id, titre, artiste_id, album_id, emission_id', { count: 'exact' });

  const { data: emissionsData, count: emissionsCount } = await supabase
    .from('emissions')
    .select('id, titre, date_diffusion, duree', { count: 'exact' })
    .order('date_diffusion', { ascending: false });

  const { data: paysData } = await supabase.from('pays').select('id, nom');

  const artistes = (artistesData ?? []) as Artiste[];
  const albums = (albumsData ?? []) as Album[];
  const morceaux = (morceauxData ?? []) as Morceau[];
  const emissions = (emissionsData ?? []) as Emission[];
  const pays = (paysData ?? []) as Pays[];

  const territoiresCount = new Set(
    artistes
      .map((artiste) => artiste.pays_id)
      .filter((id): id is number => id !== null),
  ).size;

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

      <NetClient
        artistes={artistes}
        albums={albums}
        morceaux={morceaux}
        emissions={emissions}
        pays={pays}
        stats={{
          emissions: emissionsCount ?? emissions.length,
          artistes: artistesCount ?? artistes.length,
          albums: albumsCount ?? albums.length,
          morceaux: morceauxCount ?? morceaux.length,
          territoires: territoiresCount,
        }}
      />

      <footer className="mt-12 border-t border-border pt-6">
        <p className="text-sm text-muted">
          Interférence Métalicielle — NET — cartographie documentaire du réseau.
        </p>
      </footer>
    </section>
  );
}