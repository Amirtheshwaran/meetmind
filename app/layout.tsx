import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MeetMind — Meeting Workspace',
  description:
    'Self-hosted meeting intelligence platform. Record meetings, transcribe audio, synthesize key decisions, and track action items.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <a href="/" className="nav-logo">
              <div className="nav-logo-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                </svg>
              </div>
              MeetMind
            </a>
            <span className="badge badge-done" style={{ textTransform: 'none' }}>
              Workspace
            </span>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

