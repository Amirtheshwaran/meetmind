'use client';
import type { MeetingSummary } from '@/lib/db';

interface SummaryCardProps {
  summary: MeetingSummary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <div>
      {/* Overview */}
      <div className="summary-overview">{summary.overview}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Attendees */}
        {summary.attendees?.length > 0 && (
          <div>
            <p className="section-title">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              Attendees ({summary.attendees.length})
            </p>
            <div className="tag-list">
              {summary.attendees.map((a, i) => (
                <span key={i} className="tag">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        {summary.topics?.length > 0 && (
          <div>
            <p className="section-title">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M7 7h10M7 12h10M7 17h10" />
              </svg>
              Key Topics
            </p>
            <div className="tag-list">
              {summary.topics.map((t, i) => (
                <span key={i} className="tag">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Decisions */}
      {summary.key_decisions?.length > 0 && (
        <div>
          <p className="section-title">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Key Decisions Agreed
          </p>
          <ul className="decisions-list">
            {summary.key_decisions.map((d, i) => (
              <li key={i}>
                <span className="decision-num">{i + 1}</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

