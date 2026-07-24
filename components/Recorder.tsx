'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

interface RecorderProps {
  onComplete: (meetingId: string) => void;
  onClose: () => void;
  meetingTitle: string;
}

export default function Recorder({ onComplete, onClose, meetingTitle }: RecorderProps) {
  const [mode, setMode] = useState<'mic' | 'upload'>('mic');
  const [state, setState] = useState<'idle' | 'recording' | 'uploading' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#10b981');
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

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();

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
      setError('Microphone access denied. Please allow microphone access or upload an audio file.');
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

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an audio file to upload');
      return;
    }
    setState('uploading');
    await uploadAudio(selectedFile);
  };

  const uploadAudio = async (blobOrFile: Blob | File) => {
    try {
      setError('');
      const res = await fetch('/api/meetings/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meetingTitle }),
      });

      if (!res.ok) throw new Error('Failed to create meeting record');
      const { meetingId, uploadUrl } = await res.json();

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', blobOrFile.type || 'audio/webm');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(blobOrFile);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }, [mode]);

  return (
    <div className="recorder-wrapper">
      {/* Mode Tabs */}
      {state === 'idle' && (
        <div className="flex gap-2 mb-2">
          <button
            className={`btn btn-sm ${mode === 'mic' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setMode('mic'); setError(''); }}
          >
            🎙 Record Microphone
          </button>
          <button
            className={`btn btn-sm ${mode === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setMode('upload'); setError(''); }}
          >
            📁 Upload Audio File
          </button>
        </div>
      )}

      {mode === 'mic' ? (
        <>
          <canvas ref={canvasRef} className="recorder-canvas" width={480} height={80} />

          {state === 'recording' && (
            <div className="flex items-center gap-2">
              <div className="recording-indicator">
                <div className="recording-dot" />
              </div>
              <span className="text-sm text-red font-semibold">Live Recording</span>
            </div>
          )}

          <div className="recorder-timer">{formatTime(elapsed)}</div>

          {error && <p className="text-sm text-red text-center">{error}</p>}

          {state === 'idle' && (
            <div className="recorder-controls">
              <button className="record-btn record-btn-start" onClick={startRecording} title="Start Recording">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            </div>
          )}

          {state === 'recording' && (
            <div className="recorder-controls">
              <button className="record-btn record-btn-stop" onClick={stopRecording} title="Stop & Process">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="5" y="5" width="14" height="14" rx="2" />
                </svg>
              </button>
            </div>
          )}
        </>
      ) : (
        /* Upload Mode */
        <div className="w-full flex flex-col gap-4">
          <div
            className="file-drop-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-semibold">
              {selectedFile ? selectedFile.name : 'Click to choose or drag an audio file here'}
            </p>
            <p className="text-xs text-muted">Supports MP3, WAV, M4A, WEBM, OGG</p>
          </div>

          {error && <p className="text-sm text-red text-center">{error}</p>}

          {state === 'idle' && (
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleFileUpload}
                disabled={!selectedFile}
              >
                Upload & Process →
              </button>
            </div>
          )}
        </div>
      )}

      {state === 'uploading' && (
        <div className="w-full flex flex-col gap-2">
          <div className="text-sm text-secondary text-center">
            Uploading audio… {uploadPct}%
          </div>
          <div className="upload-bar">
            <div className="upload-bar-fill" style={{ width: `${uploadPct}%` }} />
          </div>
        </div>
      )}

      {state === 'done' && (
        <p className="text-sm text-green text-center">
          ✓ Upload complete! Starting processing…
        </p>
      )}
    </div>
  );
}

