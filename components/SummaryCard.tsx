'use client';
import { useState } from 'react';
import type { MeetingSummary } from '@/lib/db';

interface SummaryCardProps {
  summary: MeetingSummary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <div>
      {/* Overview */}
      <div className="summary-overview">{summary.overview}</div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Attendees */}
        {summary.attendees.length > 0 && (
          <div>
            <p className="section-title">👥 Attendees</p>
            <div className="tag-list">
              {summary.attendees.map((a, i) => (
                <span key={i} className="tag">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        {summary.topics.length > 0 && (
          <div>
            <p className="section-title">🏷 Topics</p>
            <div className="tag-list">
              {summary.topics.map((t, i) => (
                <span key={i} className="tag">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Decisions */}
      {summary.key_decisions.length > 0 && (
        <div>
          <p className="section-title">✅ Key Decisions</p>
          <ul className="decisions-list">
            {summary.key_decisions.map((d, i) => (
              <li key={i}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{i + 1}.</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
