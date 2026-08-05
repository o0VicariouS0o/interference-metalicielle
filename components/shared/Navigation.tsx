'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ENTRIES = [
  { href: '/', label: 'Accueil' },
  { href: '/im', label: 'IM' },
  { href: '/net', label: 'NET' },
  { href: '/yem', label: 'YEM' },
  { href: '/contact', label: 'Contact' },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="mainNav" aria-label="Navigation principale">
      <ul className="mainNav__list">
        {ENTRIES.map((entry) => {
          const isActive = isCurrentPath(pathname, entry.href);

          return (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className={`mainNav__link${isActive ? ' mainNav__link--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {entry.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}