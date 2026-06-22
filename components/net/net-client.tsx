'use client';

import { useMemo, useState } from 'react';

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

type SearchType = 'all' | 'artiste' | 'album' | 'morceau' | 'emission';

type SelectedItem =
  | { type: 'artiste'; id: number }
  | { type: 'album'; id: number }
  | { type: 'morceau'; id: number }
  | { type: 'emission'; id: string }
  | null;

type Props = {
  artistes: Artiste[];
  albums: Album[];
  morceaux: Morceau[];
  emissions: Emission[];
  pays: Pays[];
  stats: {
    emissions: number;
    artistes: number;
    albums: number;
    morceaux: number;
    territoires: number;
  };
};

function imagePathForEmission(id: string): string | null {
  const match = id.match(/^IM-(\d{3})$/);

  if (match) return `/visuels/emissions/avec-titres/Episode ${match[1]}.jpg`;
  if (id === 'IM-HS001') return '/visuels/emissions/avec-titres/Episode HS001.jpg';

  return null;
}

function includesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function NetClient({
  artistes,
  albums,
  morceaux,
  emissions,
  pays,
  stats,
}: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchType>('all');
  const [selected, setSelected] = useState<SelectedItem>(null);

  const paysById = useMemo(
    () => new Map(pays.map((paysItem) => [paysItem.id, paysItem.nom])),
    [pays],
  );

  const artistesById = useMemo(
    () => new Map(artistes.map((artiste) => [artiste.id, artiste])),
    [artistes],
  );

  const albumsById = useMemo(
    () => new Map(albums.map((album) => [album.id, album])),
    [albums],
  );

  const emissionsById = useMemo(
    () => new Map(emissions.map((emission) => [emission.id, emission])),
    [emissions],
  );

  const results = useMemo(() => {
    const clean = query.trim();

    if (clean.length < 2) {
      return {
        artistes: [] as Artiste[],
        albums: [] as Album[],
        morceaux: [] as Morceau[],
        emissions: [] as Emission[],
      };
    }

    return {
      artistes:
        filter === 'all' || filter === 'artiste'
          ? artistes.filter((artiste) => includesSearch(artiste.nom, clean)).slice(0, 8)
          : [],
      albums:
        filter === 'all' || filter === 'album'
          ? albums.filter((album) => includesSearch(album.titre, clean)).slice(0, 8)
          : [],
      morceaux:
        filter === 'all' || filter === 'morceau'
          ? morceaux.filter((morceau) => includesSearch(morceau.titre, clean)).slice(0, 8)
          : [],
      emissions:
        filter === 'all' || filter === 'emission'
          ? emissions.filter((emission) => includesSearch(emission.titre, clean)).slice(0, 8)
          : [],
    };
  }, [albums, artistes, emissions, filter, morceaux, query]);

  const selectedDetails = useMemo(() => {
    if (!selected) return null;

    if (selected.type === 'artiste') {
      const artiste = artistesById.get(selected.id);
      if (!artiste) return null;

      const artisteMorceaux = morceaux.filter((morceau) => morceau.artiste_id === artiste.id);
      const artisteAlbums = albums.filter((album) => album.artiste_id === artiste.id);
      const emissionIds = Array.from(new Set(artisteMorceaux.map((morceau) => morceau.emission_id)));
      const associatedEmissions = emissionIds
        .map((id) => emissionsById.get(id))
        .filter((emission): emission is Emission => Boolean(emission));

      return {
        label: artiste.nom,
        type: 'Artiste',
        pays: artiste.pays_id ? paysById.get(artiste.pays_id) ?? null : null,
        albumsCount: artisteAlbums.length,
        morceauxCount: artisteMorceaux.length,
        emissions: associatedEmissions,
      };
    }

    if (selected.type === 'album') {
      const album = albumsById.get(selected.id);
      if (!album) return null;

      const albumMorceaux = morceaux.filter((morceau) => morceau.album_id === album.id);
      const artiste = album.artiste_id ? artistesById.get(album.artiste_id) : null;
      const emissionIds = Array.from(new Set(albumMorceaux.map((morceau) => morceau.emission_id)));
      const associatedEmissions = emissionIds
        .map((id) => emissionsById.get(id))
        .filter((emission): emission is Emission => Boolean(emission));

      return {
        label: album.titre,
        type: 'Album',
        artiste: artiste?.nom ?? null,
        albumsCount: 1,
        morceauxCount: albumMorceaux.length,
        emissions: associatedEmissions,
      };
    }

    if (selected.type === 'morceau') {
      const morceau = morceaux.find((item) => item.id === selected.id);
      if (!morceau) return null;

      const artiste = morceau.artiste_id ? artistesById.get(morceau.artiste_id) : null;
      const album = morceau.album_id ? albumsById.get(morceau.album_id) : null;
      const emission = emissionsById.get(morceau.emission_id);

      return {
        label: morceau.titre,
        type: 'Morceau',
        artiste: artiste?.nom ?? null,
        album: album?.titre ?? null,
        albumsCount: album ? 1 : 0,
        morceauxCount: 1,
        emissions: emission ? [emission] : [],
      };
    }

    const emission = emissionsById.get(selected.id);
    if (!emission) return null;

    const emissionMorceaux = morceaux.filter((morceau) => morceau.emission_id === emission.id);
    const artisteIds = new Set(
      emissionMorceaux
        .map((morceau) => morceau.artiste_id)
        .filter((id): id is number => id !== null),
    );

    return {
      label: emission.titre,
      type: 'Émission',
      albumsCount: 0,
      morceauxCount: emissionMorceaux.length,
      artistesCount: artisteIds.size,
      emissions: [emission],
    };
  }, [albums, albumsById, artistesById, emissionsById, morceaux, paysById, selected]);

  const displayedEmissions =
    selectedDetails?.emissions.length ? selectedDetails.emissions.slice(0, 4) : emissions.slice(0, 4);

  return (
    <>
      <section className="relative mt-10 min-h-[520px] overflow-hidden border border-border bg-black p-8">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[radial-gradient(circle_at_18%_45%,rgba(255,42,24,0.45),transparent_12%),radial-gradient(circle_at_42%_30%,rgba(255,138,42,0.28),transparent_14%),radial-gradient(circle_at_67%_58%,rgba(255,42,24,0.35),transparent_13%),radial-gradient(circle_at_82%_36%,rgba(255,138,42,0.22),transparent_12%)]" />
        </div>

        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative z-10 flex min-h-[460px] flex-col justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-transmission">
              Carte documentaire
            </p>

            <h2 className="mt-4 max-w-3xl font-display text-5xl">
              {stats.territoires} territoires documentés
            </h2>

            <p className="mt-6 max-w-2xl leading-7 text-muted">
              Vue globale des territoires représentés dans le catalogue. Cette carte matérialise les
              zones d'origine des artistes présents dans les transmissions.
            </p>
          </div>

          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-5">
            {[
              ['émissions', stats.emissions],
              ['artistes', stats.artistes],
              ['albums', stats.albums],
              ['morceaux', stats.morceaux],
              ['territoires', stats.territoires],
            ].map(([label, value]) => (
              <div key={label} className="border border-border bg-black/60 p-4">
                <p className="font-display text-3xl">{value}</p>
                <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 border border-border p-6">
        <div className="grid gap-4 desktop:grid-cols-[1fr_auto]">
          <label>
            <span className="font-mono text-sm uppercase tracking-widest text-transmission">
              Explorer le réseau
            </span>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un artiste, album, morceau ou émission..."
              className="mt-4 w-full border border-border bg-black px-4 py-3 text-sm text-neutral-100 placeholder:text-muted"
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            {[
              ['all', 'Tous'],
              ['artiste', 'Artiste'],
              ['album', 'Album'],
              ['morceau', 'Morceau'],
              ['emission', 'Émission'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as SearchType)}
                className={`border px-4 py-3 font-mono text-xs uppercase tracking-widest ${
                  filter === value
                    ? 'border-transmission text-transmission'
                    : 'border-border text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 desktop:grid-cols-[1fr_0.9fr_1.4fr]">
        <article className="border border-border p-6">
          <p className="font-mono text-sm uppercase tracking-widest text-transmission">
            Relations documentaires
          </p>

          <div className="mt-8 space-y-4">
            <div className="border border-transmission p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-transmission">
                {selectedDetails?.type ?? 'Sélection'}
              </p>
              <p className="mt-2">{selectedDetails?.label ?? 'Aucun élément sélectionné'}</p>
            </div>

            <div className="border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Artiste / Territoire
              </p>
              <p className="mt-2 text-muted">
                {selectedDetails?.artiste ??
                  selectedDetails?.pays ??
                  (selectedDetails ? 'Non renseigné' : 'Relations à charger')}
              </p>
            </div>

            <div className="border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Albums / Morceaux
              </p>
              <p className="mt-2 text-muted">
                {selectedDetails
                  ? `${selectedDetails.albumsCount ?? 0} albums · ${
                      selectedDetails.morceauxCount ?? 0
                    } morceaux`
                  : 'Relations à charger'}
              </p>
            </div>

            <div className="border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Transmissions
              </p>
              <p className="mt-2 text-muted">
                {selectedDetails
                  ? `${selectedDetails.emissions.length} transmission(s) associée(s)`
                  : 'Relations à charger'}
              </p>
            </div>
          </div>
        </article>

        <article className="border border-border p-6">
          <p className="font-mono text-sm uppercase tracking-widest text-transmission">
            Résultats
          </p>

          {query.trim().length < 2 ? (
            <>
              <h2 className="mt-6 font-display text-3xl">Réseau en attente</h2>
              <p className="mt-4 leading-7 text-muted">
                Entrez au moins deux caractères pour explorer artistes, albums, morceaux et
                transmissions.
              </p>
            </>
          ) : (
            <div className="mt-6 space-y-6">
              <ResultGroup
                title="Artistes"
                items={results.artistes.map((item) => ({
                  key: `artiste-${item.id}`,
                  label: item.nom,
                  onClick: () => setSelected({ type: 'artiste', id: item.id }),
                }))}
              />

              <ResultGroup
                title="Albums"
                items={results.albums.map((item) => ({
                  key: `album-${item.id}`,
                  label: item.titre,
                  onClick: () => setSelected({ type: 'album', id: item.id }),
                }))}
              />

              <ResultGroup
  title="Morceaux"
  items={results.morceaux.map((item) => {
    const artiste = item.artiste_id ? artistesById.get(item.artiste_id) : null;
    const album = item.album_id ? albumsById.get(item.album_id) : null;
    const emission = emissionsById.get(item.emission_id);

    return {
      key: `morceau-${item.id}`,
      label: item.titre,
      detail: [
        artiste?.nom,
        album?.titre,
        emission ? `${emission.id} — ${emission.titre}` : null,
      ]
        .filter(Boolean)
        .join(' • '),
      onClick: () => setSelected({ type: 'morceau', id: item.id }),
    };
  })}
/>

              <ResultGroup
                title="Émissions"
                items={results.emissions.map((item) => ({
                  key: `emission-${item.id}`,
                  label: `${item.id} — ${item.titre}`,
                  onClick: () => setSelected({ type: 'emission', id: item.id }),
                }))}
              />
            </div>
          )}
        </article>

        <article className="border border-border p-6">
          <p className="font-mono text-sm uppercase tracking-widest text-transmission">
            Émissions associées
          </p>

          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
            {displayedEmissions.length} transmission(s) affichée(s)
          </p>

          <div className="mt-6 grid gap-4 tablet:grid-cols-2">
            {displayedEmissions.map((emission) => {
              const visuel = imagePathForEmission(emission.id);

              return (
                <article key={emission.id} className="border border-border p-4">
                  {visuel ? (
                    <img
                      src={visuel}
                      alt={emission.titre}
                      className="aspect-square w-full border border-border object-cover"
                    />
                  ) : null}

                  <p className="mt-4 font-mono text-xs uppercase tracking-widest text-transmission">
                    {emission.id}
                  </p>

                  <h3 className="mt-2 font-display text-xl">{emission.titre}</h3>

                  {emission.duree ? (
                    <p className="mt-3 font-mono text-xs text-muted">
                      Durée : {emission.duree}
                    </p>
                  ) : null}

                  <a
                    href="/im"
                    className="mt-4 inline-flex font-mono text-xs uppercase tracking-widest text-transmission hover:underline"
                  >
                    Accéder à la transmission
                  </a>
                </article>
              );
            })}
          </div>
        </article>
      </section>
    </>
  );
}

function ResultGroup({
  title,
  items,
}: {
  title: string;
  items: {
    key: string;
    label: string;
    detail?: string | null;
    onClick: () => void;
  }[];
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {title}
      </p>

      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="block w-full border border-border px-3 py-2 text-left text-sm hover:border-transmission hover:text-transmission"
          >
            <span className="block truncate">{item.label}</span>

            {item.detail ? (
              <span className="mt-1 block truncate font-mono text-xs text-muted">
                {item.detail}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}