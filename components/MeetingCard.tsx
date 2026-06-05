import type { Meeting, MeetingSummary } from '@/lib/db';
import Link from 'next/link';

interface MeetingCardProps {
  meeting: Meeting & { meeting_summaries?: MeetingSummary | null };
}

const STATUS_LABEL: Record<string, string> = {
  DONE: 'Done',
  PROCESSING: 'Processing',
  UPLOADING: 'Uploading',
  RECORDING: 'Recording',
  ERROR: 'Error',
};

export default function MeetingCard({ meeting }: MeetingCardProps) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const formatDuration = (secs: number) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const summary = meeting.meeting_summaries;
  const statusClass = `badge badge-${meeting.status.toLowerCase()}`;

  const inner = (
    <div className="card meeting-card">
      <div className="meeting-card-meta">
        <span className={statusClass}>{STATUS_LABEL[meeting.status]}</span>
        <span className="meeting-card-date">{formatDate(meeting.created_at)}</span>
      </div>

      <div>
        <p className="meeting-card-title">{meeting.title}</p>
        {summary?.overview && (
          <p className="meeting-card-preview">{summary.overview}</p>
        )}
        {meeting.status === 'ERROR' && meeting.error_message && (
          <p className="text-sm" style={{ color: 'var(--red)' }}>
            ⚠ {meeting.error_message}
          </p>
        )}
      </div>

      <div className="meeting-card-footer">
        {formatDuration(meeting.duration_sec) && (
          <span className="tag">⏱ {formatDuration(meeting.duration_sec)}</span>
        )}
        {summary?.topics?.slice(0, 2).map((t, i) => (
          <span key={i} className="tag">{t}</span>
        ))}
        {(summary?.topics?.length ?? 0) > 2 && (
          <span className="tag">+{summary!.topics.length - 2} more</span>
        )}
      </div>
    </div>
  );

  if (meeting.status === 'DONE') {
    return <Link href={`/meetings/${meeting.id}`} className="card-link">{inner}</Link>;
  }

  return <div style={{ cursor: 'default' }}>{inner}</div>;
}
