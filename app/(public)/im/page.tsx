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
      <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
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
    .select('emission_id, artiste_id')
    .in('emission_id', emissionIds)
    .range(0, 999);

  const { data: morceauxPage2 } = await supabase
    .from('morceaux')
    .select('emission_id, artiste_id')
    .in('emission_id', emissionIds)
    .range(1000, 1999);

  const morceauxData = [...(morceauxPage1 ?? []), ...(morceauxPage2 ?? [])];

  const artisteIds = Array.from(
    new Set(
      morceauxData
        .map((morceau) => morceau.artiste_id)
        .filter((id): id is number => id !== null),
    ),
  );

  const { data: artistesData } = await supabase
    .from('artistes')
    .select('id, pays_id')
    .in('id', artisteIds);

  const paysByArtiste = new Map<number, number | null>();

  for (const artiste of artistesData ?? []) {
    paysByArtiste.set(artiste.id, artiste.pays_id);
  }

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

      const paysId = paysByArtiste.get(morceau.artiste_id);
      if (paysId !== null && paysId !== undefined) {
        current.pays.add(paysId);
      }
    }

    statsByEmission.set(morceau.emission_id, current);
  }

  const clientEmissions = emissions.map((emission) => {
    const stats = statsByEmission.get(emission.id);

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
    };
  });

  return (
    <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
      <header>
        <p className="font-mono text-sm uppercase tracking-widest text-transmission">
          Transmissions
        </p>
        <h1 className="mt-3 font-display text-3xl">Interférence Métalicielle</h1>
        <p className="mt-4 text-muted">
          {emissions.length} émissions importées depuis les archives.
        </p>
      </header>

      <ImClient emissions={clientEmissions} />
    </section>
  );
}