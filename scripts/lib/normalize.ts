export function trim(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(/\s+/g, ' ');
  return s.length === 0 ? null : s;
}

export function int(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null;
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

export function upper(v: unknown): string | null {
  const s = trim(v);
  return s ? s.toUpperCase() : null;
}

export function url(v: unknown): string | null {
  const s = trim(v);
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : null;
}

export function date(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;

  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }

  const s = String(v).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function emissionId(numero: unknown): string | null {
  if (numero === null || numero === undefined || numero === '') return null;

  if (typeof numero === 'number' && Number.isFinite(numero)) {
    const n = Math.trunc(numero);
    if (n <= 0) return null;
    return `IM-${String(n).padStart(3, '0')}`;
  }

  const s = String(numero).trim().toUpperCase();
  if (!s || s === 'NULL') return null;

  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    if (n <= 0) return null;
    return `IM-${String(n).padStart(3, '0')}`;
  }

  if (/^[A-Z0-9]+$/.test(s)) {
    return `IM-${s}`;
  }

  return null;
}

export function emissionNumero(numero: unknown): number | null {
  if (typeof numero === 'number' && Number.isFinite(numero)) {
    const n = Math.trunc(numero);
    return n > 0 ? n : null;
  }

  if (numero === null || numero === undefined) return null;

  const s = String(numero).trim();
  if (!s || !/^\d+$/.test(s)) return null;

  const n = parseInt(s, 10);
  return n > 0 ? n : null;
}