// WhatsApp-style preview before sending photos / documents, with an optional caption.
import { useEffect, useMemo, useState } from 'react';
import { errText, useI18n } from '../../shared/i18n';
import { formatBytes } from '../../shared/ui';
import { Icon } from '../../shared/icons';
import { MAX_FILE_BYTES } from '../../shared/messageUtils';

export default function AttachmentPreview({ files, onClose, onSend }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const urls = useMemo(() => files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)), [files]);
  useEffect(() => () => urls.forEach((u) => u && URL.revokeObjectURL(u)), [urls]);

  const tooBig = files.some((f) => f.size > MAX_FILE_BYTES);
  const current = files[index];

  const send = async () => {
    setBusy(true); setErr('');
    try { await onSend(caption); } catch (e) { setErr(errText(t, e)); setBusy(false); }
  };

  return (
    <div className="modal-back dark" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon light close" onClick={onClose} aria-label={t('common.close')}><Icon.X size={22} /></button>
        <div className="preview-stage">
          {urls[index] ? <img src={urls[index]} alt="" /> : (
            <div className="preview-file"><Icon.File size={64} /><strong>{current.name}</strong><span>{formatBytes(current.size)}</span></div>
          )}
        </div>
        {files.length > 1 && (
          <div className="preview-thumbs">
            {files.map((f, i) => (
              <button key={i} className={i === index ? 'on' : ''} onClick={() => setIndex(i)}>
                {urls[i] ? <img src={urls[i]} alt="" /> : <Icon.File size={22} />}
              </button>
            ))}
          </div>
        )}
        {(tooBig || err) && <p className="error">{tooBig ? t('chat.tooBig') : err}</p>}
        <div className="preview-bar">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={t('chat.caption')} maxLength={1000}
            onKeyDown={(e) => { if (e.key === 'Enter' && !tooBig && !busy) send(); }} autoFocus />
          <button className="fab" onClick={send} disabled={busy || tooBig} aria-label={t('chat.send')}><Icon.Send size={20} /></button>
        </div>
      </div>
    </div>
  );
}
