type EmissionMinimal = {
  id: string;
  titre: string;
  date_diffusion: string;
  description_courte: string | null;
  duree: string | null;
  audio_url?: string | null;
  playlist_pdf_path: string | null;
  type_libelle?: string | null;
  stats?: {
    titres: number;
    groupes: number;
    pays: number;
  };
};

type Props = {
  emission: EmissionMinimal;
  isPlaying: boolean;
  currentTimeLabel: string;
  durationLabel: string;
  progressPercent: number;
  onTogglePlayback: () => void;
  onSeekRelative: (seconds: number) => void;
};

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return d.toLocaleDateString('fr-FR', {
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

  if (match) {
    return `/visuels/emissions/sans-titres/Episode ${match[1]}.jpg`;
  }

  if (id === 'IM-HS001') {
    return '/visuels/emissions/sans-titres/Episode HS001.jpg';
  }

  return null;
}

export function LecteurIM({
  emission,
  isPlaying,
  currentTimeLabel,
  durationLabel,
  progressPercent,
  onTogglePlayback,
  onSeekRelative,
}: Props) {
  const visuel = imagePathForEmission(emission.id);

  return (
    <section
      aria-label="Lecteur Interférence Métalicielle"
      className="border border-border bg-black p-6"
    >
      <div className="grid gap-8 desktop:grid-cols-[320px_1fr_240px]">
        <div className="aspect-square overflow-hidden border border-border bg-bg">
          {visuel ? (
            <img
              src={visuel}
              alt={`Visuel de l'émission ${emission.titre}`}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-8">
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-transmission">
              {emission.id}
            </p>

            <h2 className="mt-3 font-display text-3xl">{emission.titre}</h2>

            <p className="mt-3 text-sm text-muted">
              {formatDateFr(emission.date_diffusion)}
            </p>

            {emission.description_courte ? (
              <p className="mt-6 max-w-2xl leading-7 text-muted">
                {emission.description_courte}
              </p>
            ) : null}
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Canal
                </p>
                <p className="mt-2 font-mono text-sm text-transmission">
                  Canal {emission.id}
                </p>
              </div>

              <div className="text-right">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Statut
                </p>
                <p className="mt-2 font-mono text-sm">
                  {isPlaying ? 'Lecture en cours' : 'Transmission en attente'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between font-mono text-xs text-muted">
                <span>{currentTimeLabel}</span>
                <span>{durationLabel}</span>
              </div>

              <div className="mt-3 h-2 border border-border bg-bg">
                <div
                  className="h-full bg-transmission"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-[1fr_1.5fr_1fr] items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSeekRelative(-30)}
                  className="border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:border-transmission hover:text-transmission"
                >
                  -30 sec
                </button>

                <button
                  type="button"
                  onClick={onTogglePlayback}
                  className="border border-transmission px-4 py-3 font-mono text-xs uppercase tracking-widest text-transmission hover:bg-transmission hover:text-black"
                >
                  {isPlaying ? 'Lecture en cours' : 'Transmission en attente'}
                </button>

                <button
                  type="button"
                  onClick={() => onSeekRelative(30)}
                  className="border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted hover:border-transmission hover:text-transmission"
                >
                  +30 sec
                </button>
              </div>

              <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted">
                Jauge documentaire — transmission réelle
              </p>
            </div>
          </div>
        </div>

        <aside className="border-l border-border pl-6">
          <p className="font-mono text-xs uppercase tracking-widest text-transmission">
            Métadonnées
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Durée
              </p>
              <p className="mt-2 font-mono text-sm">{emission.duree ?? '—'}</p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Type
              </p>
              <p className="mt-2 font-mono text-sm">
                {formatTypeEmission(emission.type_libelle)}
              </p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Titres
              </p>
              <p className="mt-2 font-mono text-sm">
                {emission.stats?.titres ?? '—'}
              </p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Groupes
              </p>
              <p className="mt-2 font-mono text-sm">
                {emission.stats?.groupes ?? '—'}
              </p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Pays
              </p>
              <p className="mt-2 font-mono text-sm">
                {emission.stats?.pays ?? '—'}
              </p>
            </div>

            <div className="border-t border-border pt-5">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Playlist
              </p>
              {emission.playlist_pdf_path ? (
                <a
                  href={emission.playlist_pdf_path}
                  className="mt-2 inline-block text-sm text-transmission hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Télécharger PDF
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted">—</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}