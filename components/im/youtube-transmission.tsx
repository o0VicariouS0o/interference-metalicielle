'use client';

import type { PlaylistTrack } from './playlist-im';

type Props = {
  track: PlaylistTrack;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
};

function getYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    let videoId = '';

    if (url.hostname === 'youtu.be') {
      videoId = url.pathname.slice(1).split('/')[0] ?? '';
    } else if (
      url.hostname === 'youtube.com' ||
      url.hostname === 'www.youtube.com' ||
      url.hostname === 'm.youtube.com' ||
      url.hostname === 'music.youtube.com'
    ) {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') ?? '';
      } else if (
        url.pathname.startsWith('/embed/') ||
        url.pathname.startsWith('/shorts/') ||
        url.pathname.startsWith('/live/')
      ) {
        videoId = url.pathname.split('/')[2] ?? '';
      }
    }

    if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return null;

    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  } catch {
    return null;
  }
}

export function YouTubeTransmission({
  track,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onClose,
}: Props) {
  const embedUrl = track.youtube_url ? getYouTubeEmbedUrl(track.youtube_url) : null;

  return (
    <section
      className="imTransmission"
      role="dialog"
      aria-modal="true"
      aria-label={`Transmission externe : ${track.artiste} — ${track.titre}`}
    >
      <div className="imTransmission__machine">
        <div className="imTransmission__video">
            {embedUrl ? (
              <iframe
                key={track.id}
                src={embedUrl}
                title={`${track.artiste} — ${track.titre}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="imTransmission__videoError">
                SIGNAL VIDÉO INDISPONIBLE
              </div>
            )}
          </div>

        <img
          className="imTransmission__chassis"
          src="/assets/im/youtube/youtube-transmission-chassis.png"
          alt=""
          aria-hidden="true"
        />

        <button
          type="button"
          className="imTransmission__physicalClose"
          onClick={onClose}
          aria-label="Fermer la transmission"
          title="Fermer"
        >
          <img
            src="/assets/im/playlist/close.png"
            alt=""
            aria-hidden="true"
          />
        </button>

        <div className="imTransmission__overlay">
          <strong className="imTransmission__heading">TRANSMISSION EXTERNE</strong>

          <div className="imTransmission__track">
            <strong>{track.artiste}</strong>
            <span>{track.titre}</span>
          </div>

          <button
            type="button"
            className="imTransmission__control imTransmission__control--previous"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            SIGNAL PRÉCÉDENT
          </button>

          {track.youtube_url ? (
            <a
              className="imTransmission__control imTransmission__control--youtube"
              href={track.youtube_url}
              target="_blank"
              rel="noreferrer"
            >
              OUVRIR SUR YOUTUBE
            </a>
          ) : (
            <span className="imTransmission__control imTransmission__control--youtube is-disabled">
              OUVRIR SUR YOUTUBE
            </span>
          )}

          <button
            type="button"
            className="imTransmission__control imTransmission__control--next"
            onClick={onNext}
            disabled={!hasNext}
          >
            SIGNAL SUIVANT
          </button>

        </div>
      </div>
    </section>
  );
}
