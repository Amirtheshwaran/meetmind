import { supabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';

export type MeetingStatus = 'RECORDING' | 'UPLOADING' | 'PROCESSING' | 'DONE' | 'ERROR';

export interface Meeting {
  id: string;
  title: string;
  created_at: string;
  duration_sec: number;
  status: MeetingStatus;
  storage_path: string | null;
  raw_transcript: string | null;
  error_message: string | null;
}

export interface MeetingSummary {
  id: string;
  meeting_id: string;
  overview: string;
  key_decisions: string[];
  topics: string[];
  attendees: string[];
  share_token: string;
  created_at: string;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  task: string;
  assignee: string;
  deadline: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  created_at: string;
}

export interface MeetingDetail extends Meeting {
  meeting_summaries: MeetingSummary | null;
  action_items: ActionItem[];
}

// Check if we are running in local mode (no Supabase keys or placeholder keys)
export function isLocalMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !url || url.includes('your-project') || !key || key.includes('your-service-role');
}

const DB_FILE = path.join(process.cwd(), 'db.json');

function readLocalDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = { meetings: [], meeting_summaries: [], action_items: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { meetings: [], meeting_summaries: [], action_items: [] };
  }
}

function writeLocalDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Meetings ────────────────────────────────────────────────────

export async function listMeetings(): Promise<Meeting[]> {
  if (isLocalMode()) {
    const db = readLocalDB();
    return [...db.meetings].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const { data, error } = await supabaseAdmin
    .from('meetings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data as Meeting[];
}

export async function getMeeting(id: string): Promise<MeetingDetail | null> {
  if (isLocalMode()) {
    const db = readLocalDB();
    const meeting = db.meetings.find((m: any) => m.id === id);
    if (!meeting) return null;
    const summary = db.meeting_summaries.find((s: any) => s.meeting_id === id) || null;
    const actions = db.action_items.filter((a: any) => a.meeting_id === id);
    return {
      ...meeting,
      meeting_summaries: summary,
      action_items: actions,
    };
  }
  const { data, error } = await supabaseAdmin
    .from('meetings')
    .select(`*, meeting_summaries(*), action_items(*)`)
    .eq('id', id)
    .single();
  if (error) return null;
  return data as MeetingDetail;
}

export async function createMeeting(title: string): Promise<Meeting> {
  if (isLocalMode()) {
    const db = readLocalDB();
    const newMeeting: Meeting = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      title: title || 'Untitled Meeting',
      created_at: new Date().toISOString(),
      duration_sec: 0,
      status: 'RECORDING',
      storage_path: null,
      raw_transcript: null,
      error_message: null,
    };
    db.meetings.push(newMeeting);
    writeLocalDB(db);
    return newMeeting;
  }
  const { data, error } = await supabaseAdmin
    .from('meetings')
    .insert({ title, status: 'RECORDING' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Meeting;
}

export async function updateMeetingStatus(
  id: string,
  status: MeetingStatus,
  extra?: Partial<Meeting>
): Promise<void> {
  if (isLocalMode()) {
    const db = readLocalDB();
    const idx = db.meetings.findIndex((m: any) => m.id === id);
    if (idx !== -1) {
      db.meetings[idx] = { ...db.meetings[idx], status, ...extra };
      writeLocalDB(db);
    }
    return;
  }
  const { error } = await supabaseAdmin
    .from('meetings')
    .update({ status, ...extra })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Summaries ────────────────────────────────────────────────────

export async function saveSummary(
  meetingId: string,
  summary: {
    overview: string;
    key_decisions: string[];
    topics: string[];
    attendees: string[];
  }
): Promise<MeetingSummary> {
  if (isLocalMode()) {
    const db = readLocalDB();
    const newSummary: MeetingSummary = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      meeting_id: meetingId,
      overview: summary.overview,
      key_decisions: summary.key_decisions,
      topics: summary.topics,
      attendees: summary.attendees,
      share_token: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
    };
    db.meeting_summaries.push(newSummary);
    writeLocalDB(db);
    return newSummary;
  }
  const { data, error } = await supabaseAdmin
    .from('meeting_summaries')
    .insert({ meeting_id: meetingId, ...summary })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MeetingSummary;
}

export async function getSummaryByToken(token: string): Promise<{
  summary: MeetingSummary;
  meeting: Meeting;
  action_items: ActionItem[];
} | null> {
  if (isLocalMode()) {
    const db = readLocalDB();
    const summary = db.meeting_summaries.find((s: any) => s.share_token === token);
    if (!summary) return null;
    const meeting = db.meetings.find((m: any) => m.id === summary.meeting_id);
    if (!meeting) return null;
    const actions = db.action_items.filter((a: any) => a.meeting_id === summary.meeting_id);
    return {
      summary,
      meeting,
      action_items: actions,
    };
  }
  const { data, error } = await supabaseAdmin
    .from('meeting_summaries')
    .select(`*, meetings(*)`)
    .eq('share_token', token)
    .single();
  if (error || !data) return null;

  const { data: actions } = await supabaseAdmin
    .from('action_items')
    .select('*')
    .eq('meeting_id', data.meeting_id)
    .order('created_at');

  return {
    summary: data as MeetingSummary,
    meeting: data.meetings as unknown as Meeting,
    action_items: (actions ?? []) as ActionItem[],
  };
}

// ── Action Items ──────────────────────────────────────────────────

export async function saveActionItems(
  meetingId: string,
  items: Array<{
    task: string;
    assignee: string;
    deadline?: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>
): Promise<void> {
  if (!items.length) return;
  if (isLocalMode()) {
    const db = readLocalDB();
    const rows = items.map((i) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      meeting_id: meetingId,
      task: i.task,
      assignee: i.assignee,
      deadline: i.deadline || null,
      priority: i.priority,
      completed: false,
      created_at: new Date().toISOString(),
    }));
    db.action_items.push(...rows);
    writeLocalDB(db);
    return;
  }
  const rows = items.map((i) => ({ meeting_id: meetingId, ...i }));
  const { error } = await supabaseAdmin.from('action_items').insert(rows);
  if (error) throw new Error(error.message);
}

export async function toggleActionItem(id: string, completed: boolean): Promise<void> {
  if (isLocalMode()) {
    const db = readLocalDB();
    const idx = db.action_items.findIndex((a: any) => a.id === id);
    if (idx !== -1) {
      db.action_items[idx].completed = completed;
      writeLocalDB(db);
    }
    return;
  }
  const { error } = await supabaseAdmin
    .from('action_items')
    .update({ completed })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

