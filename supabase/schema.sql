-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Meetings table
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Meeting',
  created_at timestamptz not null default now(),
  duration_sec int not null default 0,
  status text not null default 'RECORDING' check (status in ('RECORDING','UPLOADING','PROCESSING','DONE','ERROR')),
  storage_path text,
  raw_transcript text,
  error_message text
);

-- Meeting summaries (1:1 with meetings)
create table if not exists meeting_summaries (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  overview text not null default '',
  key_decisions text[] not null default '{}',
  topics text[] not null default '{}',
  attendees text[] not null default '{}',
  share_token text unique not null default gen_random_uuid()::text,
  created_at timestamptz not null default now()
);

-- Action items
create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  task text not null,
  assignee text not null default 'Unassigned',
  deadline text,
  priority text not null default 'MEDIUM' check (priority in ('HIGH','MEDIUM','LOW')),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_meetings_created_at on meetings(created_at desc);
create index if not exists idx_meeting_summaries_meeting_id on meeting_summaries(meeting_id);
create index if not exists idx_action_items_meeting_id on action_items(meeting_id);
create index if not exists idx_meeting_summaries_share_token on meeting_summaries(share_token);

-- Storage bucket (run separately OR create via Supabase dashboard)
-- Go to Storage > New Bucket > Name: "meeting-audio" > Public: false
