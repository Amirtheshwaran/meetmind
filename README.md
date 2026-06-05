# MeetMind

MeetMind is a self-hosted, full-stack meeting recorder, transcription engine, and action item tracker. It allows you to record meetings directly in your browser, generate automated summaries, extract key decisions, and manage action items with priority levels and assignees.

The app supports a zero-configuration local mode (storing data in a local JSON database and running mock pipelines) so it works out of the box, with options to plug in cloud services (Supabase, Groq Whisper, and Gemini Flash) when you are ready to scale or deploy.

## Features

- **In-Browser Audio Recording**: Record meetings directly with a real-time canvas waveform visualizer.
- **Automated Transcription**: Powered by Groq's `whisper-large-v3` model (or local fallback).
- **AI Summary & Action Items**: Gemini 1.5 Flash generates structured summaries, attendees, topics, and key decisions. Uses a map-reduce chunking approach for long meetings.
- **Action Item Tracker**: Interactive task board with status toggles, assignees, deadlines, and priorities.
- **Easy Sharing**: Generate unique public tokens to share read-only summaries.
- **Sleek Interface**: Polished dark mode designed with a Zinc-graphite color palette, custom typography, and responsive layouts.

## Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router & TS)
- **Database & Storage**: Supabase (Postgres & Storage) or Local file database fallback
- **Transcription**: Groq API (`whisper-large-v3`)
- **LLM Summarization**: Google Gemini API (`gemini-1.5-flash`)

## Quick Start (Local Mode)

The project includes a self-contained local fallback mode. You don't need any API keys or database setup to test the app.

1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/Amirtheshwaran/meetmind.git
   cd meetmind
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app. All recorded data will be stored locally in `db.json` and audio files in `public/uploads`.

## Production Setup & Cloud Integration

To use live transcription, summaries, and deploy to Vercel:

1. **Configure Supabase**:
   - Create a free project at [supabase.com](https://supabase.com).
   - Execute the SQL schema in `supabase/schema.sql` inside the Supabase SQL Editor.
   - Under Storage, create a private bucket named `meeting-audio`.
2. **Retrieve API Keys**:
   - Get a Groq API key at [console.groq.com](https://console.groq.com).
   - Get a Gemini API key at [ai.google.dev](https://ai.google.dev).
3. **Environment Setup**:
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Fill in your Supabase project URL, credentials, and API keys.
4. **Deploy**:
   - Deploy to Vercel:
     ```bash
     npx vercel
     ```
   - Set the env variables in your Vercel project dashboard.
