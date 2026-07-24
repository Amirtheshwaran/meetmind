import { notFound } from 'next/navigation';
import { getMeeting } from '@/lib/db';
import MeetingHeader from '@/components/MeetingHeader';
import AudioPlayer from '@/components/AudioPlayer';
import SummaryCard from '@/components/SummaryCard';
import ActionItemsTable from '@/components/ActionItemsTable';
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

  return (
    <main>
      <div className="container">
        {/* Header Component */}
        <MeetingHeader meeting={meeting} summary={summary} actionItems={actions} />

        {/* Audio Player */}
        {meeting.storage_path && (
          <section className="mb-6">
            <p className="section-title mb-2">Recording Playback</p>
            <AudioPlayer storagePath={meeting.storage_path} />
          </section>
        )}

        {meeting.status !== 'DONE' && (
          <div className="card mb-6">
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
              <p className="section-title mb-4">Meeting Executive Summary</p>
              <SummaryCard summary={summary} />
            </section>

            {/* Action Items */}
            <section className="card mb-6">
              <p className="section-title mb-4">Action Items & Tasks ({actions.length})</p>
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

