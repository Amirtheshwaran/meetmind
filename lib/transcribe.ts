import Groq from 'groq-sdk';
import { supabaseAdmin } from './supabase';
import { isLocalMode } from './db';
import fs from 'fs';
import path from 'path';

let _groq: Groq | null = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'meeting-audio';

function hasGroqKey(): boolean {
  const key = process.env.GROQ_API_KEY;
  return !!(key && !key.includes('gsk_') && key.trim().length > 10);
}

export async function transcribeAudio(storagePath: string): Promise<string> {
  let buffer: Buffer;

  if (isLocalMode()) {
    const localPath = path.join(process.cwd(), 'public', 'uploads', storagePath);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local audio file not found at ${localPath}`);
    }
    buffer = fs.readFileSync(localPath);
  } else {
    // Download audio from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(storagePath);

    if (error || !data) {
      throw new Error(`Failed to download audio: ${error?.message}`);
    }
    buffer = Buffer.from(await data.arrayBuffer());
  }

  // If we don't have a valid Groq API key, return a mock transcript
  if (!hasGroqKey()) {
    // Wait 2 seconds to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return "This is a mock transcript of the recorded meeting. We discussed the launch of our new fullstack application, MeetMind. Amirthesh pointed out that the application should run 100% free with no credit card required. We decided to use a local JSON file-based database fallback and mock AI models to allow the developer to test the application immediately without signing up for external cloud services. The deadline for completing the initial local integration is by the end of today. Amirthesh will review the layout and then we will prepare the application for deployment to Vercel.";
  }

  // Groq expects a File-like object — create one from the buffer
  const audioFile = new File([new Uint8Array(buffer)], 'audio.webm', { type: 'audio/webm' });

  // Send to Groq Whisper (whisper-large-v3 — free tier)
  const transcription = await getGroq().audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-large-v3',
    response_format: 'text',
    language: 'en',
  });

  return typeof transcription === 'string' ? transcription : (transcription as { text: string }).text;
}

