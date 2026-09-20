'use client';

import { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { YouTubeTransmission } from './youtube-transmission';

export type PlaylistTrack = {
  id: number;
  position: number;
  titre: string;
  artiste: string;
  album: string | null;
  annee: number | null;
  est_extrait: boolean;
  youtube_url: string | null;
  youtube_type: string | null;
};

type Props = {
  emissionId: string;
  emissionTitre: string;
  emissionType: string | null;
  emissionDate: string;
  yemType: string | null;
  tracks: PlaylistTrack[];
  onClose: () => void;
};

const TRACKS_PER_PAGE = 20;

const PLAYLIST_LED_COLORS = ['blue', 'green', 'purple', 'red', 'yellow'] as const;

function createPlaylistLedColors() {
  return Array.from({ length: 4 }, () => {
    const index = Math.floor(Math.random() * PLAYLIST_LED_COLORS.length);
    return PLAYLIST_LED_COLORS[index];
  });
}

function formatArchiveDate(raw: string): string {
  if (!raw) return '—';

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return raw;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function PlaylistIM({
  emissionId,
  emissionTitre,
  emissionType,
  emissionDate,
  yemType,
  tracks,
  onClose,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [transmissionTrackId, setTransmissionTrackId] = useState<number | null>(null);
  const [ledColors] = useState(createPlaylistLedColors);
  const oscilloscopeId = useId().replace(/:/g, '');

  const orderedTracks = useMemo(
    () => [...tracks].sort((a, b) => a.position - b.position),
    [tracks],
  );

  const totalPages = Math.max(1, Math.ceil(orderedTracks.length / TRACKS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * TRACKS_PER_PAGE;
  const visibleTracks = orderedTracks.slice(startIndex, startIndex + TRACKS_PER_PAGE);
  const youtubeTracks = orderedTracks.filter((track) => Boolean(track.youtube_url));
  const transmissionIndex = youtubeTracks.findIndex((track) => track.id === transmissionTrackId);
  const transmissionTrack = transmissionIndex >= 0 ? youtubeTracks[transmissionIndex] : null;

  function goToPage(page: number) {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
  }

  return (
    <section
      className="imPlaylist imPlaylist--chassis"
      aria-label={`Playlist de l'émission ${emissionTitre}`}
    >
      <div className="imPlaylist__machine">
        <img
          className="imPlaylist__chassis"
          src="/assets/im/playlist/chassis_playlist.png"
          alt=""
          aria-hidden="true"
        />

        <div className="imPlaylist__overlay">
          <strong className="imPlaylist__archiveCode">{emissionId}</strong>

          <div className="imPlaylist__metaValues" aria-label="Informations d'archive">
            <span>{emissionType?.toUpperCase() ?? '—'}</span>
            <span>RESTAURÉE</span>
            <span>{formatArchiveDate(emissionDate)}</span>
            <span>YEM</span>
            <span>RÉSEAU I.M.</span>
          </div>

          <div className="imPlaylist__emissionTitle">
            <strong>{emissionTitre}</strong>
          </div>

          <strong className="imPlaylist__trackCount">
            {String(orderedTracks.length).padStart(2, '0')}
          </strong>

          <button
            type="button"
            className="imPlaylist__close"
            onClick={onClose}
            aria-label="Fermer l’archive"
            title="Fermer"
          >
            <img
              src="/assets/im/playlist/close.png"
              alt=""
              aria-hidden="true"
            />
          </button>

          <div className="imPlaylist__tracksWindow">
            {visibleTracks.length > 0 ? (
              <ol className="imPlaylist__tracks" start={startIndex + 1}>
                {visibleTracks.map((track) => (
                  <li key={track.id} className="imPlaylist__track">
                    <span className="imPlaylist__position">
                      {String(track.position).padStart(2, '0')}
                    </span>

                    <strong className="imPlaylist__artist">{track.artiste}</strong>

                    <div className="imPlaylist__trackInfo">
                      {track.est_extrait ? (
                        <span className="imPlaylist__excerpt">(ext.)</span>
                      ) : null}
                      <span className="imPlaylist__trackTitle">{track.titre}</span>
                    </div>

                    {track.youtube_url ? (
                      <button
                        type="button"
                        className="imPlaylist__youtubeAvailable"
                        aria-label={`Ouvrir la transmission externe pour ${track.artiste} — ${track.titre}`}
                        title="Accès signal externe"
                        onClick={() => setTransmissionTrackId(track.id)}
                      >
                        <img
                          src="/assets/im/playlist/youtube.png"
                          alt=""
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      <span className="imPlaylist__youtubeUnavailable" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="imPlaylist__empty">Aucun fragment audio identifié.</p>
            )}
          </div>

          {yemType ? (
            <div className="imPlaylist__archivistNote">
              {yemType}
            </div>
          ) : null}

          <div className="imPlaylist__statusLeds" aria-hidden="true">
            {ledColors.map((color, index) => (
              <img
                key={`${color}-${index}`}
                className={`imPlaylist__statusLed imPlaylist__statusLed--${index + 1}`}
                src={`/assets/ui/status-led/status-led-${color}.png`}
                alt=""
              />
            ))}
          </div>

          <div className="imPlaylist__oscilloscope" aria-hidden="true">
            <svg className="imPlaylist__oscilloscopeSvg" viewBox="0 0 600 100" preserveAspectRatio="none">
              <defs>
                <filter id={`playlist-scope-glow-${oscilloscopeId}`} x="-20%" y="-100%" width="140%" height="300%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                className="imPlaylist__oscilloscopeTrace imPlaylist__oscilloscopeTrace--ghost"
                d="M0 50 C24 50 28 49 42 50 S62 54 72 50 S86 32 96 50 S108 69 118 50 S132 45 144 50 S164 51 176 50 S194 27 204 50 S218 77 230 50 S246 42 258 50 S278 53 292 50 S310 37 322 50 S338 64 350 50 S368 47 382 50 S400 50 414 50 S432 31 444 50 S458 71 470 50 S488 43 502 50 S524 52 540 50 S560 46 576 50 S590 50 600 50"
              />
              <path
                className="imPlaylist__oscilloscopeTrace imPlaylist__oscilloscopeTrace--main"
                filter={`url(#playlist-scope-glow-${oscilloscopeId})`}
                d="M0 50 C24 50 28 49 42 50 S62 54 72 50 S86 32 96 50 S108 69 118 50 S132 45 144 50 S164 51 176 50 S194 27 204 50 S218 77 230 50 S246 42 258 50 S278 53 292 50 S310 37 322 50 S338 64 350 50 S368 47 382 50 S400 50 414 50 S432 31 444 50 S458 71 470 50 S488 43 502 50 S524 52 540 50 S560 46 576 50 S590 50 600 50"
              />
            </svg>
          </div>

          {totalPages > 1 ? (
            <nav className="imPlaylist__pagination" aria-label="Pagination de la playlist">
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                aria-label="Page précédente"
              >
                ◀
              </button>

              <span className="imPlaylist__pageStatus">
                PAGE {safePage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                aria-label="Page suivante"
              >
                ▶
              </button>
            </nav>
          ) : null}
        </div>
      </div>

      {transmissionTrack && typeof document !== 'undefined'
        ? createPortal(
            <YouTubeTransmission
              track={transmissionTrack}
              hasPrevious={transmissionIndex > 0}
              hasNext={transmissionIndex < youtubeTracks.length - 1}
              onPrevious={() => {
                if (transmissionIndex > 0) {
                  setTransmissionTrackId(youtubeTracks[transmissionIndex - 1].id);
                }
              }}
              onNext={() => {
                if (transmissionIndex < youtubeTracks.length - 1) {
                  setTransmissionTrackId(youtubeTracks[transmissionIndex + 1].id);
                }
              }}
              onClose={() => setTransmissionTrackId(null)}
            />,
            document.body,
          )
        : null}
    </section>
  );
}
