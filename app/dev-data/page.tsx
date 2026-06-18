import { supabase } from '@/lib/supabase';

const TABLES = [
  'pays',
  'types_emission',
  'artistes',
  'albums',
  'emissions',
  'morceaux',
] as const;

async function getCount(table: (typeof TABLES)[number]) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    return {
      table,
      count: null,
      error: error.message,
    };
  }

  return {
    table,
    count,
    error: null,
  };
}

export default async function DevDataPage() {
  const results = await Promise.all(TABLES.map((table) => getCount(table)));

  return (
    <section className="mx-auto max-w-(--breakpoint-desktop) px-6 py-16">
      <h1 className="font-display text-3xl">Dev Data</h1>
      <p className="mt-4 text-muted">
        Page temporaire de contrôle des données Supabase.
      </p>

      <div className="mt-8 overflow-hidden border border-border">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Nombre de lignes</th>
              <th className="px-4 py-3">Erreur</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.table} className="border-b border-border">
                <td className="px-4 py-3 font-mono">{result.table}</td>
                <td className="px-4 py-3">{result.count ?? '—'}</td>
                <td className="px-4 py-3 text-transmission">
                  {result.error ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}