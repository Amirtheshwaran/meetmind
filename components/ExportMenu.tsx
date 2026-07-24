'use client';
import { useState, useRef, useEffect } from 'react';
import type { MeetingSummary, ActionItem, Meeting } from '@/lib/db';

interface ExportMenuProps {
  meeting: Meeting;
  summary: MeetingSummary;
  actionItems: ActionItem[];
}

export default function ExportMenu({ meeting, summary, actionItems }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportMarkdown = () => {
    let md = `# ${meeting.title}\n\n`;
    md += `**Date:** ${new Date(meeting.created_at).toLocaleDateString()}\n\n`;
    md += `## Overview\n${summary.overview}\n\n`;

    if (summary.key_decisions?.length) {
      md += `## Key Decisions\n`;
      summary.key_decisions.forEach((d) => (md += `- ${d}\n`));
      md += `\n`;
    }

    if (summary.topics?.length) {
      md += `## Topics Discussed\n`;
      summary.topics.forEach((t) => (md += `- ${t}\n`));
      md += `\n`;
    }

    if (summary.attendees?.length) {
      md += `## Attendees\n${summary.attendees.join(', ')}\n\n`;
    }

    if (actionItems.length) {
      md += `## Action Items\n`;
      actionItems.forEach((a) => {
        const check = a.completed ? '[x]' : '[ ]';
        const deadline = a.deadline ? ` (Due: ${a.deadline})` : '';
        md += `- ${check} **${a.task}** - ${a.assignee} [${a.priority}]${deadline}\n`;
      });
      md += `\n`;
    }

    if (meeting.raw_transcript) {
      md += `## Transcript\n${meeting.raw_transcript}\n`;
    }

    downloadFile(`${meeting.title.toLowerCase().replace(/\s+/g, '-')}-notes.md`, md, 'text/markdown');
  };

  const exportText = () => {
    let txt = `${meeting.title.toUpperCase()}\nDate: ${new Date(meeting.created_at).toLocaleDateString()}\n\n`;
    txt += `OVERVIEW:\n${summary.overview}\n\n`;

    if (summary.key_decisions?.length) {
      txt += `KEY DECISIONS:\n`;
      summary.key_decisions.forEach((d) => (txt += `* ${d}\n`));
      txt += `\n`;
    }

    if (actionItems.length) {
      txt += `ACTION ITEMS:\n`;
      actionItems.forEach((a) => {
        const status = a.completed ? '[DONE]' : '[TODO]';
        txt += `${status} ${a.task} (${a.assignee} - ${a.priority})\n`;
      });
      txt += `\n`;
    }

    downloadFile(`${meeting.title.toLowerCase().replace(/\s+/g, '-')}-notes.txt`, txt, 'text/plain');
  };

  const exportJSON = () => {
    const data = {
      meeting: {
        id: meeting.id,
        title: meeting.title,
        createdAt: meeting.created_at,
        durationSec: meeting.duration_sec,
      },
      summary,
      actionItems,
      transcript: meeting.raw_transcript,
    };
    downloadFile(
      `${meeting.title.toLowerCase().replace(/\s+/g, '-')}-notes.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button className="btn btn-secondary btn-sm" onClick={() => setOpen(!open)}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export ▾
      </button>

      {open && (
        <div className="dropdown-menu">
          <button onClick={exportMarkdown} className="dropdown-item">
            📄 Export as Markdown (.md)
          </button>
          <button onClick={exportText} className="dropdown-item">
            📝 Export as Text (.txt)
          </button>
          <button onClick={exportJSON} className="dropdown-item">
            code Export as JSON (.json)
          </button>
        </div>
      )}
    </div>
  );
}
