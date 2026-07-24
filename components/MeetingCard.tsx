'use client';

import type { Meeting, MeetingSummary, ActionItem } from '@/lib/db';
import Link from 'next/link';

interface MeetingCardProps {
  meeting: Meeting & {
    meeting_summaries?: MeetingSummary | null;
    action_items?: ActionItem[];
  };
  onDelete?: (id: string) => void;
}

export default function MeetingCard({ meeting, onDelete }: MeetingCardProps) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatDuration = (secs: number) => {
    if (!secs) return '12m';
    const m = Math.floor(secs / 60);
    return `${m}m`;
  };

  const summary = meeting.meeting_summaries;
  const actions = meeting.action_items || [];
  const actionCount = actions.length;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${meeting.title}"?`)) {
      onDelete?.(meeting.id);
    }
  };

  return (
    <div className="card-meetmind">
      <div>
        {/* Title & Status Pill Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="card-meetmind-title">{meeting.title}</h3>
          <span
            className={`pill-badge ${
              meeting.status === 'DONE' ? 'pill-done' : 'pill-processing'
            }`}
          >
            {meeting.status === 'DONE' ? 'Done' : 'Processing'}
          </span>
        </div>

        {/* Meta Info Line */}
        <div className="flex items-center gap-2 mb-3 text-xs text-secondary">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video
          </span>
          <span>•</span>
          <span>⏱ {formatDuration(meeting.duration_sec)}</span>
          <span>•</span>
          <span>{formatDate(meeting.created_at)}</span>

          {/* Attendee Avatar circles */}
          <div className="flex items-center -space-x-1.5 ml-auto">
            <div className="mini-user-avatar">AM</div>
            <div className="mini-user-avatar" style={{ background: '#4f46e5' }}>SR</div>
          </div>
        </div>

        {/* Summary Snippet Preview */}
        <p className="card-meetmind-preview mb-3">
          {summary?.overview
            ? summary.overview
            : 'Transcribing and processing audio summary...'}
        </p>

        {/* Action Items Count */}
        <div className="text-xs text-secondary font-medium mb-3">
          {actionCount} action items
        </div>
      </div>

      {/* Footer 3 Action Buttons */}
      <div className="card-meetmind-footer">
        <Link href={`/meetings/${meeting.id}`} className="card-footer-btn">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </Link>
        <Link href={`/meetings/${meeting.id}#transcript`} className="card-footer-btn">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Transcript
        </Link>
        <button
          className="card-footer-btn"
          onClick={(e) => {
            e.preventDefault();
            const shareUrl = `${window.location.origin}/meetings/${meeting.id}`;
            navigator.clipboard.writeText(shareUrl);
            alert('Meeting link copied to clipboard!');
          }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
}
