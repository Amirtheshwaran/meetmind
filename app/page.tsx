'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import MeetingCard from '@/components/MeetingCard';
import Recorder from '@/components/Recorder';
import StatusTracker from '@/components/StatusTracker';
import type { Meeting, MeetingSummary, ActionItem } from '@/lib/db';

type MeetingWithSummary = Meeting & {
  meeting_summaries?: MeetingSummary | null;
  action_items?: ActionItem[];
};

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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
    const id = setInterval(() => {
      setMeetings((prev) => {
        const hasActive = prev.some((m) =>
          ['UPLOADING', 'PROCESSING', 'RECORDING'].includes(m.status)
        );
        if (hasActive) fetchMeetings();
        return prev;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [fetchMeetings]);

  const handleDeleteMeeting = async (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
  };

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

  // Metrics Calculations
  const stats = useMemo(() => {
    const totalCount = meetings.length;
    const totalSecs = meetings.reduce((acc, m) => acc + (m.duration_sec || 0), 0);
    const totalMins = Math.round(totalSecs / 60);

    let totalTasks = 0;
    let completedTasks = 0;
    meetings.forEach((m) => {
      (m.action_items || []).forEach((a) => {
        totalTasks++;
        if (a.completed) completedTasks++;
      });
    });

    return { totalCount, totalMins, totalTasks, completedTasks };
  }, [meetings]);

  // Filtered Meetings List
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.meeting_summaries?.overview?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchQuery, statusFilter]);

  const doneMeetings = filteredMeetings.filter((m) => m.status === 'DONE');
  const activeMeetings = filteredMeetings.filter((m) => m.status !== 'DONE');

  return (
    <main>
      <div className="container">
        {/* Header */}
        <div className="page-header flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-title">Meeting Workspace</h1>
            <p className="page-subtitle">
              Record, transcribe, and track action items seamlessly
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={startFlow}>
            + New Meeting
          </button>
        </div>

        {/* Analytics & Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stats-card">
            <span className="stats-label">Total Meetings</span>
            <span className="stats-value">{stats.totalCount}</span>
          </div>
          <div className="stats-card">
            <span className="stats-label">Total Recorded Time</span>
            <span className="stats-value">{stats.totalMins} mins</span>
          </div>
          <div className="stats-card">
            <span className="stats-label">Action Items Completed</span>
            <div className="flex items-center justify-between mt-1">
              <span className="stats-value">
                {stats.completedTasks}/{stats.totalTasks}
              </span>
              <span className="text-xs text-secondary">
                {stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Search & Status Filter Controls */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              className="input"
              placeholder="Search meetings by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {['ALL', 'DONE', 'PROCESSING', 'ERROR'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Active / In-Progress meetings */}
        {activeMeetings.length > 0 && (
          <div className="mb-6">
            <p className="section-title">In Progress</p>
            <div className="grid grid-2">
              {activeMeetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} onDelete={handleDeleteMeeting} />
              ))}
            </div>
          </div>
        )}

        {/* Completed meetings */}
        {loading ? (
          <div className="empty-state">
            <div className="spin text-2xl">⟳</div>
            <p className="mt-4 text-secondary">Loading meetings…</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎙</div>
            <h3>{searchQuery ? 'No matching meetings found' : 'No meetings recorded yet'}</h3>
            <p>{searchQuery ? 'Try clearing your search query or status filter.' : 'Record or upload your first meeting to get started.'}</p>
            {!searchQuery && (
              <button className="btn btn-primary mt-4" onClick={startFlow}>
                + Record First Meeting
              </button>
            )}
          </div>
        ) : (
          doneMeetings.length > 0 && (
            <>
              <p className="section-title mb-4">Completed Meetings ({doneMeetings.length})</p>
              <div className="grid grid-2">
                {doneMeetings.map((m) => (
                  <MeetingCard key={m.id} meeting={m} onDelete={handleDeleteMeeting} />
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
                placeholder="e.g. Weekly Product Sync"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary w-full" onClick={handleTitleSubmit}>
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Recorder / Upload ── */}
      {modal.view === 'recording' && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 className="modal-title">{modal.title}</h2>
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
            <h2 className="modal-title">Processing Meeting</h2>
            <p className="text-sm text-secondary mb-4">
              Transcribing audio and synthesizing key action items…
            </p>
            <StatusTracker meetingId={modal.meetingId} durationSec={modal.durationSec} />
          </div>
        </div>
      )}
    </main>
  );
}

