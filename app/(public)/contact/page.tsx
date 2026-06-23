export default function ContactPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-[900px] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-sm uppercase tracking-widest text-transmission">
        Contact
      </p>

      <h1 className="mt-6 font-display text-5xl">
        Contact
      </h1>

      <a
        href="mailto:contact@interferencemetalicielle.fr"
        className="mt-12 text-2xl hover:text-transmission"
      >
        contact@interferencemetalicielle.fr
      </a>

      <div className="mt-20">
        <p className="font-mono text-sm uppercase tracking-widest text-muted">
          Radio Pons 97 FM
        </p>

        <a
          href="https://radiopons.fr"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex border border-border px-6 py-3 font-mono text-sm uppercase tracking-widest hover:border-transmission hover:text-transmission"
        >
          Accéder au site
        </a>
      </div>
    </section>
  );
}