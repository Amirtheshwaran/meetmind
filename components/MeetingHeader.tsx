'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShareButton from '@/components/ShareButton';
import ExportMenu from '@/components/ExportMenu';
import type { Meeting, MeetingSummary, ActionItem } from '@/lib/db';

interface MeetingHeaderProps {
  meeting: Meeting;
  summary: MeetingSummary | null;
  actionItems: ActionItem[];
}

export default function MeetingHeader({ meeting, summary, actionItems }: MeetingHeaderProps) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatDuration = (s: number) => {
    if (!s) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    setIsEditingTitle(false);
    await fetch(`/api/meetings/${meeting.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() }),
    });
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${meeting.title}"?`)) return;
    setIsDeleting(true);
    await fetch(`/api/meetings/${meeting.id}`, { method: 'DELETE' });
    router.push('/');
  };

  return (
    <div className="page-header">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Link href="/" className="btn btn-ghost btn-sm">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2">
          {summary && <ExportMenu meeting={meeting} summary={summary} actionItems={actionItems} />}
          {summary && <ShareButton meetingId={meeting.id} />}
          <button
            onClick={handleDelete}
            className="btn btn-danger btn-sm"
            disabled={isDeleting}
            title="Delete Meeting"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div>
        {isEditingTitle ? (
          <div className="flex items-center gap-2 max-w-xl">
            <input
              type="text"
              className="input text-xl font-bold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveTitle}>
              Save
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingTitle(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <h1
            className="page-title flex items-center gap-2 group cursor-pointer hover:opacity-80"
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit title"
            style={{ fontSize: '1.75rem' }}
          >
            <span>{title}</span>
            <span className="text-xs text-muted font-normal">✏️</span>
          </h1>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={`badge badge-${meeting.status.toLowerCase()}`}>{meeting.status}</span>
          <span className="text-sm text-secondary">{formatDate(meeting.created_at)}</span>
          {formatDuration(meeting.duration_sec) && (
            <span className="tag text-xs">⏱ {formatDuration(meeting.duration_sec)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
