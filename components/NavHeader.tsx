'use client';

export default function NavHeader() {
  const handleOpenModal = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-new-meeting-modal'));
    }
  };

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <a href="/" className="nav-brand">
          <div className="brand-logo-m">
            <svg width="34" height="32" viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 6 25 V 10 C 6 8.3 7.3 7 9 7 C 10.4 7 11.6 8 12.1 9.4 L 17 20 L 21.9 9.4 C 22.4 8 23.6 7 25 7 C 26.7 7 28 8.3 28 10 V 25"
                stroke="url(#header-m-grad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="header-m-grad" x1="6" y1="7" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4F46E5" />
                  <stop offset="0.4" stopColor="#38BDF8" />
                  <stop offset="1" stopColor="#C084FC" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-name">MeetMind</span>
        </a>

        <nav className="nav-center-links">
          <a href="/" className="nav-item">Features</a>
          <a href="#pricing" className="nav-item">Pricing</a>
          <a href="#resources" className="nav-item">Resources</a>
        </nav>

        <div className="nav-right-actions">
          <button
            id="btn-nav-new-meeting"
            className="btn-new-meeting"
            onClick={handleOpenModal}
          >
            + New Meeting
          </button>
          <div className="user-avatar-chip" title="Amirthesh">AM</div>
        </div>
      </div>
    </header>
  );
}
