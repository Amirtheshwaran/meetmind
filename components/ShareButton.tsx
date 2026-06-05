'use client';
import { useState } from 'react';

export default function ShareButton({ meetingId }: { meetingId: string }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/share`);
      const data = await res.json();
      const url = `${window.location.origin}/share/${data.shareToken}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        className={`btn ${copied ? 'btn-secondary' : 'btn-primary'}`}
        onClick={handleShare}
        disabled={loading}
      >
        {loading ? '⟳ Loading…' : copied ? '✓ Copied!' : '🔗 Share Meeting'}
      </button>
      {shareUrl && (
        <span className="share-url">{shareUrl}</span>
      )}
    </div>
  );
}
