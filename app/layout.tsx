import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MeetMind — Automated Meeting Summaries',
  description:
    'Record meetings, get instant AI-powered summaries, action items, and shareable links. Powered by Groq Whisper and Gemini.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <a href="/" className="nav-logo">
              <div className="nav-logo-icon">🎙</div>
              MeetMind
            </a>
            <span className="text-xs text-muted">AI Meeting Assistant</span>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
