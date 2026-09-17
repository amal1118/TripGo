'use client';

/**
 * ChatPanel — محادثة متدفقة مع المساعد.
 *
 * أداء:
 * - الرسائل المكتملة تُعرض عبر MessageBubble بـ memo؛ أثناء البث
 *   تتغيّر الرسالة الأخيرة فقط، فلا يُعاد رسم السجل كاملاً.
 * - النص المتدفق يُجمَّع في ref ويُدفع للحالة عبر rAF (دفعة واحدة لكل إطار)
 *   بدل setState لكل chunk — وهذا يمنع عشرات الرسومات في الثانية.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/trip';

const SUGGESTIONS = [
  'أرخص شهر للسفر إلى جورجيا؟',
  'قارن بين طوكيو وسيول لرحلة 6 أيام',
  'ما التأشيرة المطلوبة للسعوديين في ألبانيا؟',
  'اقترح وجهة باردة بميزانية 5000 ريال',
];

export function ChatPanel() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = React.useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content };
      const assistantId = crypto.randomUUID();
      const history = [...messages, userMsg];

      setMessages([...history, { id: assistantId, role: 'assistant', content: '' }]);
      setInput('');
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        });
        if (!res.ok || !res.body) throw new Error(await res.text());

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let frame = 0;

        // دفع الحالة مرة واحدة لكل إطار بدل كل chunk
        const flush = () => {
          frame = 0;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: buffer } : m)),
          );
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          if (!frame) frame = requestAnimationFrame(flush);
        }
        if (frame) cancelAnimationFrame(frame);
        flush();
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: 'تعذّر الاتصال بالمساعد. حاول مرة أخرى.' } : m,
          ),
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  const stop = React.useCallback(() => abortRef.current?.abort(), []);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void send(input);
      }
    },
    [input, send],
  );

  return (
    <div className="card-warm flex min-h-[62dvh] flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/15">
                <Sparkles className="size-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">رفيق TripGo جاهز</h2>
              <p className="mt-2 text-sm text-muted-foreground">اسأل عن أي شيء يخص رحلتك القادمة.</p>

              <div className="mt-7 grid gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-start text-sm transition-all hover:-translate-y-0.5 hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      <div className="border-t border-border/60 bg-card p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="اخبرني كيف يمكنني مساعدتك ..."
            className="min-h-[52px] flex-1"
            rows={1}
            disabled={streaming}
          />
          {streaming ? (
            <Button size="icon" variant="glass" onClick={stop} aria-label="إيقاف">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={() => void send(input)} disabled={!input.trim()} aria-label="إرسال">
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** يزيل رموز Markdown الشائعة (**عريض**، # عناوين، > اقتباس، أسوار الشيفرة) التي قد يُخرجها النموذج رغم التعليمات — الواجهة تعرض نصاً عادياً فقط. */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '');
}

const MessageBubble = React.memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const content = isUser ? message.content : stripMarkdown(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex', isUser ? 'justify-start' : 'justify-end')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]',
          isUser
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md border border-border bg-secondary/70 whitespace-pre-wrap',
        )}
      >
        {content || <Loader2 className="size-4 animate-spin text-primary" />}
      </div>
    </motion.div>
  );
});
