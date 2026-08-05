import Image from 'next/image';
import Link from 'next/link';
import { StatusLed } from '@/components/shared/StatusLed';

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="siteFooter__frame">
        <img
          src="/assets/chassis/global/site-footer-shell.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="siteFooter__panel"
        />

        <div className="siteFooter__surface">
          <div className="siteFooter__brand">
            <Link
              href="/"
              className="siteFooter__brandLink"
              aria-label="Accueil Interférence Metalicielle"
            >
              <Image
                src="/assets/logo/Logo_Rouge.svg"
                alt="Interférence Metalicielle"
                width={150}
                height={60}
                className="siteFooter__logo"
              />
            </Link>

            <p className="siteFooter__baseline">
              Centre de conservation active
              <br />
              de la mémoire du Metal.
            </p>
          </div>

          <div className="siteFooter__status">
            <div className="siteFooter__sectionLabel">
              <StatusLed
                color="green"
                size="sm"
                label="Réseau opérationnel"
              />
              <span>État du réseau</span>
            </div>

            <dl className="siteFooter__statusList">
              <div>
                <dt>Statut</dt>
                <dd>Réseau opérationnel</dd>
              </div>

              <div>
                <dt>Protocole</dt>
                <dd>IM / Nœud principal</dd>
              </div>

              <div>
                <dt>Synchronisation</dt>
                <dd>Active</dd>
              </div>
            </dl>
          </div>

          <div className="siteFooter__broadcast">
            <p className="siteFooter__sectionLabel">
              Diffusion officielle
            </p>

            <p className="siteFooter__broadcastText">
              Interférence Metalicielle est diffusée chaque semaine sur
              Radio Pons 97 FM.
            </p>
          </div>

          <nav
            className="siteFooter__navigation"
            aria-label="Navigation de pied de page"
          >
            <p className="siteFooter__sectionLabel">Accès</p>

            <ul>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/im">Transmissions</Link></li>
              <li><Link href="/net">Réseau NET</Link></li>
              <li><Link href="/yem">Journal YEM</Link></li>
            </ul>
          </nav>

          <div className="siteFooter__bottom">
            <p>© 2026 Interférence Metalicielle</p>
            <p className="siteFooter__node">
              YEM // NODE IM-01 // CANAL STABLE
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
