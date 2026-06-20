'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LecteurIM } from '@/components/im/lecteur-im';

type EmissionClient = {
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
  type_libelle: string | null;
  stats?: {
    titres: number;
    groupes: number;
    pays: number;
  };
};

type Props = {
  emissions: EmissionClient[];
};

function imagePathForEmission(id: string): string | null {
  const match = id.match(/^IM-(\d{3})$/);

  if (match) {
    return `/visuels/emissions/avec-titres/Episode ${match[1]}.jpg`;
  }

  if (id === 'IM-HS001') {
    return '/visuels/emissions/avec-titres/Episode HS001.jpg';
  }

  return null;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

function formatStats(stats?: { titres: number; groupes: number; pays: number }) {
  if (!stats) return null;

  return `${stats.titres} ${pluralize(stats.titres, 'titre', 'titres')} · ${
    stats.groupes
  } ${pluralize(stats.groupes, 'groupe', 'groupes')} · ${stats.pays} pays`;
}

function formatAudioTime(secondsRaw: number): string {
  if (!Number.isFinite(secondsRaw) || secondsRaw < 0) return '00:00:00';

  const total = Math.floor(secondsRaw);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}:${String(seconds).padStart(2, '0')}`;
}

function parseDurationToSeconds(raw: string | null): number {
  if (!raw) return 0;

  const parts = raw.split(':').map(Number);

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  return 0;
}

export function ImClient({ emissions }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeId, setActiveId] = useState(emissions[0]?.id ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const activeEmission =
    emissions.find((emission) => emission.id === activeId) ?? emissions[0];

  const fallbackDuration = useMemo(
    () => parseDurationToSeconds(activeEmission?.duree ?? null),
    [activeEmission?.duree],
  );

  const duration = audioDuration > 0 ? audioDuration : fallbackDuration;

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeEmission?.audio_url) return;

    audio.pause();
    audio.load();
    setCurrentTime(0);
    setAudioDuration(0);

    if (!shouldAutoplay) {
      setIsPlaying(false);
      return;
    }

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        setIsPlaying(false);
      })
      .finally(() => {
        setShouldAutoplay(false);
      });
  }, [activeEmission?.audio_url, shouldAutoplay]);

  if (!activeEmission) {
    return <p className="mt-10 text-muted">Aucune émission disponible.</p>;
  }

  function handleSelectEmission(id: string) {
    setActiveId(id);
    setShouldAutoplay(true);
  }

  function handleTogglePlayback() {
    const audio = audioRef.current;
    if (!audio || !activeEmission.audio_url) return;

    if (audio.paused) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function handleSeekRelative(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = Math.min(
      duration || Number.MAX_SAFE_INTEGER,
      Math.max(0, audio.currentTime + seconds),
    );

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={activeEmission.audio_url ?? undefined}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          if (Number.isFinite(nextDuration)) {
            setAudioDuration(nextDuration);
          }
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
        onPlay={() => {
          setIsPlaying(true);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <div className="mt-10">
        <LecteurIM
          emission={activeEmission}
          isPlaying={isPlaying}
          currentTimeLabel={formatAudioTime(currentTime)}
          durationLabel={formatAudioTime(duration)}
          progressPercent={progressPercent}
          onTogglePlayback={handleTogglePlayback}
          onSeekRelative={handleSeekRelative}
        />
      </div>

      {activeEmission.description_longue ? (
        <section className="mt-8 border border-border p-6">
          <h2 className="font-mono text-sm uppercase tracking-widest text-transmission">
            Description de l'émission
          </h2>
          <div className="mt-6 whitespace-pre-line leading-7 text-muted">
            {activeEmission.description_longue}
          </div>
        </section>
      ) : null}

      {activeEmission.yem_observation ? (
        <section className="mt-6 border border-border p-6">
          <p className="font-mono text-sm uppercase tracking-widest text-transmission">
            Observation YEM
            {activeEmission.yem_type ? ` — ${activeEmission.yem_type}` : ''}
          </p>
          <blockquote className="mt-6 text-lg leading-8 text-muted">
            {activeEmission.yem_observation}
          </blockquote>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-mono text-sm uppercase tracking-widest text-muted">
          Archives
        </h2>

        <div className="mt-4 divide-y divide-border border-y border-border">
          {emissions.map((emission) => {
            const visuel = imagePathForEmission(emission.id);
            const statsText = formatStats(emission.stats);
            const isActive = emission.id === activeEmission.id;

            return (
              <article
                key={emission.id}
                className={`flex items-center justify-between gap-6 py-5 ${
                  isActive ? 'border-l-2 border-transmission pl-4' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectEmission(emission.id)}
                  className="flex flex-1 items-center gap-4 text-left"
                >
                  {visuel ? (
                    <img
                      src={visuel}
                      alt={`Visuel ${emission.id}`}
                      className="h-24 w-24 shrink-0 border border-border object-cover"
                    />
                  ) : null}

                  <div>
                    <p className="font-mono text-xs text-muted">
                      {emission.id}
                    </p>

                    <h3 className="mt-1 font-display text-xl">
                      {emission.titre}
                    </h3>

                    {statsText ? (
                      <p className="mt-2 text-sm text-muted">{statsText}</p>
                    ) : null}

                    {isActive ? (
                      <p className="mt-2 font-mono text-xs uppercase tracking-widest text-transmission">
                        Transmission active
                      </p>
                    ) : null}
                  </div>
                </button>

                {emission.playlist_pdf_path ? (
                  <a
                    href={emission.playlist_pdf_path}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 border border-border px-4 py-2 text-sm hover:border-transmission hover:text-transmission"
                  >
                    Playlist
                  </a>
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}