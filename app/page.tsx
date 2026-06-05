'use client';
import { useState, useEffect, useCallback } from 'react';
import MeetingCard from '@/components/MeetingCard';
import Recorder from '@/components/Recorder';
import StatusTracker from '@/components/StatusTracker';
import type { Meeting, MeetingSummary } from '@/lib/db';

type MeetingWithSummary = Meeting & { meeting_summaries?: MeetingSummary | null };

type ModalState =
  | { view: 'none' }
  | { view: 'title' }
  | { view: 'recording'; title: string }
  | { view: 'processing'; meetingId: string; durationSec: number };

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<MeetingWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ view: 'none' });
  const [titleInput, setTitleInput] = useState('');
  const [recordStart, setRecordStart] = useState(0);

  const fetchMeetings = useCallback(async () => {
    const res = await fetch('/api/meetings');
    if (res.ok) {
      const data = await res.json();
      setMeetings(data.meetings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMeetings();
    // Poll every 5s if any meeting is processing
    const id = setInterval(() => {
      setMeetings((prev) => {
        const hasActive = prev.some((m) =>
          ['UPLOADING', 'PROCESSING', 'RECORDING'].includes(m.status)
        );
        if (hasActive) fetchMeetings();
        return prev;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [fetchMeetings]);

  const startFlow = () => setModal({ view: 'title' });

  const handleTitleSubmit = () => {
    const t = titleInput.trim() || `Meeting ${new Date().toLocaleDateString()}`;
    setTitleInput('');
    setRecordStart(Date.now());
    setModal({ view: 'recording', title: t });
  };

  const handleRecordComplete = (meetingId: string) => {
    const dur = Math.round((Date.now() - recordStart) / 1000);
    setModal({ view: 'processing', meetingId, durationSec: dur });
    fetchMeetings();
  };

  const closeModal = () => {
    setModal({ view: 'none' });
    fetchMeetings();
  };

  const doneMeetings = meetings.filter((m) => m.status === 'DONE');
  const activeMeetings = meetings.filter((m) => m.status !== 'DONE');

  return (
    <main>
      <div className="container">
        {/* Header */}
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Meeting Dashboard</h1>
            <p className="page-subtitle">
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={startFlow}>
            + New Meeting
          </button>
        </div>

        {/* Active meetings */}
        {activeMeetings.length > 0 && (
          <div className="mb-6">
            <p className="section-title">🔄 In Progress</p>
            <div className="grid grid-2">
              {activeMeetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          </div>
        )}

        {/* Completed meetings */}
        {loading ? (
          <div className="empty-state">
            <div className="spin" style={{ fontSize: '2rem' }}>⟳</div>
            <p className="mt-4 text-secondary">Loading meetings…</p>
          </div>
        ) : doneMeetings.length === 0 && activeMeetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎙</div>
            <h3>No meetings yet</h3>
            <p>Record your first meeting to get started.</p>
            <button className="btn btn-primary mt-4" onClick={startFlow}>
              + Record First Meeting
            </button>
          </div>
        ) : (
          doneMeetings.length > 0 && (
            <>
              <p className="section-title mb-4">✓ Completed Meetings</p>
              <div className="grid grid-2">
                {doneMeetings.map((m) => (
                  <MeetingCard key={m.id} meeting={m} />
                ))}
              </div>
            </>
          )
        )}
      </div>

      {/* ── Modal: Title Input ── */}
      {modal.view === 'title' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">New Meeting</h2>
            <div className="form-group">
              <label className="form-label">Meeting Title</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Sprint Planning Q3"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary w-full" onClick={handleTitleSubmit}>
                Continue to Record →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Recorder ── */}
      {modal.view === 'recording' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">🎙 Recording: {modal.title}</h2>
            <Recorder
              meetingTitle={modal.title}
              onComplete={handleRecordComplete}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {/* ── Modal: Processing ── */}
      {modal.view === 'processing' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">🤖 Processing Meeting</h2>
            <p className="text-sm text-secondary mb-4">
              Your audio is being transcribed and analysed. This takes 30–90 seconds.
            </p>
            <StatusTracker meetingId={modal.meetingId} durationSec={modal.durationSec} />
          </div>
        </div>
      )}
    </main>
  );
}
