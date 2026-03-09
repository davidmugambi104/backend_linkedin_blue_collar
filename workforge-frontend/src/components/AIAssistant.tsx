import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Send, X } from 'lucide-react';
import { axiosClient } from '@lib/axios';

interface AIAssistantProps {
  conversationContext?: string;
  onSuggestionSelect?: (suggestion: string) => void;
}

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

interface AskResponse {
  answers?: Array<{ answer: string }>;
  suggested_actions?: string[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  conversationContext,
  onSuggestionSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = useMemo(
    () => ({
      role: 'assistant' as const,
      content:
        "Hi! I'm your WorkForge assistant. I can help with jobs, profiles, messaging, and platform features.",
    }),
    []
  );

  const askMutation = useMutation({
    mutationFn: async (question: string) =>
      axiosClient.post<AskResponse>('/ai/ask', {
        query: question,
        context: conversationContext,
      }),
    onSuccess: (data) => {
      const answer = data.answers?.[0]?.answer || "I couldn't find a clear answer. Please rephrase your question.";
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: answer,
          suggestions: data.suggested_actions || [],
        },
      ]);
    },
    onError: () => {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: 'Something went wrong while answering. Please try again.',
        },
      ]);
    },
  });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, welcomeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();

    if (!value || askMutation.isPending) {
      return;
    }

    setMessages((previous) => [...previous, { role: 'user', content: value }]);
    askMutation.mutate(value);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
      return;
    }

    setQuery(suggestion);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center"
        aria-label="Open AI assistant"
      >
        <Sparkles size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[22rem] h-[32rem] bg-white bg-gray-900 border border-gray-200 border-gray-800 rounded-lg shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 border-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900 text-[#1A1A1A]">AI Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded hover:bg-gray-100 hover:bg-gray-800"
          aria-label="Close AI assistant"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 bg-gray-800 text-gray-900 text-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {message.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs rounded border border-gray-300 border-gray-700 px-2 py-1 hover:bg-white/20"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {askMutation.isPending && (
          <p className="text-xs text-slate-500">Assistant is thinking...</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 border-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask about WorkForge..."
            className="flex-1 rounded-lg border border-gray-300 border-gray-700 px-3 py-2 text-sm bg-white bg-gray-900"
          />
          <button
            type="submit"
            disabled={!query.trim() || askMutation.isPending}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send question"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
