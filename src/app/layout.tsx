import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UniApply Tracker - Graduate Application & Outreach Tracker',
  description:
    'University application catalog with private, per-user professor outreach progress tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
