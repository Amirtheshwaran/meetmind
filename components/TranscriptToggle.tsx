'use client';
import { useState } from 'react';

export default function TranscriptToggle({ transcript }: { transcript: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="transcript-block">
      <div className="transcript-header" onClick={() => setOpen((o) => !o)}>
        <p className="section-title" style={{ margin: 0 }}>📝 Full Transcript</p>
        <span className="text-sm text-muted">{open ? '▲ Collapse' : '▼ Expand'}</span>
      </div>
      {open && (
        <div className="transcript-body">{transcript}</div>
      )}
    </div>
  );
}
