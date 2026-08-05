import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = 'https://interference-metalicielle.fr';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: 'Interférence Metalicielle',
    template: '%s | Interférence Metalicielle',
  },

  description:
    "Site officiel de l'émission Interférence Metalicielle, diffusée sur Radio Pons 97 FM.",

  applicationName: 'Interférence Metalicielle',

  authors: [
    {
      name: 'Interférence Metalicielle',
      url: siteUrl,
    },
  ],

  creator: 'Interférence Metalicielle',
  publisher: 'Interférence Metalicielle',

  keywords: [
    'Interférence Metalicielle',
    'Metal',
    'radio Metal',
    'Radio Pons',
    'Radio Pons 97 FM',
    'émission Metal',
    'musique Metal',
  ],

  alternates: {
    canonical: '/',
  },

  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'Interférence Metalicielle',
    title: 'Interférence Metalicielle',
    description:
      "Site officiel de l'émission Interférence Metalicielle, diffusée sur Radio Pons 97 FM.",
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Interférence Metalicielle',
    description:
      "Site officiel de l'émission Interférence Metalicielle, diffusée sur Radio Pons 97 FM.",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: '/apple-touch-icon.png',
  },

  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#050505',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bg text-text">
        {children}
      </body>
    </html>
  );
}