'use client';
import { useState } from 'react';
import type { ActionItem } from '@/lib/db';

interface ActionItemsTableProps {
  items: ActionItem[];
  meetingId: string;
  readOnly?: boolean;
}

type SortKey = 'priority' | 'assignee' | 'deadline' | 'task';
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default function ActionItemsTable({ items, meetingId, readOnly }: ActionItemsTableProps) {
  const [localItems, setLocalItems] = useState<ActionItem[]>(items);
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...localItems].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'priority') {
      cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    } else if (sortKey === 'assignee') {
      cmp = a.assignee.localeCompare(b.assignee);
    } else if (sortKey === 'deadline') {
      cmp = (a.deadline ?? '').localeCompare(b.deadline ?? '');
    } else {
      cmp = a.task.localeCompare(b.task);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleComplete = async (item: ActionItem) => {
    if (readOnly) return;
    const newVal = !item.completed;
    setLocalItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: newVal } : i)));

    await fetch(`/api/meetings/${meetingId}/actions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: item.id, completed: newVal }),
    });
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  if (!localItems.length) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <div className="empty-state-icon">📋</div>
        <h3>No action items found</h3>
        <p>The AI didn&apos;t detect any specific action items in this meeting.</p>
      </div>
    );
  }

  const done = localItems.filter((i) => i.completed).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-secondary">
          {done}/{localItems.length} completed
        </p>
        <div
          style={{
            height: 6,
            flex: 1,
            maxWidth: 200,
            background: 'var(--bg-secondary)',
            borderRadius: 99,
            overflow: 'hidden',
            marginLeft: 12,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(done / localItems.length) * 100}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--green))',
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {!readOnly && <th style={{ width: 40 }}></th>}
              <th onClick={() => handleSort('task')}>Task<SortIcon k="task" /></th>
              <th onClick={() => handleSort('assignee')}>Assignee<SortIcon k="assignee" /></th>
              <th onClick={() => handleSort('deadline')}>Deadline<SortIcon k="deadline" /></th>
              <th onClick={() => handleSort('priority')}>Priority<SortIcon k="priority" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.id} style={{ opacity: item.completed ? 0.6 : 1 }}>
                {!readOnly && (
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={item.completed}
                      onChange={() => toggleComplete(item)}
                    />
                  </td>
                )}
                <td>
                  <span className={`task-text ${item.completed ? 'completed' : ''}`}>
                    {item.task}
                  </span>
                </td>
                <td>
                  <span className="assignee-chip">👤 {item.assignee}</span>
                </td>
                <td className="text-sm text-secondary">{item.deadline || '—'}</td>
                <td>
                  <span className={`badge badge-${item.priority.toLowerCase()}`}>
                    {item.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
