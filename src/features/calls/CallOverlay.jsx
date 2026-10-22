import { useEffect, useRef, useState } from 'react';
import { useCall } from './CallContext';
import { useI18n } from '../../shared/i18n';
import { Avatar, formatDuration } from '../../shared/ui';
import { Icon } from '../../shared/icons';

export default function CallOverlay() {
  const { t } = useI18n();
  const { call, acceptCall, rejectCall, endCall, toggleMute, toggleCamera } = useCall();
  const remoteRef = useRef(null);
  const localRef = useRef(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { if (remoteRef.current) remoteRef.current.srcObject = call?.remoteStream || null; }, [call?.remoteStream]);
  useEffect(() => { if (localRef.current) localRef.current.srcObject = call?.localStream || null; }, [call?.localStream]);
  useEffect(() => {
    if (call?.phase !== 'connected') return undefined;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [call?.phase]);

  if (!call) return null;
  const video = call.media === 'Video';
  const showRemoteVideo = video && call.phase === 'connected' && call.remoteStream;
  const status = call.phase === 'ringing' ? (video ? t('call.incomingVideo') : t('call.incomingAudio'))
    : call.phase === 'calling' ? t('call.calling')
    : call.phase === 'connecting' ? t('call.connecting')
    : formatDuration(now - (call.connectedAt || now));

  return (
    <div className={'call' + (showRemoteVideo ? ' has-video' : '')} role="dialog" aria-label={status}>
      {/* the remote element always exists: it is what plays the audio, even in a voice call */}
      <video ref={remoteRef} className={showRemoteVideo ? 'remote' : 'hidden-media'} autoPlay playsInline />
      {!showRemoteVideo && (
        <div className="call-center">
          <span className="pulse"><Avatar name={call.peer?.displayName || '?'} size={132} /></span>
          <h2>{call.peer?.displayName}</h2>
          <p>{status}</p>
        </div>
      )}
      {showRemoteVideo && <div className="call-top"><strong>{call.peer?.displayName}</strong><span>{status}</span></div>}
      {video && call.localStream && call.phase !== 'ringing' && (
        <video ref={localRef} className={'local' + (call.cameraOff ? ' off' : '')} autoPlay playsInline muted />
      )}

      <div className="call-controls">
        {call.phase === 'ringing' ? (
          <>
            <button className="call-btn danger" onClick={rejectCall} aria-label={t('call.decline')}><Icon.PhoneOff size={26} /></button>
            <button className="call-btn ok" onClick={acceptCall} aria-label={t('call.accept')}>{video ? <Icon.Video size={26} /> : <Icon.Phone size={26} />}</button>
          </>
        ) : (
          <>
            <button className={'call-btn' + (call.muted ? ' off' : '')} onClick={toggleMute} aria-label={call.muted ? t('call.unmute') : t('call.mute')}>
              {call.muted ? <Icon.MicOff size={24} /> : <Icon.Mic size={24} />}
            </button>
            {video && (
              <button className={'call-btn' + (call.cameraOff ? ' off' : '')} onClick={toggleCamera} aria-label={call.cameraOff ? t('call.cameraOn') : t('call.cameraOff')}>
                {call.cameraOff ? <Icon.VideoOff size={24} /> : <Icon.Video size={24} />}
              </button>
            )}
            <button className="call-btn danger" onClick={endCall} aria-label={t('call.end')}><Icon.PhoneOff size={26} /></button>
          </>
        )}
      </div>
    </div>
  );
}
