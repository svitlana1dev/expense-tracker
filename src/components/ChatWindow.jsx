import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

/**
 * @param {{ messages: object[], onRetry?: (text: string) => void }} props
 */
export default function ChatWindow({ messages, onRetry }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full">
      <div className="max-w-[680px] mx-auto px-6 pt-7 pb-3 flex flex-col gap-5">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onRetry={onRetry} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
