'use client';

import { useRef, useState } from 'react';

type Props = {
  audioUrl: string | null;
};

export function HomeFeaturedPlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function handleToggle() {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  return (
    <div>
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)}
      />

      <button
        type="button"
        onClick={handleToggle}
        disabled={!audioUrl}
        className="inline-flex border border-transmission px-6 py-3 font-mono text-sm uppercase tracking-widest text-transmission hover:bg-transmission hover:text-black disabled:cursor-not-allowed disabled:border-border disabled:text-muted"
      >
        {isPlaying ? 'Arrêter la transmission' : 'Écouter la transmission'}
      </button>
    </div>
  );
}