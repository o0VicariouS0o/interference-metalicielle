import Image from 'next/image';
import Link from 'next/link';

type HomeTransmissionMiniCardProps = {
  id: string;
  title: string;
  imageSrc: string | null;
};

export function HomeTransmissionMiniCard({
  id,
  title,
  imageSrc,
}: HomeTransmissionMiniCardProps) {
  return (
    <Link
      href={`/im?e=${encodeURIComponent(id)}`}
      className="homeTransmissionMiniCard"
      aria-label={`Écouter ${id} — ${title}`}
    >
      <span className="homeTransmissionMiniCard__visual">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="(max-width: 760px) 42vw, 100px"
            className="homeTransmissionMiniCard__image"
          />
        ) : (
          <span
            className="homeTransmissionMiniCard__fallback"
            aria-hidden="true"
          />
        )}

        <span
          className="homeTransmissionMiniCard__overlay"
          aria-hidden="true"
        />
      </span>

      <span className="homeTransmissionMiniCard__id">{id}</span>

      <span className="homeTransmissionMiniCard__title">{title}</span>
    </Link>
  );
}