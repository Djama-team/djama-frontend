import { useEffect, useRef, useState } from 'react';
import { errText, useI18n } from '../../shared/i18n';
import { formatDuration } from '../../shared/ui';
import { quoteText } from '../../shared/messageUtils';
import { Icon } from '../../shared/icons';
import EmojiPicker from '../../shared/emoji';
import { useChat } from './ChatContext';
import { useVoiceRecorder } from './useVoiceRecorder';

export default function MessageInput({ onFiles }) {
  const { t } = useI18n();
  const { sendMessage, sendFiles, sendTyping, replyTo, setReplyTo, editing, setEditing, editMessage } = useChat();
  const rec = useVoiceRecorder();
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [emoji, setEmoji] = useState(false);
  const [attach, setAttach] = useState(false);
  const taRef = useRef(null);
  const lastTyping = useRef(0);
  const mediaInput = useRef(null);
  const fileInput = useRef(null);

  useEffect(() => { if (editing) { setText(editing.text); taRef.current?.focus(); } }, [editing]);
  useEffect(() => { if (replyTo) taRef.current?.focus(); }, [replyTo]);
  useEffect(() => {                                   // auto-growing textarea
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [text]);
  useEffect(() => {                                   // click outside closes the emoji / attach popovers
    const h = (e) => { if (!e.target.closest?.('.pop-wrap')) { setEmoji(false); setAttach(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const submit = async () => {
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true); setErr('');
    try {
      if (editing) await editMessage(editing.id, v); else await sendMessage(v);
      setText(''); setEmoji(false);
    } catch (e) { setErr(errText(t, e)); } finally { setBusy(false); }
  };
  const cancelEdit = () => { setEditing(null); setText(''); };

  const change = (e) => {
    setText(e.target.value);
    if (Date.now() - lastTyping.current > 2000) { lastTyping.current = Date.now(); sendTyping(); }   // throttled "typing"
  };
  const pick = (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    setAttach(false);
    if (files.length) onFiles(files);
  };
  const paste = (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) { e.preventDefault(); onFiles(files); }
  };

  const startRec = async () => {
    setErr('');
    try { await rec.start(); } catch { setErr(t('chat.micDenied')); }
  };
  const sendRec = async () => {
    const r = await rec.stop();
    if (!r || r.durationMs < 700) return;           // ignore accidental taps
    const ext = r.blob.type.includes('mp4') ? 'm4a' : r.blob.type.includes('ogg') ? 'ogg' : 'webm';
    const file = new File([r.blob], `voice-${Date.now()}.${ext}`, { type: r.blob.type });
    try { await sendFiles([file], { voice: true, durationMs: r.durationMs }); } catch (e) { setErr(errText(t, e)); }
  };

  return (
    <footer className="composer">
      {replyTo && !editing && (
        <div className="strip">
          <div className="strip-body"><strong>{t('chat.replyingTo')} {replyTo.senderName}</strong><span>{quoteText(replyTo, t)}</span></div>
          <button className="icon" onClick={() => setReplyTo(null)} aria-label={t('common.cancel')}><Icon.X size={18} /></button>
        </div>
      )}
      {editing && (
        <div className="strip edit">
          <Icon.Edit size={16} />
          <div className="strip-body"><strong>{t('chat.editing')}</strong><span>{editing.text}</span></div>
          <button className="icon" onClick={cancelEdit} aria-label={t('common.cancel')}><Icon.X size={18} /></button>
        </div>
      )}
      {err && <p className="error" role="alert">{err}</p>}

      {rec.recording ? (
        <div className="composer-row recording">
          <button className="icon danger" onClick={rec.cancel} aria-label={t('common.cancel')}><Icon.Trash size={20} /></button>
          <span className="rec-dot" />
          <span className="rec-time">{formatDuration(rec.seconds * 1000)}</span>
          <span className="rec-label">{t('chat.recording')}</span>
          <button className="fab" onClick={sendRec} aria-label={t('chat.send')}><Icon.Send size={20} /></button>
        </div>
      ) : (
        <div className="composer-row">
          <div className="pop-wrap">
            <button className="icon" onClick={() => { setEmoji(!emoji); setAttach(false); }} aria-label="Emoji"><Icon.Smile size={22} /></button>
            {emoji && <EmojiPicker onPick={(e) => setText((x) => x + e)} />}
          </div>
          {!editing && (
            <div className="pop-wrap">
              <button className="icon" onClick={() => { setAttach(!attach); setEmoji(false); }} aria-label="Attach"><Icon.Paperclip size={22} /></button>
              {attach && (
                <div className="menu up">
                  <button onClick={() => mediaInput.current.click()}><Icon.Image size={16} /> {t('chat.attachPhoto')}</button>
                  <button onClick={() => fileInput.current.click()}><Icon.File size={16} /> {t('chat.attachFile')}</button>
                </div>
              )}
            </div>
          )}
          <textarea ref={taRef} rows={1} value={text} placeholder={t('chat.typeMessage')} maxLength={4000} onChange={change} onPaste={paste}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } if (e.key === 'Escape' && editing) cancelEdit(); }} />
          {text.trim() || editing
            ? <button className="fab" onClick={submit} disabled={busy || !text.trim()} aria-label={t('chat.send')}><Icon.Send size={20} /></button>
            : <button className="fab" onClick={startRec} aria-label={t('chat.voice')}><Icon.Mic size={20} /></button>}
        </div>
      )}
      <input ref={mediaInput} type="file" hidden multiple accept="image/*,video/*" onChange={pick} />
      <input ref={fileInput} type="file" hidden multiple onChange={pick} />
    </footer>
  );
}
