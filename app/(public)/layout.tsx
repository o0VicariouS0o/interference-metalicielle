import type { ReactNode } from 'react';

import { SiteBackground } from '@/components/layout/SiteBackground';
import { Footer } from '@/components/shared/footer';
import { Header } from '@/components/shared/header';

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <SiteBackground />

      <div className="siteChassis">
        <span
          className="siteChassis__rail siteChassis__rail--left"
          aria-hidden="true"
        />

        <span
          className="siteChassis__rail siteChassis__rail--right"
          aria-hidden="true"
        />

        <Header />

        <main>{children}</main>

        <Footer />
      </div>
    </>
  );
}