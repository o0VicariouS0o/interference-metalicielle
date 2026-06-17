import Link from 'next/link';

const ENTRIES = [
  { href: '/', label: 'Accueil' },
  { href: '/im', label: 'IM' },
  { href: '/net', label: 'NET' },
  { href: '/yem', label: 'YEM' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Navigation() {
  return (
    <nav aria-label="Navigation principale">
      <ul className="flex gap-6 text-sm uppercase tracking-wider">
        {ENTRIES.map((entry) => (
          <li key={entry.href}>
            <Link href={entry.href} className="text-text transition-colors hover:text-transmission">
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
