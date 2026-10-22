import { useEffect, useMemo, useRef, useState } from 'react';
import { mediaUrl } from '../../shared/api/client';
import { formatDuration } from '../../shared/ui';
import { Icon } from '../../shared/icons';

const BARS = 32;
/** Deterministic pseudo-waveform (the same voice note always looks the same). */
function bars(seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: BARS }, (_, i) => { h = (h * 1664525 + 1013904223) >>> 0; return 22 + ((h >>> 8) % 78) * (0.55 + 0.45 * Math.sin((i / BARS) * Math.PI)); });
}

export default function VoicePlayer({ attachment }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [rate, setRate] = useState(1);
  const total = Math.max(1, (attachment.durationMs || 0) / 1000);
  const heights = useMemo(() => bars(attachment.id), [attachment.id]);
  const progress = Math.min(1, time / total);

  useEffect(() => {
    const a = audioRef.current;
    const tick = () => setTime(a.currentTime);
    const end = () => { setPlaying(false); setTime(0); };
    a.addEventListener('timeupdate', tick);
    a.addEventListener('ended', end);
    return () => { a.removeEventListener('timeupdate', tick); a.removeEventListener('ended', end); };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (playing) { a.pause(); setPlaying(false); } else { a.playbackRate = rate; a.play().then(() => setPlaying(true)).catch(() => {}); }
  };
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * total;
  };
  const cycleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    audioRef.current.playbackRate = next;
  };

  return (
    <div className="voice">
      <audio ref={audioRef} src={mediaUrl(attachment.id)} preload="metadata" />
      <button className="voice-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Icon.Pause size={18} /> : <Icon.Play size={18} />}</button>
      <div className="wave" onClick={seek} role="slider" aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(time)}>
        {heights.map((h, i) => <i key={i} className={i / BARS < progress ? 'on' : ''} style={{ height: `${h}%` }} />)}
      </div>
      <span className="voice-time">{formatDuration((playing || time > 0 ? time : total) * 1000)}</span>
      <button className="voice-rate" onClick={cycleRate}>{rate}×</button>
    </div>
  );
}
