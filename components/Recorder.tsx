'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

interface RecorderProps {
  onComplete: (meetingId: string) => void;
  onClose: () => void;
  meetingTitle: string;
}

export default function Recorder({ onComplete, onClose, meetingTitle }: RecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'uploading' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Waveform visualizer
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#111118';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#6c63ff');
      gradient.addColorStop(1, '#a855f7');
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 48000 });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      setState('recording');

      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = async () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await uploadAudio(blob);
    };

    recorder.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setState('uploading');
  };

  const uploadAudio = async (blob: Blob) => {
    try {
      // 1. Get presigned upload URL + create meeting
      const res = await fetch('/api/meetings/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meetingTitle }),
      });

      if (!res.ok) throw new Error('Failed to get upload URL');
      const { meetingId, uploadUrl, storagePath } = await res.json();

      // 2. Upload directly to Supabase Storage via signed URL
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'audio/webm');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(blob);
      });

      setState('done');
      onComplete(meetingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setState('idle');
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Draw idle waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111118';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#2a2a3d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }, []);

  return (
    <div className="recorder-wrapper">
      <canvas ref={canvasRef} className="recorder-canvas" width={480} height={80} />

      {state === 'recording' && (
        <div className="flex items-center gap-2">
          <div className="recording-indicator">
            <div className="recording-dot" />
          </div>
          <span className="text-sm" style={{ color: 'var(--red)' }}>Recording</span>
        </div>
      )}

      <div className="recorder-timer">{formatTime(elapsed)}</div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--red)', textAlign: 'center' }}>{error}</p>
      )}

      {state === 'idle' && (
        <div className="recorder-controls">
          <button className="record-btn record-btn-start" onClick={startRecording} title="Start Recording">
            🎙
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        </div>
      )}

      {state === 'recording' && (
        <div className="recorder-controls">
          <button className="record-btn record-btn-stop" onClick={stopRecording} title="Stop & Process">
            ⏹
          </button>
        </div>
      )}

      {state === 'uploading' && (
        <div className="w-full flex flex-col gap-2">
          <div className="text-sm text-secondary" style={{ textAlign: 'center' }}>
            Uploading audio… {uploadPct}%
          </div>
          <div className="upload-bar">
            <div className="upload-bar-fill" style={{ width: `${uploadPct}%` }} />
          </div>
        </div>
      )}

      {state === 'done' && (
        <p className="text-sm" style={{ color: 'var(--green)', textAlign: 'center' }}>
          ✓ Upload complete! Starting AI processing…
        </p>
      )}
    </div>
  );
}
