import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/api.js';
import { useSocket } from '../state/SocketContext.jsx';
import { Avatar, Empty } from '../components/ui.jsx';
import { Send, Paperclip } from 'lucide-react';
import { toast } from '../components/Toaster.jsx';

export default function Conversation() {
  // Route can be /messages/:id OR /messages/with/:userId — `mode` disambiguates.
  const params = useParams();
  const isWith = window.location.pathname.includes('/messages/with/');
  const id = params.id;
  const userId = params.userId;

  const api = useApi();
  const { socket } = useSocket();
  const nav = useNavigate();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const scroller = useRef(null);
  const fileRef = useRef(null);

  const loadMessages = async (cid) => {
    const r = await api.get(`/messages/${cid}/messages`);
    setMessages(r.data.messages);
  };
  const loadConv = async (cid) => {
    const r = await api.get('/messages');
    const c = r.data.conversations.find((x) => x._id === cid);
    if (c) setConv(c);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isWith && userId) {
          const r = await api.post(`/messages/with/${userId}`, {});
          const cid = r.data.conversation._id;
          if (cancelled) return;
          // replace the URL so future navigations / refreshes hit the real id
          nav(`/messages/${cid}`, { replace: true });
          await loadMessages(cid);
          await loadConv(cid);
        } else if (id) {
          await loadMessages(id);
          await loadConv(id);
        }
      } catch (e) { toast.error(e.message); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId, isWith]);

  useEffect(() => {
    if (!socket || !id) return;
    const onMessage = (payload) => {
      if (payload.conversationId === id) {
        setMessages((prev) => [...prev, payload.message]);
        api.post(`/messages/${id}/read`, {}).catch(() => {});
      }
    };
    const onTyping = (p) => { if (p.conversationId === id) setTyping(true); };
    const onStop = (p) => { if (p.conversationId === id) setTyping(false); };
    socket.on('message:new', onMessage);
    socket.on('typing', onTyping);
    socket.on('stop-typing', onStop);
    return () => { socket.off('message:new', onMessage); socket.off('typing', onTyping); socket.off('stop-typing', onStop); };
  }, [socket, id, api]);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }, [messages.length]);

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !id) return;
    try {
      const r = await api.post(`/messages/${id}/messages`, { text });
      setMessages((prev) => [...prev, r.data.message]);
      setText('');
      socket?.emit('stop-typing', { conversationId: id });
    } catch (e) { toast.error(e.message); }
  };

  const onType = (v) => {
    setText(v);
    if (!id) return;
    socket?.emit('typing', { conversationId: id });
    clearTimeout(window.__typerT);
    window.__typerT = setTimeout(() => socket?.emit('stop-typing', { conversationId: id }), 1200);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      // Decide resource type from mime — Cloudinary has separate upload endpoints per kind.
      const isImage = file.type.startsWith('image/');
      const resourceType = isImage ? 'image' : 'raw';
      // 1) Get a signed-upload signature from our backend.
      const sig = await api.post('/uploads/signature', { folder: 'skillswap/chat', resourceType });
      // 2) Upload directly to Cloudinary.
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', String(sig.timestamp));
      fd.append('signature', sig.signature);
      fd.append('folder', sig.folder);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`, {
        method: 'POST', body: fd
      });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error?.message || 'Upload failed');
      // 3) Persist the message with the returned attachment metadata.
      await api.post(`/messages/${id}/messages`, {
        attachment: {
          url: upData.secure_url,
          publicId: upData.public_id,
          type: isImage ? 'image' : 'file',
          name: file.name,
          size: upData.bytes,
          mime: file.type,
        }
      });
      loadMessages(id);
    } catch (e) { toast.error(e.message); }
  };

  if (!id && !userId) return <Empty title="Pick a conversation" body="Open one from the Messages list." />;

  const other = conv?.participants?.find((p) => p && p._id !== conv?.participants?.[0]?._id)
              || conv?.participants?.[0]
              || null;

  return (
    <div className="card flex h-[75vh] flex-col">
      <div className="flex items-center gap-3 border-b border-ink-100 pb-3">
        <Avatar user={other} size={36} />
        <div className="flex-1">
          <div className="text-sm font-semibold">{other?.name || (isWith ? 'Opening conversation…' : 'Conversation')}</div>
          {conv?.context?.teachSkill && (
            <div className="text-xs muted">Swap: {conv.context.teachSkill} ↔ {conv.context.learnSkill}{conv.context.sessionDate ? ` · ${new Date(conv.context.sessionDate).toLocaleString()}` : ''}</div>
          )}
        </div>
        <button onClick={() => nav('/messages')} className="text-xs muted">All messages</button>
      </div>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto py-3">
        {messages.length === 0 ? <Empty title="Say hi 👋" body="Type a message to start the conversation." /> : messages.map((m) => (
          <div key={m._id} className={`max-w-[80%] rounded-2xl border px-3 py-2 text-sm ${m.system ? 'border-ink-200 text-ink-500 italic' : 'border-ink-200'}`}>
            {m.text}
            {m.attachment?.url && (
              m.attachment.type === 'image' ? <img src={m.attachment.url} alt="" className="mt-2 max-h-60 rounded-lg" /> :
              <a href={m.attachment.url} target="_blank" rel="noreferrer" className="mt-2 block underline">{m.attachment.name || 'Attachment'}</a>
            )}
            <div className="mt-1 text-[10px] muted">{new Date(m.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
        {typing && <div className="text-xs muted">typing…</div>}
      </div>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-ink-100 pt-3">
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary" disabled={!id}><Paperclip className="h-4 w-4" /></button>
        <input ref={fileRef} type="file" className="hidden" onChange={onFile} accept="image/*,application/pdf" />
        <input className="input flex-1" value={text} onChange={(e) => onType(e.target.value)} placeholder={id ? 'Type a message…' : 'Loading…'} disabled={!id} />
        <button className="btn-primary" disabled={!id}><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
