// 1-to-1 audio / video calls with WebRTC. SignalR (hub methods CallInvite/CallAccept/CallReject/CallEnd/CallSignal)
// only carries the signaling; the media flows peer-to-peer. Owner: P3 (+P5 for the TURN server, see README).
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useChat } from '../chat/ChatContext';
import { useAuth } from '../auth/AuthContext';
import { errText, useI18n } from '../../shared/i18n';
import { useToast } from '../../shared/toast';
import { startTone, stopTone } from './ringtone';

// STUN finds the public address of each browser. Behind strict firewalls/NAT a TURN relay is needed (see docs).
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
const RING_TIMEOUT_MS = 45000;

const CallContext = createContext(null);
export const useCall = () => useContext(CallContext);

export function CallProvider({ children }) {
  const { connection } = useChat();
  const { user } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  // call = { id, convId, peer: UserDto, media: 'Audio'|'Video', direction: 'out'|'in',
  //          phase: 'calling'|'ringing'|'connecting'|'connected', localStream, remoteStream, muted, cameraOff, connectedAt }
  const [call, setCall] = useState(null);
  const callRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const pendingIce = useRef([]);
  const ringTimer = useRef(null);
  const connRef = useRef(null);
  const tRef = useRef(t);
  const toastRef = useRef(toast);
  callRef.current = call;
  connRef.current = connection;
  tRef.current = t;
  toastRef.current = toast;

  const cleanup = useCallback(() => {
    stopTone();
    clearTimeout(ringTimer.current);
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((tr) => tr.stop());
    localRef.current = null;
    pendingIce.current = [];
    setCall(null);
  }, []);

  const endCall = useCallback(() => {
    const c = callRef.current;
    if (c?.id) connRef.current?.invoke('CallEnd', c.id).catch(() => {});
    cleanup();
  }, [cleanup]);
  const endRef = useRef(endCall);
  endRef.current = endCall;

  const signal = useCallback((callId, kind, payload) =>
    connRef.current?.invoke('CallSignal', callId, kind, JSON.stringify(payload)).catch(() => {}), []);

  const getMedia = useCallback(async (media) => {
    try { return await navigator.mediaDevices.getUserMedia({ audio: true, video: media === 'Video' }); }
    catch { toastRef.current({ type: 'error', text: tRef.current('call.noMedia'), ttl: 7000 }); return null; }
  }, []);

  const makePc = useCallback((callId) => {
    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;
    localRef.current.getTracks().forEach((tr) => pc.addTrack(tr, localRef.current));
    pc.onicecandidate = (e) => { if (e.candidate) signal(callId, 'candidate', e.candidate); };
    pc.ontrack = (e) => setCall((c) => (c ? { ...c, remoteStream: e.streams[0] } : c));
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCall((c) => (c && c.phase !== 'connected' ? { ...c, phase: 'connected', connectedAt: Date.now() } : c));
      if (pc.connectionState === 'failed') endRef.current();
    };
    return pc;
  }, [signal]);

  const startCall = useCallback(async (conv, media) => {
    if (callRef.current || !connRef.current) return;
    const peer = conv.members.find((m) => m.user.id !== user.id)?.user;
    const stream = await getMedia(media);
    if (!stream) return;
    localRef.current = stream;
    setCall({ id: null, convId: conv.id, peer, media, direction: 'out', phase: 'calling', localStream: stream, remoteStream: null, muted: false, cameraOff: false });
    try {
      const id = await connRef.current.invoke('CallInvite', conv.id, media);
      setCall((c) => (c ? { ...c, id } : c));
      startTone('ringback');
      ringTimer.current = setTimeout(() => endRef.current(), RING_TIMEOUT_MS);      // nobody answers: hang up (= missed call)
    } catch (e) {
      const code = /([A-Z_]{3,}):/.exec(e?.message || '')?.[1] || 'ERROR';
      toastRef.current({ type: 'error', text: errText(tRef.current, { code }) });
      cleanup();
    }
  }, [user, getMedia, cleanup]);

  const acceptCall = useCallback(async () => {
    const c = callRef.current;
    if (!c || c.direction !== 'in') return;
    stopTone();
    const stream = await getMedia(c.media);
    if (!stream) { connRef.current?.invoke('CallReject', c.id).catch(() => {}); cleanup(); return; }
    localRef.current = stream;
    setCall((x) => (x ? { ...x, phase: 'connecting', localStream: stream } : x));
    makePc(c.id);                                              // ready BEFORE the caller's offer arrives
    try { await connRef.current.invoke('CallAccept', c.id); } catch { cleanup(); }
  }, [getMedia, makePc, cleanup]);

  const rejectCall = useCallback(() => {
    const c = callRef.current;
    if (c?.id) connRef.current?.invoke('CallReject', c.id).catch(() => {});
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    const tracks = localRef.current?.getAudioTracks() || [];
    if (!tracks.length) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((x) => { x.enabled = enabled; });
    setCall((c) => (c ? { ...c, muted: !enabled } : c));
  }, []);

  const toggleCamera = useCallback(() => {
    const tracks = localRef.current?.getVideoTracks() || [];
    if (!tracks.length) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((x) => { x.enabled = enabled; });
    setCall((c) => (c ? { ...c, cameraOff: !enabled } : c));
  }, []);

  // ---------- signaling events ----------
  useEffect(() => {
    if (!connection) return undefined;

    const flushIce = async (pc) => {
      for (const cand of pendingIce.current) await pc.addIceCandidate(cand).catch(() => {});
      pendingIce.current = [];
    };

    const onIncoming = ({ callId, conversationId, caller, media }) => {
      if (callRef.current) { connection.invoke('CallReject', callId).catch(() => {}); return; }   // already in a call
      setCall({ id: callId, convId: conversationId, peer: caller, media, direction: 'in', phase: 'ringing', localStream: null, remoteStream: null, muted: false, cameraOff: false });
      startTone('ring');
    };

    const onAccepted = async ({ callId }) => {
      const c = callRef.current;
      if (!c || c.id !== callId || c.direction !== 'out') return;
      stopTone();
      clearTimeout(ringTimer.current);
      setCall((x) => (x ? { ...x, phase: 'connecting' } : x));
      try {
        const pc = makePc(callId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        signal(callId, 'offer', pc.localDescription);
      } catch { endRef.current(); }
    };

    const onSignal = async ({ callId, kind, payload }) => {
      const pc = pcRef.current;
      const c = callRef.current;
      if (!pc || !c || c.id !== callId) return;
      const data = JSON.parse(payload);
      try {
        if (kind === 'offer') {
          await pc.setRemoteDescription(data);
          await flushIce(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signal(callId, 'answer', pc.localDescription);
        } else if (kind === 'answer') {
          await pc.setRemoteDescription(data);
          await flushIce(pc);
        } else if (kind === 'candidate') {
          if (pc.remoteDescription) await pc.addIceCandidate(data); else pendingIce.current.push(data);
        }
      } catch { /* a bad candidate must not kill the call */ }
    };

    const onEnded = ({ callId, reason }) => {
      const c = callRef.current;
      if (!c || c.id !== callId) return;
      const key = reason === 'Declined' ? 'call.declined' : reason === 'Missed' ? 'call.missed' : 'call.ended';
      toastRef.current({ text: tRef.current(key) });
      cleanup();
    };

    connection.on('IncomingCall', onIncoming);
    connection.on('CallAccepted', onAccepted);
    connection.on('CallSignal', onSignal);
    connection.on('CallEnded', onEnded);
    return () => {
      connection.off('IncomingCall', onIncoming);
      connection.off('CallAccepted', onAccepted);
      connection.off('CallSignal', onSignal);
      connection.off('CallEnded', onEnded);
    };
  }, [connection, makePc, signal, cleanup]);

  useEffect(() => cleanup, [cleanup]);   // logout / unmount hangs up and releases camera + microphone

  const value = { call, startCall, acceptCall, rejectCall, endCall, toggleMute, toggleCamera };
  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}
