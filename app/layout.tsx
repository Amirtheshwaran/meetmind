import type { Metadata } from 'next';
import NavHeader from '@/components/NavHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'MeetMind — Meeting Workspace',
  description:
    'Record meetings, transcribe audio, synthesize key decisions, and track action items.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavHeader />
        {children}
      </body>
    </html>
  );
}
