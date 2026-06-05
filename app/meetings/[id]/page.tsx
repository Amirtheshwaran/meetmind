import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMeeting } from '@/lib/db';
import SummaryCard from '@/components/SummaryCard';
import ActionItemsTable from '@/components/ActionItemsTable';
import ShareButton from '@/components/ShareButton';
import TranscriptToggle from '@/components/TranscriptToggle';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const meeting = await getMeeting(id);
  return { title: meeting ? `${meeting.title} — MeetMind` : 'Meeting Not Found' };
}

export default async function MeetingDetailPage({ params }: Props) {
  const { id } = await params;
  const meeting = await getMeeting(id);

  if (!meeting) notFound();

  const summary = meeting.meeting_summaries;
  const actions = meeting.action_items ?? [];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatDuration = (s: number) => {
    if (!s) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <main>
      <div className="container">
        {/* Back + header */}
        <div className="page-header">
          <Link href="/" className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex' }}>
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between gap-4" style={{ flexWrap: 'wrap' }}>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.6rem' }}>{meeting.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge badge-${meeting.status.toLowerCase()}`}>{meeting.status}</span>
                <span className="text-sm text-muted">{formatDate(meeting.created_at)}</span>
                {formatDuration(meeting.duration_sec) && (
                  <span className="tag text-xs">⏱ {formatDuration(meeting.duration_sec)}</span>
                )}
              </div>
            </div>
            {summary && <ShareButton meetingId={meeting.id} />}
          </div>
        </div>

        {meeting.status !== 'DONE' && (
          <div className="card" style={{ marginBottom: 24 }}>
            <p className="text-secondary">
              {meeting.status === 'ERROR'
                ? `⚠ Processing failed: ${meeting.error_message}`
                : `⟳ This meeting is currently ${meeting.status.toLowerCase()}…`}
            </p>
          </div>
        )}

        {summary && (
          <>
            {/* Summary */}
            <section className="card mb-6">
              <p className="section-title mb-4">📋 Meeting Summary</p>
              <SummaryCard summary={summary} />
            </section>

            {/* Action Items */}
            <section className="card mb-6">
              <p className="section-title mb-4">✅ Action Items ({actions.length})</p>
              <ActionItemsTable items={actions} meetingId={meeting.id} />
            </section>

            {/* Transcript */}
            {meeting.raw_transcript && (
              <section className="mb-6">
                <TranscriptToggle transcript={meeting.raw_transcript} />
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
