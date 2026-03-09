import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@lib/utils/cn';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 2000);
  };

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;

    await onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
    setIsTyping(false);
    onTyping(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border-t border-charcoal-200 bg-white">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-navy-50 rounded-lg"
            >
              <PaperClipIcon className="w-4 h-4 text-navy" />
              <span className="text-sm text-charcoal max-w-[150px] truncate">
                {file.name}
              </span>
              <span className="text-xs text-muted">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-1 hover:bg-navy-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-navy" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="input-field resize-none min-h-[44px] max-h-[120px] py-3"
          />
        </div>

        <div className="flex items-center gap-1">
          {/* Attachments Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="icon-btn"
            type="button"
          >
            <PaperClipIcon className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || disabled}
            className={cn(
              'w-11 h-11 flex items-center justify-center rounded-xl transition-all',
              message.trim() || attachments.length > 0
                ? 'bg-navy-700 hover:bg-navy-800 text-white'
                : 'bg-charcoal-200 text-charcoal-400'
            )}
            type="button"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};