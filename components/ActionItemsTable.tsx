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

  // New task form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: newTask.trim(),
          assignee: newAssignee.trim() || 'Unassigned',
          deadline: newDeadline || undefined,
          priority: newPriority,
        }),
      });

      if (res.ok) {
        const { item } = await res.json();
        setLocalItems((prev) => [...prev, item]);
        setNewTask('');
        setNewAssignee('');
        setNewDeadline('');
        setNewPriority('MEDIUM');
        setShowAddForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (readOnly) return;
    setLocalItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/meetings/${meetingId}/actions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: id }),
    });
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  const done = localItems.filter((i) => i.completed).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
          <p className="text-sm text-secondary">
            {done}/{localItems.length} completed
          </p>
          {localItems.length > 0 && (
            <div
              style={{
                height: 6,
                flex: 1,
                maxWidth: 180,
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(done / localItems.length) * 100}%`,
                  background: 'var(--green)',
                  borderRadius: 99,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          )}
        </div>

        {!readOnly && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Action Item'}
          </button>
        )}
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleAddTask} className="card mb-4 p-4 flex flex-col gap-3" style={{ background: '#121215' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              className="input"
              placeholder="Task description..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              required
              autoFocus
            />
            <input
              type="text"
              className="input"
              placeholder="Assignee (e.g. Sarah)"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
            />
          </div>
          <div className="flex gap-3 flex-wrap items-center justify-between">
            <div className="flex gap-3 items-center">
              <input
                type="date"
                className="input"
                style={{ width: 'auto' }}
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
              <select
                className="input"
                style={{ width: 'auto' }}
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {localItems.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px' }}>
          <p className="text-secondary text-sm">No action items yet. Click "+ Add Action Item" to create one.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {!readOnly && <th style={{ width: 40 }}></th>}
                <th onClick={() => handleSort('task')}>Task<SortIcon k="task" /></th>
                <th onClick={() => handleSort('assignee')}>Assignee<SortIcon k="assignee" /></th>
                <th onClick={() => handleSort('deadline')}>Deadline<SortIcon k="deadline" /></th>
                <th onClick={() => handleSort('priority')}>Priority<SortIcon k="priority" /></th>
                {!readOnly && <th style={{ width: 40 }}></th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.id} style={{ opacity: item.completed ? 0.5 : 1 }}>
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
                    <span className="assignee-chip">{item.assignee}</span>
                  </td>
                  <td className="text-sm text-secondary">{item.deadline || '—'}</td>
                  <td>
                    <span className={`badge badge-${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </td>
                  {!readOnly && (
                    <td>
                      <button
                        onClick={() => handleDeleteTask(item.id)}
                        className="btn-ghost p-1 text-muted hover:text-red"
                        title="Delete task"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

