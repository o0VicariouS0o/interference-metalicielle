'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';

type TransmissionState = 'idle' | 'loading' | 'playing' | 'ended';

type EmissionMinimal = {
  id: string;
  titre: string;
  date_diffusion: string;
  description_courte: string | null;
  duree: string | null;
  audio_url?: string | null;
  playlist_pdf_path: string | null;
  type_libelle?: string | null;
  stats?: { titres: number; groupes: number; pays: number };
};

type Props = {
  emission: EmissionMinimal;
  isPlaying: boolean;
  transmissionState: TransmissionState;
  currentTimeLabel: string;
  durationLabel: string;
  progressPercent: number;
  volumePercent: number;
  isMuted: boolean;
  onTogglePlayback: () => void;
  onSeekRelative: (seconds: number) => void;
  onSeekToPercent: (percent: number) => void;
  onVolumeChange: (percent: number) => void;
  onToggleMute: () => void;
};

const PLAYER_ASSET = '/assets/im/player';
const LED_ASSET = '/assets/ui/status-led';

const SELECTOR_SOUND = '/assets/audio/clac.wav';

type VisualEffect =
  | 'noise'
  | 'rgb'
  | 'line'
  | 'dust'
  | 'flicker'
  | 'scan'
  | 'desync'
  | 'flash'
  | 'rolling'
  | 'tear'
  | 'static'
  | 'blackout'
  | 'reboot';

const LIGHT_EFFECTS: VisualEffect[] = ['noise', 'rgb', 'line', 'dust', 'flicker'];
const MEDIUM_EFFECTS: VisualEffect[] = ['scan', 'desync', 'flash', 'rolling', 'tear'];
const HEAVY_EFFECTS: VisualEffect[] = ['static', 'blackout', 'reboot'];

const EFFECT_DURATIONS: Record<VisualEffect, number> = {
  noise: 900,
  rgb: 700,
  line: 850,
  dust: 1200,
  flicker: 650,
  scan: 1500,
  desync: 1100,
  flash: 520,
  rolling: 1800,
  tear: 1200,
  static: 2600,
  blackout: 1050,
  reboot: 3200,
};

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function formatDateFr(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTypeEmission(type: string | null | undefined): string {
  if (!type) return '—';

  const labels: Record<string, string> = {
    thematique: 'Thématique',
    retrospective: 'Rétrospective',
    hors_serie: 'Hors-série',
  };

  return labels[type] ?? type;
}

function imagePathForEmission(id: string): string | null {
  const match = id.match(/^IM-(\d{3})$/);
  if (match) return `/visuels/emissions/sans-titres/Episode ${match[1]}.jpg`;
  if (id === 'IM-HS001') return '/visuels/emissions/sans-titres/Episode HS001.jpg';
  return null;
}

function getTransmissionLabel(state: TransmissionState): string {
  if (state === 'loading') return 'Ouverture du canal';
  if (state === 'playing') return 'Lecture en cours';
  if (state === 'ended') return 'Transmission terminée';
  return 'Transmission en attente';
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function LecteurIM(props: Props) {
  const {
    emission,
    isPlaying,
    transmissionState,
    currentTimeLabel,
    durationLabel,
    progressPercent,
    volumePercent,
    isMuted,
    onTogglePlayback,
    onSeekRelative,
    onSeekToPercent,
    onVolumeChange,
    onToggleMute,
  } = props;

  const visuel = imagePathForEmission(emission.id);
  const transmissionLabel = getTransmissionLabel(transmissionState);
  const safeProgress = clampPercent(progressPercent);
  const safeVolume = clampPercent(volumePercent);

  const [visualEffect, setVisualEffect] = useState<VisualEffect | null>(null);
  const selectorSoundRef = useRef<HTMLAudioElement | null>(null);
  const regularTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heavyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectBusyRef = useRef(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    function stopEffect() {
      setVisualEffect(null);
      effectBusyRef.current = false;
    }

    function runEffect(effect: VisualEffect) {
      if (effectBusyRef.current) return;

      effectBusyRef.current = true;
      setVisualEffect(effect);

      if (effectTimerRef.current) clearTimeout(effectTimerRef.current);
      effectTimerRef.current = setTimeout(stopEffect, EFFECT_DURATIONS[effect]);
    }

    function scheduleRegularEffect() {
      regularTimerRef.current = setTimeout(() => {
        const pool = Math.random() < 0.22 ? MEDIUM_EFFECTS : LIGHT_EFFECTS;
        runEffect(pickRandom(pool));
        scheduleRegularEffect();
      }, randomBetween(30_000, 90_000));
    }

    function scheduleHeavyEffect() {
      heavyTimerRef.current = setTimeout(() => {
        runEffect(pickRandom(HEAVY_EFFECTS));
        scheduleHeavyEffect();
      }, randomBetween(10 * 60_000, 15 * 60_000));
    }

    scheduleRegularEffect();
    scheduleHeavyEffect();

    return () => {
      if (regularTimerRef.current) clearTimeout(regularTimerRef.current);
      if (heavyTimerRef.current) clearTimeout(heavyTimerRef.current);
      if (effectTimerRef.current) clearTimeout(effectTimerRef.current);
    };
  }, [emission.id]);

  function handleSelectorToggle() {
    const selectorSound = selectorSoundRef.current;

    if (selectorSound) {
      selectorSound.currentTime = 0;
      void selectorSound.play().catch(() => {
        // Le lecteur reste utilisable si le navigateur refuse le son.
      });
    }

    onTogglePlayback();
  }

  function handleProgressChange(event: ChangeEvent<HTMLInputElement>) {
    onSeekToPercent(Number(event.target.value));
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    onVolumeChange(Number(event.target.value));
  }

  return (
    <section className="imPlayer" aria-label="Lecteur Interférence Métalicielle">
      <div className="imPlayer__machine">
        {/* Couche 1 : visuel derrière la façade */}
        <div
          className={`imPlayer__visualWindow ${
            visualEffect ? `is-effect-${visualEffect}` : ''
          }`}
          data-effect={visualEffect ?? undefined}
        >
          {visuel ? (
            <img
              className="imPlayer__visualImage"
              src={visuel}
              alt={`Visuel de l'émission ${emission.titre}`}
            />
          ) : null}

          <span className="imPlayer__videoNoise" aria-hidden="true" />
          <span className="imPlayer__videoScan" aria-hidden="true" />
          <span className="imPlayer__videoLine" aria-hidden="true" />
          <span className="imPlayer__videoTear" aria-hidden="true" />
          <span className="imPlayer__videoFlash" aria-hidden="true" />
          <span className="imPlayer__videoBlackout" aria-hidden="true" />
          <span className="imPlayer__videoReboot" aria-hidden="true">
            RESTAURATION DU SIGNAL
          </span>
        </div>

        {/* Couche 2 : façade complète */}
        <img
          className="imPlayer__background"
          src={`${PLAYER_ASSET}/player-background.png`}
          alt=""
          aria-hidden="true"
        />

        {/* Couche 3 : informations HTML */}
        <div className="imPlayer__content">
          <div className="imPlayer__visualLabels">
            <strong>Visuel de la transmission</strong>
            <span>Archives du réseau IM</span>
          </div>

          <div className="imPlayer__visualStatus">
            <span>Archive restaurée</span>
            <span>Signal stable</span>
          </div>

          <div className="imPlayer__mainInfo">
            <p className="imPlayer__id">{emission.id}</p>
            <h2 className="imPlayer__title">{emission.titre}</h2>
            <p className="imPlayer__date">{formatDateFr(emission.date_diffusion)}</p>
            {emission.description_courte ? (
              <p className="imPlayer__description">{emission.description_courte}</p>
            ) : null}
          </div>

          <div className="imPlayer__progressLabels">
            <span>Progression de la transmission</span>
            <strong>{safeProgress.toFixed(1)}%</strong>
          </div>

          <div className="imPlayer__timeRow">
            <span>{currentTimeLabel}</span>
            <span>{durationLabel}</span>
          </div>

          <div className="imPlayer__signalControls">
            <button
              type="button"
              className={`imPlayer__signalButton ${isMuted ? 'is-muted' : ''}`}
              onClick={onToggleMute}
              aria-pressed={isMuted}
            >
              {isMuted ? 'Signal coupé' : 'Signal actif'}
            </button>

            <input
              className="imPlayer__volume"
              type="range"
              min="0"
              max="100"
              value={safeVolume}
              onChange={handleVolumeChange}
              aria-label="Niveau du signal audio"
            />

            <span>{safeVolume}%</span>
          </div>

          <div className="imPlayer__metaTitle">Métadonnées</div>

          <dl className="imPlayer__metaList">
            <div>
              <dt>Durée totale</dt>
              <dd>{emission.duree ?? '—'}</dd>
            </div>
            <div>
              <dt>Type de transmission</dt>
              <dd>{formatTypeEmission(emission.type_libelle)}</dd>
            </div>
            <div>
              <dt>Nombre de titres</dt>
              <dd>{emission.stats?.titres ?? '—'}</dd>
            </div>
            <div>
              <dt>Nombre de groupes</dt>
              <dd>{emission.stats?.groupes ?? '—'}</dd>
            </div>
            <div>
              <dt>Pays représentés</dt>
              <dd>{emission.stats?.pays ?? '—'}</dd>
            </div>
          </dl>

          {emission.playlist_pdf_path ? (
  <a
    className="imPlayer__playlist"
    href={`/playlists/${emission.playlist_pdf_path}`}
    target="_blank"
    rel="noreferrer"
  >
    Playlist
  </a>
) : null}
        </div>

        {/* Barre active placée dans son ouverture */}
        <div
          className="imPlayer__progress"
          style={{ '--progress': `${safeProgress}%` } as CSSProperties}
        >
          <img
            className="imPlayer__progressBase"
            src={`${PLAYER_ASSET}/progress.png`}
            alt=""
            aria-hidden="true"
          />
          <span className="imPlayer__progressFill" aria-hidden="true">
            <img src={`${PLAYER_ASSET}/progress.png`} alt="" />
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={safeProgress}
            onChange={handleProgressChange}
            aria-label="Position dans la transmission"
          />
        </div>

        {/* Couche 4 : ombres et profondeur */}
        <img
          className="imPlayer__shadows"
          src={`${PLAYER_ASSET}/player-shadows.png`}
          alt=""
          aria-hidden="true"
        />

        {/* Couche 5 : pièces mobiles et voyants */}
        <button
          type="button"
          className="imPlayer__skip imPlayer__skip--minus"
          onClick={() => onSeekRelative(-30)}
          aria-label="Reculer de 30 secondes"
        >
          <img src={`${PLAYER_ASSET}/button-minus30.png`} alt="" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="imPlayer__selector"
          onClick={handleSelectorToggle}
          aria-label={isPlaying ? 'Mettre la transmission en pause' : 'Lire la transmission'}
          aria-pressed={isPlaying}
        >
          <img
            src={`${PLAYER_ASSET}/${isPlaying ? 'selector-play.png' : 'selector-wait.png'}`}
            alt=""
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="imPlayer__skip imPlayer__skip--plus"
          onClick={() => onSeekRelative(30)}
          aria-label="Avancer de 30 secondes"
        >
          <img src={`${PLAYER_ASSET}/button-plus30.png`} alt="" aria-hidden="true" />
        </button>

        <img
          className={`imPlayer__led imPlayer__led--wait ${isPlaying ? 'is-inactive' : 'is-active'}`}
          src={`${LED_ASSET}/${isPlaying ? 'status-led-red1.png' : 'status-led-red1.png'}`}
          alt=""
          aria-hidden="true"
        />

        <img
          className={`imPlayer__led imPlayer__led--play ${isPlaying ? 'is-active' : 'is-inactive'}`}
          src={`${LED_ASSET}/${isPlaying ? 'status-led-green1.png' : 'status-led-green1.png'}`}
          alt=""
          aria-hidden="true"
        />

        <audio
          ref={selectorSoundRef}
          src={SELECTOR_SOUND}
          preload="auto"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
