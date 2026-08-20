import { HomeHero } from '@/components/home/HomeHero';
import { HomeSectionCardIM } from '@/components/home/HomeSectionCardIM';
import { HomeSectionCardNET } from '@/components/home/HomeSectionCardNET';
import { HomeSectionCardYEM } from '@/components/home/HomeSectionCardYEM';
import { supabase } from '@/lib/supabase';

type Emission = {
  id: string;
  titre: string;
  description_courte: string | null;
  duree: string | null;
  audio_url: string | null;
};

type YemEmission = {
  id: string;
  titre: string;
  yem_type: string | null;
  yem_observation: string | null;
};

export async function HomePage() {
  const { data: recentEmissionsData } =
    await supabase
      .from('emissions')
      .select(
        'id, titre, description_courte, duree',
      )
      .order('date_diffusion', {
        ascending: false,
      })
      .limit(4);

  const { count: emissionsCount } =
    await supabase
      .from('emissions')
      .select('*', {
        count: 'exact',
        head: true,
      });

  const { count: artistesCount } =
    await supabase
      .from('artistes')
      .select('*', {
        count: 'exact',
        head: true,
      });

  const { count: albumsCount } =
    await supabase
      .from('albums')
      .select('*', {
        count: 'exact',
        head: true,
      });

  const { count: morceauxCount } =
    await supabase
      .from('morceaux')
      .select('*', {
        count: 'exact',
        head: true,
      });

  const { data: yemData } = await supabase
    .from('emissions')
    .select(
      'id, titre, yem_type, yem_observation',
    )
    .not('yem_observation', 'is', null)
    .order('date_diffusion', {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  const recentEmissions =
    (recentEmissionsData ?? []) as Emission[];

  const yem =
    yemData as YemEmission | null;

  return (
    <section className="homePngMachine">
      <div className="homeStructureConnector homeStructureConnector--top" aria-hidden="true">
        <img src="/assets/chassis/global/site-connector-top.png" alt="" draggable={false} />
      </div>

      <div className="homePngModule homePngModule--hero">
        <img
          src="/assets/chassis/global/home-hero-shell.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="homePngModule__shell"
        />

        <header className="homePngMachine__heading">
          <p className="homePngMachine__eyebrow">
            Mémoire active du réseau
          </p>

          <h1 className="homePngMachine__title">
            Interférence Metalicielle
          </h1>
        </header>

        <div className="homePngModule__content homePngModule__content--hero">
          <HomeHero />
        </div>

        <img
          src="/assets/chassis/global/overlay-hero.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="homePngModule__overlay homePngModule__overlay--hero"
        />
      </div>

      <div className="homeStructureConnector homeStructureConnector--middle" aria-hidden="true">
        <img src="/assets/chassis/global/site-connector-middle.png" alt="" draggable={false} />
      </div>

      <div className="homePngModule homePngModule--modules">
        <img
          src="/assets/chassis/global/home-modules-shell.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="homePngModule__shell"
        />

        <section className="homePngModule__content homePngModule__content--modules homeSections">
          <HomeSectionCardIM recentEmissions={recentEmissions} />

          <HomeSectionCardNET
            emissionsCount={emissionsCount}
            artistesCount={artistesCount}
            albumsCount={albumsCount}
            morceauxCount={morceauxCount}
          />

          <HomeSectionCardYEM yem={yem} />
        </section>

        <img
          src="/assets/chassis/global/overlay-modules.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="homePngModule__overlay homePngModule__overlay--modules"
        />
      </div>

      <div className="homeStructureConnector homeStructureConnector--bottom" aria-hidden="true">
        <img src="/assets/chassis/global/site-connector-bottom.png" alt="" draggable={false} />
      </div>
    </section>
  );
}