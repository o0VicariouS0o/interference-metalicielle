'use client';

import { useMemo, useState } from 'react';
import { NetMap, type NetMapPoint } from '@/components/net/net-map';

type Artiste = { id: number; nom: string; pays_id: number | null; ville_region: string | null };
type Album = { id: number; titre: string; artiste_id: number | null };
type Morceau = { id: number; titre: string; artiste_id: number | null; album_id: number | null; emission_id: string };
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
  stats: { emissions: number; artistes: number; albums: number; morceaux: number; territoires: number };
};

function imagePathForEmission(id: string): string | null {
  const match = id.match(/^IM-(\d{3})$/);
  if (match) return `/visuels/emissions/avec-titres/Episode ${match[1]}.jpg`;
  if (id === 'IM-HS001') return '/visuels/emissions/avec-titres/Episode HS001.jpg';
  return null;
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function includesSearch(value: string, query: string) {
  return normalize(value).includes(normalize(query));
}

export function NetClient({ artistes, albums, morceaux, emissions, pays, stats }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchType>('all');
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [selectedPlace, setSelectedPlace] = useState<NetMapPoint | null>(null);

  const paysById = useMemo(() => new Map(pays.map((item) => [item.id, item.nom])), [pays]);
  const artistesById = useMemo(() => new Map(artistes.map((item) => [item.id, item])), [artistes]);
  const albumsById = useMemo(() => new Map(albums.map((item) => [item.id, item])), [albums]);
  const emissionsById = useMemo(() => new Map(emissions.map((item) => [item.id, item])), [emissions]);

  const results = useMemo(() => {
    const clean = query.trim();
    if (clean.length < 2) return { artistes: [], albums: [], morceaux: [], emissions: [] };

    return {
      artistes: filter === 'all' || filter === 'artiste' ? artistes.filter((item) => includesSearch(item.nom, clean)).slice(0, 12) : [],
      albums: filter === 'all' || filter === 'album' ? albums.filter((item) => includesSearch(item.titre, clean)).slice(0, 12) : [],
      morceaux: filter === 'all' || filter === 'morceau' ? morceaux.filter((item) => includesSearch(item.titre, clean)).slice(0, 12) : [],
      emissions: filter === 'all' || filter === 'emission' ? emissions.filter((item) => includesSearch(item.titre, clean) || includesSearch(item.id, clean)).slice(0, 12) : [],
    };
  }, [albums, artistes, emissions, filter, morceaux, query]);

  const selectedDetails = useMemo(() => {
    if (!selected) return null;

    if (selected.type === 'artiste') {
      const artiste = artistesById.get(selected.id);
      if (!artiste) return null;
      const relatedMorceaux = morceaux.filter((item) => item.artiste_id === artiste.id);
      const relatedAlbums = albums.filter((item) => item.artiste_id === artiste.id);
      const emissionIds = Array.from(new Set(relatedMorceaux.map((item) => item.emission_id)));
      return {
        label: artiste.nom,
        type: 'Artiste',
        artisteNames: [artiste.nom],
        territoire: artiste.ville_region,
        pays: artiste.pays_id ? paysById.get(artiste.pays_id) ?? null : null,
        albumsCount: relatedAlbums.length,
        morceauxCount: relatedMorceaux.length,
        emissions: emissionIds.map((id) => emissionsById.get(id)).filter((item): item is Emission => Boolean(item)),
      };
    }

    if (selected.type === 'album') {
      const album = albumsById.get(selected.id);
      if (!album) return null;
      const artiste = album.artiste_id ? artistesById.get(album.artiste_id) : null;
      const relatedMorceaux = morceaux.filter((item) => item.album_id === album.id);
      const emissionIds = Array.from(new Set(relatedMorceaux.map((item) => item.emission_id)));
      return {
        label: album.titre,
        type: 'Album',
        artisteNames: artiste ? [artiste.nom] : [],
        territoire: artiste?.ville_region ?? null,
        pays: artiste?.pays_id ? paysById.get(artiste.pays_id) ?? null : null,
        albumsCount: 1,
        morceauxCount: relatedMorceaux.length,
        emissions: emissionIds.map((id) => emissionsById.get(id)).filter((item): item is Emission => Boolean(item)),
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
        artisteNames: artiste ? [artiste.nom] : [],
        territoire: artiste?.ville_region ?? null,
        pays: artiste?.pays_id ? paysById.get(artiste.pays_id) ?? null : null,
        albumsCount: album ? 1 : 0,
        morceauxCount: 1,
        emissions: emission ? [emission] : [],
      };
    }

    const emission = emissionsById.get(selected.id);
    if (!emission) return null;
    const relatedMorceaux = morceaux.filter((item) => item.emission_id === emission.id);
    const artisteIds = Array.from(new Set(relatedMorceaux.map((item) => item.artiste_id).filter((id): id is number => id !== null)));
    const relatedArtistes = artisteIds.map((id) => artistesById.get(id)).filter((item): item is Artiste => Boolean(item));
    return {
      label: emission.titre,
      type: 'Émission',
      artisteNames: relatedArtistes.map((item) => item.nom),
      territoire: null,
      pays: null,
      albumsCount: 0,
      morceauxCount: relatedMorceaux.length,
      emissions: [emission],
    };
  }, [albums, albumsById, artistesById, emissionsById, morceaux, paysById, selected]);

  const queryArtistNames = useMemo(() => {
    if (query.trim().length < 2 || selectedDetails) return [];
    const ids = new Set<number>();
    results.artistes.forEach((item) => ids.add(item.id));
    results.albums.forEach((item) => item.artiste_id && ids.add(item.artiste_id));
    results.morceaux.forEach((item) => item.artiste_id && ids.add(item.artiste_id));
    results.emissions.forEach((emission) => {
      morceaux.filter((item) => item.emission_id === emission.id).forEach((item) => item.artiste_id && ids.add(item.artiste_id));
    });
    return Array.from(ids).map((id) => artistesById.get(id)?.nom).filter((name): name is string => Boolean(name));
  }, [artistesById, morceaux, query, results, selectedDetails]);

  const activeArtistNames = selectedDetails?.artisteNames.length ? selectedDetails.artisteNames : queryArtistNames;
  const displayedEmissions = selectedDetails?.emissions.length ? selectedDetails.emissions.slice(0, 4) : emissions.slice(0, 4);

  function handleSelect(item: SelectedItem) {
    setSelected(item);
    setSelectedPlace(null);
  }

  return (
    <>
      <section className="netMapPanel">
        <div className="netMapPanel__heading">
          <div>
            <p className="netEyebrow">Carte documentaire</p>
            <h2 className="netMapPanel__title">{stats.territoires} points d’impact recensés</h2>
          </div>
          <p className="netMapPanel__description">
            La taille d’un impact représente le nombre d’artistes documentés pour ce lieu. Une recherche met automatiquement en valeur les territoires concernés.
          </p>
        </div>

        <NetMap
          activeArtistNames={activeArtistNames}
          selectedPlaceId={selectedPlace?.id ?? null}
          onSelectPlace={setSelectedPlace}
          autoFocusKey={`${selectedDetails?.label ?? ''}|${query}|${filter}`}
        />

        <div className="netStats">
          {[
            ['Émissions', stats.emissions],
            ['Artistes', stats.artistes],
            ['Albums', stats.albums],
            ['Morceaux', stats.morceaux],
            ['Territoires', stats.territoires],
          ].map(([label, value]) => (
            <div key={label} className="netStats__item"><strong>{value}</strong><span>{label}</span></div>
          ))}
        </div>
      </section>

      <section className="netSearch">
        <label className="netSearch__field">
          <span className="netEyebrow">Explorer le réseau</span>
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSelected(null); setSelectedPlace(null); }}
            placeholder="Rechercher un artiste, album, morceau ou émission…"
          />
        </label>

        <div className="netSearch__filters">
          {[
            ['all', 'Tous'], ['artiste', 'Artiste'], ['album', 'Album'], ['morceau', 'Morceau'], ['emission', 'Émission'],
          ].map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? 'is-active' : ''} onClick={() => { setFilter(value as SearchType); setSelected(null); }}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="netContent">
        <article className="netPanel">
          <p className="netEyebrow">Relations documentaires</p>
          {selectedPlace ? (
            <div className="netPlaceDetails">
              <h3>{selectedPlace.sourceLabel}</h3>
              <p>{selectedPlace.artistCount} artiste{selectedPlace.artistCount > 1 ? 's' : ''} documenté{selectedPlace.artistCount > 1 ? 's' : ''}</p>
              <ul>{selectedPlace.artists.map((artist) => <li key={artist}>{artist}</li>)}</ul>
            </div>
          ) : (
            <div className="netRelations">
              <RelationBox label={selectedDetails?.type ?? 'Sélection'} value={selectedDetails?.label ?? 'Aucun élément sélectionné'} active />
              <RelationBox label="Territoire" value={selectedDetails?.territoire ?? selectedDetails?.pays ?? 'Relation à charger'} />
              <RelationBox label="Albums / Morceaux" value={selectedDetails ? `${selectedDetails.albumsCount} album(s) · ${selectedDetails.morceauxCount} morceau(x)` : 'Relation à charger'} />
              <RelationBox label="Transmissions" value={selectedDetails ? `${selectedDetails.emissions.length} transmission(s) associée(s)` : 'Relation à charger'} />
            </div>
          )}
        </article>

        <article className="netPanel">
          <p className="netEyebrow">Résultats</p>
          {query.trim().length < 2 ? (
            <div className="netEmpty"><h3>Réseau en attente</h3><p>Saisis au moins deux caractères pour explorer le catalogue.</p></div>
          ) : (
            <div className="netResults">
              <ResultGroup title="Artistes" items={results.artistes.map((item) => ({ key: `artiste-${item.id}`, label: item.nom, detail: item.ville_region, onClick: () => handleSelect({ type: 'artiste', id: item.id }) }))} />
              <ResultGroup title="Albums" items={results.albums.map((item) => ({ key: `album-${item.id}`, label: item.titre, detail: item.artiste_id ? artistesById.get(item.artiste_id)?.nom ?? null : null, onClick: () => handleSelect({ type: 'album', id: item.id }) }))} />
              <ResultGroup title="Morceaux" items={results.morceaux.map((item) => {
                const artiste = item.artiste_id ? artistesById.get(item.artiste_id) : null;
                const emission = emissionsById.get(item.emission_id);
                return { key: `morceau-${item.id}`, label: item.titre, detail: [artiste?.nom, emission?.id].filter(Boolean).join(' · '), onClick: () => handleSelect({ type: 'morceau', id: item.id }) };
              })} />
              <ResultGroup title="Émissions" items={results.emissions.map((item) => ({ key: `emission-${item.id}`, label: `${item.id} — ${item.titre}`, onClick: () => handleSelect({ type: 'emission', id: item.id }) }))} />
            </div>
          )}
        </article>

        <article className="netPanel netPanel--emissions">
          <div className="netPanel__header"><p className="netEyebrow">Émissions associées</p><span>{displayedEmissions.length} transmission(s)</span></div>
          <div className="netEmissions">
            {displayedEmissions.map((emission) => {
              const visual = imagePathForEmission(emission.id);
              return (
                <article key={emission.id} className="netEmissionCard">
                  {visual ? <img src={visual} alt={emission.titre} /> : null}
                  <div><p>{emission.id}</p><h3>{emission.titre}</h3><a href={`/im?e=${encodeURIComponent(emission.id)}`}>Accéder à la transmission</a></div>
                </article>
              );
            })}
          </div>
        </article>
      </section>
    </>
  );
}

function RelationBox({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return <div className={`netRelation ${active ? 'is-active' : ''}`}><span>{label}</span><p>{value}</p></div>;
}

function ResultGroup({ title, items }: { title: string; items: { key: string; label: string; detail?: string | null; onClick: () => void }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="netResultGroup">
      <p>{title}</p>
      <div>{items.map((item) => <button key={item.key} type="button" onClick={item.onClick}><span>{item.label}</span>{item.detail ? <small>{item.detail}</small> : null}</button>)}</div>
    </section>
  );
}
