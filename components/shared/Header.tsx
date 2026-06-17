import Link from 'next/link';
import { Navigation } from './Navigation';

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-(--breakpoint-desktop) items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg tracking-wide">
          Interférence Métalicielle
        </Link>
        <Navigation />
      </div>
    </header>
  );
}
