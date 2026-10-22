import { useCallback, useEffect, useRef, useState } from 'react';

/** Voice notes with MediaRecorder. start() asks for the microphone; stop() resolves { blob, durationMs }. */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAt = useRef(0);

  const release = useCallback(() => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    recRef.current = null;
    setRecording(false);
    setSeconds(0);
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });   // throws if denied / insecure origin
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
      .find((m) => window.MediaRecorder?.isTypeSupported?.(m));
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.start();
    streamRef.current = stream;
    recRef.current = rec;
    startedAt.current = Date.now();
    setRecording(true);
    timerRef.current = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 250);
  }, []);

  const stop = useCallback(() => new Promise((resolve) => {
    const rec = recRef.current;
    if (!rec) { resolve(null); return; }
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
      const durationMs = Date.now() - startedAt.current;
      release();
      resolve({ blob, durationMs });
    };
    rec.stop();
  }), [release]);

  const cancel = useCallback(() => {
    const rec = recRef.current;
    if (rec) { rec.onstop = null; try { rec.stop(); } catch { /* already stopped */ } }
    release();
  }, [release]);

  useEffect(() => cancel, [cancel]);   // leaving the screen stops the microphone
  return { recording, seconds, start, stop, cancel };
}
