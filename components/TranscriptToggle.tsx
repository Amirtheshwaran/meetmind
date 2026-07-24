'use client';
import { useState } from 'react';
import { parseSpeakerTranscript } from '@/lib/clean';

export default function TranscriptToggle({ transcript }: { transcript: string }) {
  const [open, setOpen] = useState(false);
  const turns = parseSpeakerTranscript(transcript);

  // Generate consistent color per speaker name
  const getSpeakerColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 65%, 55%)`;
  };

  return (
    <div className="transcript-block">
      <div className="transcript-header" onClick={() => setOpen((o) => !o)}>
        <p className="section-title" style={{ margin: 0 }}>
          Speaker-Attributed Transcript ({turns.length} turn{turns.length !== 1 ? 's' : ''})
        </p>
        <span className="text-sm text-muted">{open ? '▲ Collapse' : '▼ Expand'}</span>
      </div>
      {open && (
        <div className="transcript-body">
          <div className="speaker-dialogue-list">
            {turns.map((turn, i) => (
              <div key={i} className="speaker-turn">
                <div className="speaker-meta">
                  <div
                    className="speaker-avatar"
                    style={{ backgroundColor: getSpeakerColor(turn.speaker) }}
                  >
                    {turn.speaker.charAt(0).toUpperCase()}
                  </div>
                  <span className="speaker-name">{turn.speaker}</span>
                  {turn.timestamp && (
                    <span className="speaker-timestamp">[{turn.timestamp}]</span>
                  )}
                </div>
                <div className="speaker-text">{turn.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

