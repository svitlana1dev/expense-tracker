import { useState, useRef } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="max-w-[680px] mx-auto">
      <div
        className={`flex items-center gap-2.5 bg-bg border-[1.5px] border-border rounded-xl pl-4 pr-1 py-1 transition-all
          focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(129,140,248,0.15)] focus-within:bg-surface
          ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          className="flex-1 border-none bg-transparent text-sm text-text outline-none py-2 min-w-0 placeholder:text-muted"
          type="text"
          placeholder={disabled ? 'Parsing expense…' : 'e.g. "Spent $20 on pizza" or "Paid Netflix $15.99"'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoFocus
          disabled={disabled}
        />
        <button
          className="w-[38px] h-[38px] rounded-lg bg-primary text-white flex items-center justify-center shrink-0 transition-all
            hover:bg-primary-hover active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          type="button"
          onClick={submit}
          disabled={!value.trim() || disabled}
          aria-label="Send"
        >
          {disabled ? (
            <svg
              className="animate-spin"
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
