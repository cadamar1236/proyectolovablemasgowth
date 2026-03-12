import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const ASTRO_BASE = import.meta.env.VITE_ASTRO_URL || 'https://lovablegrowth.com';

// ─── helpers ───────────────────────────────────────────────────────────────
function escapeHtml(text) {
  if (!text) return '';
  let t = String(text);
  t = t.replace(/^[|].*[|]\s*$/gm, '');
  t = t.replace(/^[|][-:\s|]+[|]\s*$/gm, '');
  t = t.replace(/\n{3,}/g, '\n\n');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  t = t.replace(/^#{1,3}\s+(.+)$/gm, '<strong>$1</strong>');
  t = t.replace(/^[-*]\s+/gm, '• ');
  t = t.replace(/\n/g, '<br/>');
  return t;
}

const MOCK_MESSAGES = [
  {
    role: 'assistant',
    content: "Hey! I'm **Astro ⚡**, your AI cofounder. I'm here to help you move faster — strategy, tasks, investors, growth. What's happening this week?",
    ts: Date.now() - 5000,
  },
];

// ─── Message bubble ─────────────────────────────────────────────────────────
const Bubble = ({ msg, isLast }) => {
  const isUser = msg.role === 'user';
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white mr-2 shrink-0 mt-1">
          ⚡
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-purple-600 text-white rounded-tr-sm'
            : 'bg-white/8 border border-white/10 text-gray-100 rounded-tl-sm'
        }`}
        dangerouslySetInnerHTML={{ __html: escapeHtml(msg.content) }}
      />
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white ml-2 shrink-0 mt-1">
          Tú
        </div>
      )}
    </div>
  );
};

// ─── Typing indicator ────────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex justify-start mb-3">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white mr-2 shrink-0 mt-1">
      ⚡
    </div>
    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center space-x-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export default function AstroChat({ userData, onTasksExtracted }) {
  const isGuest = localStorage.getItem('guestMode') === 'true';

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef(null);
  const mediaRef = useRef(null);
  const textareaRef = useRef(null);

  // load session
  useEffect(() => {
    const sid = localStorage.getItem('astroSessionId');
    if (sid) setSessionId(sid);
  }, []);

  // scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      if (isGuest) {
        // lightweight mock
        await new Promise(r => setTimeout(r, 900));
        const guestReply = {
          role: 'assistant',
          content: "Great context! As a guest I can't save your data, but I'd suggest you focus on **one clear goal this week** and break it into 3 concrete tasks. Want me to help you create them?",
          ts: Date.now(),
        };
        setMessages(prev => [...prev, guestReply]);
      } else {
        const history = messages.slice(-12).map(m => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch(`${ASTRO_BASE}/api/astro-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history,
            sessionId,
            userId: userData?.id,
            language: navigator.language?.startsWith('es') ? 'es' : 'en',
          }),
        });

        const data = await res.json();
        const reply = data.response || data.message || "I didn't catch that — can you rephrase?";
        const newSid = data.sessionId || sessionId;
        if (newSid && newSid !== sessionId) {
          setSessionId(newSid);
          localStorage.setItem('astroSessionId', newSid);
        }

        setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);

        // bubble up extracted tasks/goals
        if (data.extractedData?.action_items?.length && onTasksExtracted) {
          onTasksExtracted(data.extractedData.action_items);
        }
      }
    } catch (err) {
      console.error('Astro chat error', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Check your network and try again.",
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionId, userData, isGuest, onTasksExtracted]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Voice recording
  const toggleRecording = async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const form = new FormData();
        form.append('file', blob, 'voice.webm');
        try {
          const res = await fetch(`${ASTRO_BASE}/api/transcribe`, {
            method: 'POST', body: form,
          });
          const { text } = await res.json();
          if (text?.trim()) {
            setInput(text.trim());
            textareaRef.current?.focus();
          }
        } catch {
          /* silent */
        }
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
      setTimeout(() => {
        if (mediaRef.current?.state === 'recording') {
          mediaRef.current.stop();
          setRecording(false);
        }
      }, 60000);
    } catch {
      /* no mic */
    }
  };

  const QUICK_PROMPTS = [
    "¿Cuál debería ser mi objetivo #1 esta semana?",
    "Dame un plan de acción para conseguir mis primeros 100 usuarios",
    "¿Cómo puedo mejorar mi pitch?",
    "Ayúdame a crear mi deck para inversores",
  ];

  return (
    <div className="flex flex-col h-full bg-black/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg mr-3">
          ⚡
        </div>
        <div>
          <div className="font-bold text-white text-sm">Astro</div>
          <div className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            AI Cofounder · online
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isGuest && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded px-2 py-0.5">
              Guest
            </span>
          )}
          <button
            onClick={() => {
              setMessages(MOCK_MESSAGES);
              setSessionId(null);
              localStorage.removeItem('astroSessionId');
            }}
            title="Clear chat"
            className="text-gray-500 hover:text-gray-300 transition text-xs"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} isLast={i === messages.length - 1} />
        ))}
        {loading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — shown only when ≤ 1 message */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => send(p)}
              className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-full px-3 py-1.5 transition"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 pb-3">
        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-purple-500/50 transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Cuéntale a Astro qué está pasando…"
            rows={1}
            className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder-gray-500 max-h-32"
            style={{ lineHeight: '1.5' }}
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleRecording}
              title={recording ? 'Detener' : 'Hablar'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                recording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              🎙
            </button>
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-center text-gray-600 text-xs mt-1.5">Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    </div>
  );
}
