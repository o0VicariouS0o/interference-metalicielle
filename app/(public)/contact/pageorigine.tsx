import '../../styles/contact.css';

const partners = [
  {
    name: 'Radio Pons 97 FM',
    href: 'https://www.radiopons97fm.com/',
    image: '/assets/contact/partners/radiopons.png',
    className: 'contactPartner--radio',
  },
  {
    name: 'Festival 666',
    href: 'https://www.festival666.com/',
    image: '/assets/contact/partners/festival666.png',
    className: 'contactPartner--festival',
  },
  {
    name: 'Savage Lands',
    href: 'https://savagelands.org/fr/',
    image: '/assets/contact/partners/savagelands.png',
    className: 'contactPartner--savage',
    support: true,
  },
];

export default function ContactPage() {
  return (
    <main className="contactPage">
      <section className="contactSignal" aria-labelledby="contact-title">
        <p className="contactSignal__status">
          <span className="contactSignal__led" aria-hidden="true" />
          Canal de transmission disponible
        </p>

        <h1 id="contact-title" className="contactSignal__title">
          Transmettre un signal
        </h1>

        <a
          href="mailto:yem@interference-metalicielle.fr"
          className="contactSignal__email"
        >
          yem@interference-metalicielle.fr
        </a>
      </section>

      <section className="contactPartners" aria-labelledby="contact-partners-title">
        <div className="contactPartners__heading">
          <span className="contactPartners__line" aria-hidden="true" />
          <h2 id="contact-partners-title">Amis et partenaires</h2>
          <span className="contactPartners__line" aria-hidden="true" />
        </div>

        <div className="contactPartners__grid">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noreferrer"
              className={`contactPartner ${partner.className}`}
              aria-label={`Visiter le site officiel de ${partner.name}`}
            >
              {partner.support ? (
  <div className="contactPartner__support">
    <span>YEM soutient</span>
    <strong>Le Metal uni contre les incendies</strong>
  </div>
) : (
  <div
    className="contactPartner__support contactPartner__support--placeholder"
    aria-hidden="true"
  >
    <span>YEM soutient</span>
    <strong>Le Metal uni contre les incendies</strong>
  </div>
)}
              
              <img
                src={partner.image}
                alt={partner.name}
                className="contactPartner__image"
              />

              <span className="contactPartner__external" aria-hidden="true">
                Site officiel ↗
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
