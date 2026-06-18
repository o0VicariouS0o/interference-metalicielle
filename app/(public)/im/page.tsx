import { supabase } from '@/lib/supabase';

type Emission = {
  id: string;
  numero: number | null;
  titre: string;
  date_diffusion: string;
  description: string | null;
};

export default async function ImPage() {
  const { data: emissions, error } = await supabase
    .from('emissions')
    .select('id, numero, titre, date_diffusion, description')
    .order('date_diffusion', { ascending: false });

  return (
    <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
      <h1 className="font-display text-3xl">IM</h1>
      <p className="mt-4 text-muted">
        Liste temporaire des émissions importées depuis Supabase.
      </p>

      {error ? (
        <p className="mt-8 text-transmission">{error.message}</p>
      ) : (
        <div className="mt-8 space-y-4">
          {(emissions as Emission[]).map((emission) => (
            <article key={emission.id} className="border border-border p-4">
              <p className="font-mono text-sm text-muted">{emission.id}</p>
              <h2 className="mt-2 font-display text-xl">{emission.titre}</h2>
              <p className="mt-2 text-sm text-muted">
                {emission.date_diffusion}
              </p>
              {emission.description ? (
                <p className="mt-4 text-sm text-muted">
                  {emission.description}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}