import { supabase } from '@/lib/supabase';

type Observation = {
  id: string;
  titre: string;
  yem_type: string | null;
  yem_observation: string | null;
  date_diffusion: string;
};

export default async function YemPage() {
  const { data } = await supabase
    .from('emissions')
    .select(
      `
      id,
      titre,
      yem_type,
      yem_observation,
      date_diffusion
    `,
    )
    .not('yem_observation', 'is', null)
    .order('date_diffusion', { ascending: false });

  const observations = (data ?? []) as Observation[];

  return (
    <section className="mx-auto max-w-[960px] px-6 py-16">
      <header>
        <p className="font-mono text-sm uppercase tracking-widest text-yem">
          YEM
        </p>

        <h1 className="mt-4 font-display text-5xl">
          Journal de bord
        </h1>

        <p className="mt-8 max-w-3xl leading-8 text-muted">
          YEM observe les transmissions archivées par le réseau.
          Les fragments consignés dans ce registre ne constituent
          ni une analyse ni un jugement.
          Ils représentent les traces mémorielles détectées lors
          de la conservation des archives.
        </p>
      </header>

      <section className="mt-16">
        <div className="space-y-12">
          {observations.map((observation) => (
            <article
              key={observation.id}
              className="border border-border p-8"
            >
              <div className="flex flex-wrap items-center gap-4">
                <p className="font-mono text-xs uppercase tracking-widest text-yem">
                  {observation.yem_type ?? 'Observation'}
                </p>

                <span className="text-muted">•</span>

                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  {observation.id}
                </p>
              </div>

              <h2 className="mt-4 font-display text-2xl">
                {observation.titre}
              </h2>

              <blockquote className="mt-8 whitespace-pre-line leading-8 text-neutral-200">
                {observation.yem_observation}
              </blockquote>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}