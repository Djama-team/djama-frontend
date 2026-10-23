import { useEffect } from 'react';
import { mediaUrl } from '../../shared/api/client';
import { Icon } from '../../shared/icons';

export default function Lightbox({ attachment, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="lightbox" onClick={onClose}>
      <button className="icon light" onClick={onClose} aria-label="Close"><Icon.X size={26} /></button>
      <a className="icon light dl" href={mediaUrl(attachment.id)} download={attachment.fileName} onClick={(e) => e.stopPropagation()}><Icon.Download size={24} /></a>
      <img src={mediaUrl(attachment.id)} alt={attachment.fileName} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
