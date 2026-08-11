import Link from 'next/link';
import { Navigation } from './Navigation';

export function Header() {
  return (
    <header className="siteHeader">
      <div className="siteHeader__frame">
        <img
          src="/assets/chassis/global/site-header-shell.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="siteHeader__panel"
        />

        <div className="siteHeader__surface">
          <Link
            href="/"
            className="siteHeader__logoLink"
            aria-label="Accueil Interférence Metalicielle"
          >
            <img
              src="/assets/logo/Logo_Rouge.svg"
              alt="Interférence Metalicielle"
              className="siteHeader__logo"
            />
          </Link>

          <span className="siteHeader__baseline">
            Centre de conservation active
            <br />
            de la mémoire du Metal.
          </span>

          <div className="siteHeader__navigation">
            <Navigation />
          </div>
        </div>
      </div>
    </header>
  );
}
