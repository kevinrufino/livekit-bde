import type { Metadata } from 'next';
import { JetBrains_Mono, Public_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const sans = Public_Sans({
  variable: '--font-dk-sans',
  subsets: ['latin'],
});

const mono = JetBrains_Mono({
  variable: '--font-dk-mono',
  subsets: ['latin'],
});

const display = Space_Grotesk({
  variable: '--font-dk-display',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DeadKit',
  description: 'Realtime infrastructure for the afterlife.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-dk-theme="dark"
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
