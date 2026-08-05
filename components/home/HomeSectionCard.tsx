import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  StatusLed,
  type StatusLedColor,
} from '@/components/shared/StatusLed';

type HomeSectionCardProps = {
  variant: 'im' | 'net' | 'yem';
  sectionLabel: string;
  ledColor: StatusLedColor;
  ledLabel: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  children: ReactNode;
  contentLabelledBy?: string;
};

export function HomeSectionCard({
  variant,
  sectionLabel,
  ledColor,
  ledLabel,
  title,
  description,
  ctaLabel,
  ctaHref,
  children,
  contentLabelledBy,
}: HomeSectionCardProps) {
  return (
    <article
      className={[
        'homeSectionCard',
        `homeSectionCard--${variant}`,
      ].join(' ')}
    >
      <div className="homeSectionCard__surface">
        <header className="homeSectionCard__header">
          <div className="homeSectionCard__eyebrow">
            <StatusLed
              color={ledColor}
              size="md"
              label={ledLabel}
            />

            <span>{sectionLabel}</span>
          </div>

          <h2 className="homeSectionCard__title">
            {title}
          </h2>

          <p className="homeSectionCard__description">
            {description}
          </p>
        </header>

        <div
          className="homeSectionCard__divider"
          aria-hidden="true"
        />

        <section
          className="homeSectionCard__content"
          aria-labelledby={contentLabelledBy}
        >
          {children}
        </section>

        <Link
          href={ctaHref}
          className="homeSectionCard__cta"
        >
          <span>{ctaLabel}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
