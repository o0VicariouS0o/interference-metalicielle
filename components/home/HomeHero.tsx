'use client';

import { useEffect, useState } from 'react';
import { HomeFeaturedPlayer } from '@/components/home/home-featured-player';
import { supabase } from '@/lib/supabase';

type Emission = {
  id: string;
  titre: string;
  description_courte: string | null;
  duree: string | null;
  audio_url: string | null;
};

type FeaturedResult = {
  emission_id: string;
  source: string;
};

function imagePathForEmission(id: string): string | null {
  const match = id.match(/^IM-(\d{3})$/);
  if (match) return `/visuels/emissions/paysage/AC Episode ${match[1]}.jpg`;
  const horsSerieMatch = id.match(/^IM-HS(\d{3})$/);
  if (horsSerieMatch) {
    return `/visuels/emissions/paysage/AC Episode HS${horsSerieMatch[1]}.jpg`;
  }
  return null;
}

export function HomeHero() {
  const [emission, setEmission] = useState<Emission | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedEmission() {
      const { data: featuredData, error: featuredError } =
        await supabase.rpc('get_home_featured_emission');

      if (cancelled) return;

      if (featuredError || !featuredData?.length) {
        setHasError(true);
        setLoading(false);
        return;
      }

      const featured = featuredData[0] as FeaturedResult;

      const { data: emissionData, error: emissionError } =
        await supabase
          .from('emissions')
          .select('id, titre, description_courte, duree, audio_url')
          .eq('id', featured.emission_id)
          .single();

      if (cancelled) return;

      if (emissionError || !emissionData) {
        setHasError(true);
        setLoading(false);
        return;
      }

      setEmission(emissionData as Emission);
      setLoading(false);
    }

    void loadFeaturedEmission();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || hasError || !emission) {
    return (
      <section className="homeHero" aria-label="Émission à la une">
        <div className="homeHero__content">
          <div className="homeHero__topline">
            <span>Émission à la une</span>
          </div>
          <p className="homeHero__description">
            {hasError
              ? 'Impossible de déterminer la transmission du jour.'
              : 'Synchronisation de la transmission…'}
          </p>
        </div>
      </section>
    );
  }

  const visuel = imagePathForEmission(emission.id);

  return (
    <section className="homeHero" aria-labelledby="home-hero-title">
      <div className="homeHero__artwork">
        {visuel ? (
          <img src={visuel} alt={emission.titre} className="homeHero__image" />
        ) : (
          <div className="homeHero__imageFallback" aria-hidden="true" />
        )}
      </div>

      <div className="homeHero__content">
        <div className="homeHero__topline">
          <span>Émission à la une</span>
          <span className="homeHero__identifier">
            Identifiant&nbsp;: {emission.id}
          </span>
        </div>

        <p className="homeHero__id">{emission.id}</p>

        <h1 id="home-hero-title" className="homeHero__title">
          {emission.titre}
        </h1>

        {emission.description_courte ? (
          <p className="homeHero__description">{emission.description_courte}</p>
        ) : null}

        <div className="homeHero__player">
          <HomeFeaturedPlayer
            audioUrl={emission.audio_url}
            durationLabel={emission.duree}
          />
        </div>

        <div className="homeHero__metadata">
          <div className="homeHero__metadataItem">
            <span>Catégorie</span>
            <strong>Thématique</strong>
          </div>
          <div className="homeHero__metadataItem">
            <span>Niveau d’intégrité</span>
            <strong>100%</strong>
          </div>
          <div className="homeHero__metadataItem">
            <span>Statut</span>
            <strong>Disponible</strong>
          </div>
        </div>

        <a className="homeHero__cta" href={`/im?e=${emission.id}`}>
          <span>Accéder à IM</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}