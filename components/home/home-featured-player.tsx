'use client';

import {
  type CSSProperties,
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

type HomeFeaturedPlayerProps = {
  audioUrl: string | null;
  durationLabel: string | null;
};

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

function parseDurationLabel(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parts = value
    .split(':')
    .map((part) => Number.parseInt(part.trim(), 10));

  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  return parts[0] ?? 0;
}

export function HomeFeaturedPlayer({
  audioUrl,
  durationLabel,
}: HomeFeaturedPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const databaseDuration = parseDurationLabel(durationLabel);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);

  const effectiveDuration =
    mediaDuration > 0 ? mediaDuration : databaseDuration;

  const progress =
    effectiveDuration > 0
      ? Math.min((currentTime / effectiveDuration) * 100, 100)
      : 0;

  const waveformProgressStyle = {
    '--home-player-progress': `${progress}%`,
  } as CSSProperties;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setMediaDuration(0);
  }, [audioUrl]);

  function updateDuration(audio: HTMLAudioElement) {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setMediaDuration(audio.duration);
    }
  }

  async function handleToggle() {
    const audio = audioRef.current;

    if (!audio || !audioUrl) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }

      return;
    }

    audio.pause();
  }

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    const nextTime = Number(event.target.value);

    if (!audio || !audioUrl || !Number.isFinite(nextTime)) {
      return;
    }

    try {
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    } catch {
      // Certains serveurs audio peuvent refuser la navigation temporelle.
    }
  }

  return (
    <div className="homePlayer">
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        onLoadedMetadata={(event) => updateDuration(event.currentTarget)}
        onDurationChange={(event) => updateDuration(event.currentTarget)}
        onCanPlay={(event) => updateDuration(event.currentTarget)}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        type="button"
        className="homePlayer__toggle"
        onClick={handleToggle}
        disabled={!audioUrl}
        aria-label={
          isPlaying
            ? 'Mettre la transmission en pause'
            : 'Écouter la transmission'
        }
      >
        <span
          className={
            isPlaying
              ? 'homePlayer__pauseIcon'
              : 'homePlayer__playIcon'
          }
          aria-hidden="true"
        />
      </button>

      <div className="homePlayer__body">
        <div className="homePlayer__header">
          <span className="homePlayer__status">
            {isPlaying ? 'Transmission en cours' : 'Signal disponible'}
          </span>

          <span className="homePlayer__time">
            {formatTime(currentTime)}
            {effectiveDuration > 0
              ? ` / ${formatTime(effectiveDuration)}`
              : ''}
          </span>
        </div>

        <div
          className="homePlayer__track"
          style={waveformProgressStyle}
        >
          <div className="homePlayer__grid" aria-hidden="true" />

<div
  className="homePlayer__progress"
  style={
    {
      '--progress': `${progress}%`,
    } as React.CSSProperties
  }
/>

          <input
            className="homePlayer__range"
            type="range"
            min="0"
            max={effectiveDuration || 0}
            step="1"
            value={Math.min(currentTime, effectiveDuration || 0)}
            onChange={handleSeek}
            disabled={!audioUrl || effectiveDuration <= 0}
            aria-label="Position dans la transmission"
          />
        </div>

        <div className="homePlayer__footer">
          <span>Canal audio</span>
          <span>
            {audioUrl ? 'Décodage prêt' : 'Signal indisponible'}
          </span>
        </div>
      </div>
    </div>
  );
}