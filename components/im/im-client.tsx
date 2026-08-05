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
  initialEmissionId?: string | null;
};

type TransmissionState = 'idle' | 'loading' | 'playing' | 'ended';

const STORAGE_KEY = 'im-playback-positions';

function imagePathForEmission(id: string): string | null {
  const match = id.match(/^IM-(\d{3})$/);

  if (match) return `/visuels/emissions/avec-titres/Episode ${match[1]}.jpg`;
  if (id === 'IM-HS001') return '/visuels/emissions/avec-titres/Episode HS001.jpg';

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

function loadSavedPositions(): Record<string, number> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function savePosition(emissionId: string, seconds: number) {
  if (typeof window === 'undefined') return;

  try {
    const positions = loadSavedPositions();

    positions[emissionId] = seconds;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Ignore localStorage errors.
  }
}

export function ImClient({
  emissions,
  initialEmissionId,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

 const validInitialEmissionId =
  initialEmissionId &&
  emissions.some((emission) => emission.id === initialEmissionId)
    ? initialEmissionId
    : emissions[0]?.id ?? null;

const [activeId, setActiveId] = useState<string | null>(
  validInitialEmissionId,
); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [transmissionState, setTransmissionState] =
    useState<TransmissionState>('idle');
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [lastVolume, setLastVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

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
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeEmission?.audio_url) return;

    audio.pause();
    audio.load();
    setCurrentTime(0);
    setAudioDuration(0);

    const positions = loadSavedPositions();
    const savedPosition = positions[activeEmission.id];

    if (savedPosition && savedPosition > 0) {
      audio.currentTime = savedPosition;
      setCurrentTime(savedPosition);
    }

    if (!shouldAutoplay) {
      setIsPlaying(false);
      setTransmissionState('idle');
      return;
    }

    setTransmissionState('loading');

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setTransmissionState('playing');
      })
      .catch(() => {
        setIsPlaying(false);
        setTransmissionState('idle');
      })
      .finally(() => setShouldAutoplay(false));
  }, [activeEmission?.audio_url, activeEmission?.id, shouldAutoplay]);

  if (!activeEmission) {
    return <p className="mt-10 text-muted">Aucune émission disponible.</p>;
  }

  function handleSelectEmission(id: string) {
    setTransmissionState('loading');
    setActiveId(id);
    setShouldAutoplay(true);
  }

  function handleTogglePlayback() {
    const audio = audioRef.current;
    if (!audio || !activeEmission.audio_url) return;

    if (audio.paused) {
      setTransmissionState('loading');

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setTransmissionState('playing');
        })
        .catch(() => {
          setIsPlaying(false);
          setTransmissionState('idle');
        });
    } else {
      audio.pause();
      setIsPlaying(false);
      setTransmissionState('idle');
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
    savePosition(activeEmission.id, nextTime);
  }

  function handleSeekToPercent(percent: number) {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;

    const safePercent = Math.min(100, Math.max(0, percent));
    const nextTime = (safePercent / 100) * duration;

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
    savePosition(activeEmission.id, nextTime);
  }

  function handleVolumeChange(nextVolume: number) {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));

    setVolume(safeVolume);

    if (safeVolume > 0) {
      setLastVolume(safeVolume);
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  }

  function handleToggleMute() {
    if (isMuted || volume === 0) {
      const restoredVolume = lastVolume > 0 ? lastVolume : 0.85;
      setVolume(restoredVolume);
      setIsMuted(false);
      return;
    }

    setLastVolume(volume);
    setIsMuted(true);
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={activeEmission.audio_url ?? undefined}
        preload="metadata"
        onLoadStart={() => {
          setTransmissionState('loading');
        }}
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          if (Number.isFinite(nextDuration)) {
            setAudioDuration(nextDuration);
          }
        }}
        onCanPlay={() => {
          if (!isPlaying) {
            setTransmissionState('idle');
          }
        }}
        onTimeUpdate={(event) => {
          const time = event.currentTarget.currentTime;

          setCurrentTime(time);

          if (activeEmission.id) {
            savePosition(activeEmission.id, time);
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          setTransmissionState('idle');
        }}
        onPlay={() => {
          setIsPlaying(true);
          setTransmissionState('playing');
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          setTransmissionState('ended');
          savePosition(activeEmission.id, 0);
        }}
      />

      <div className="mt-10">
        <LecteurIM
          emission={activeEmission}
          isPlaying={isPlaying}
          transmissionState={transmissionState}
          currentTimeLabel={formatAudioTime(currentTime)}
          durationLabel={formatAudioTime(duration)}
          progressPercent={progressPercent}
          volumePercent={Math.round((isMuted ? 0 : volume) * 100)}
          isMuted={isMuted || volume === 0}
          onTogglePlayback={handleTogglePlayback}
          onSeekRelative={handleSeekRelative}
          onSeekToPercent={handleSeekToPercent}
          onVolumeChange={(percent) => handleVolumeChange(percent / 100)}
          onToggleMute={handleToggleMute}
        />
      </div>

      <div className="imArchiveSurface">
        {activeEmission.description_longue ? (
          <section className="imEditorialPanel imEditorialPanel--description">
            <img
              className="imEditorialPanel__decor"
              src="/assets/im/panels/description-panel.png"
              alt=""
              aria-hidden="true"
            />

            <div className="imEditorialPanel__content imEditorialPanel__content--description">
              <div className="imEditorialPanel__body imEditorialPanel__body--description">
                {activeEmission.description_longue}
              </div>
            </div>
          </section>
        ) : null}

        {activeEmission.yem_observation ? (
          <section className="imEditorialPanel imEditorialPanel--yem">
            <img
              className="imEditorialPanel__decor"
              src="/assets/im/panels/yem-panel.png"
              alt=""
              aria-hidden="true"
            />

            <div className="imEditorialPanel__content imEditorialPanel__content--yem">
              <p className="imEditorialPanel__title imEditorialPanel__title--yem">
                Observation de YEM
                {activeEmission.yem_type
                  ? ` — ${activeEmission.yem_type}`
                  : ''}
              </p>

              <blockquote className="imEditorialPanel__quote">
                {activeEmission.yem_observation}
              </blockquote>
            </div>
          </section>
        ) : null}

        <section className="imArchives">
          <h2 className="imArchives__title">Archives</h2>

          <div className="imArchives__list">
          {emissions.map((emission) => {
            const visuel = imagePathForEmission(emission.id);
            const statsText = formatStats(emission.stats);
            const isActive = emission.id === activeEmission.id;

            return (
              <article
                key={emission.id}
                className={`imArchives__entry ${
                  isActive ? 'is-active' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectEmission(emission.id)}
                  className="imArchives__select"
                >
                  {visuel ? (
                    <img
                      src={visuel}
                      alt={`Visuel ${emission.id}`}
                      className="imArchives__visual"
                    />
                  ) : null}

                  <div className="imArchives__info">
                    <p className="imArchives__id">
                      {emission.id}
                    </p>

                    <h3 className="imArchives__name">
                      {emission.titre}
                    </h3>

                    {statsText ? (
                      <p className="imArchives__stats">{statsText}</p>
                    ) : null}

                    {isActive ? (
                      <p className="imArchives__active">Transmission active</p>
                    ) : null}
                  </div>
                </button>

                {emission.playlist_pdf_path ? (
                  <a
                    href={emission.playlist_pdf_path}
                    target="_blank"
                    rel="noreferrer"
                    className="imArchives__pdf"
                  >
                    Archive PDF
                  </a>
                ) : (
                  <span className="imArchives__empty">—</span>
                )}
              </article>
            );
          })}
          </div>
        </section>
      </div>
    </>
  );
}