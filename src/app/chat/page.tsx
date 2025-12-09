'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/lib/hooks/useLanguage';
import apiClient from '@/lib/utils/apiClient';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { VoiceOutput } from '@/components/voice/VoiceOutput';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const { getSpeechLanguage } = useLanguage();
  const { user, loading: authLoading } = useAuth(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadConversations();
    }
  }, [authLoading, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await apiClient.get('/api/chat/conversations');
      if (response.data.success && response.data.data.conversations.length > 0) {
        const conv = response.data.data.conversations[0];
        setConversationId(conv.id);
        // Load messages if needed
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/chat/message', {
        message: userMessage.content,
        conversationId: conversationId || undefined,
        language: i18n.language, // Send language preference to API
      });

      if (response.data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        if (response.data.data.conversationId) {
          setConversationId(response.data.data.conversationId);
        }
        
        // Auto-play voice output if enabled
        if (voiceEnabled) {
          // VoiceOutput component will handle this
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error.response?.data?.error || t('chat.sorryError'),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    handleSend(transcript);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop();

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-responsive font-bold text-primary-700">
              {t('chat.title')}
            </h1>
            <p className="text-secondary-600 mt-2">
              {t('chat.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              voiceEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300'
            }`}
            title={voiceEnabled ? t('voice.disableVoice') : t('voice.enableVoice')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md border border-secondary-200 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-secondary-600 py-12">
              <p className="mb-2">{t('chat.startConversation')}</p>
              <p className="text-sm">{t('chat.startConversationDesc')}</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 text-secondary-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === 'assistant' && voiceEnabled && index === messages.length - 1 && (
                    <div className="mt-2">
                      <VoiceOutput
                        text={message.content}
                        language={getSpeechLanguage()}
                        autoPlay={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary-100 text-secondary-800 rounded-lg px-4 py-2">
                <span className="animate-pulse">{t('chat.thinking')}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-secondary-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.typeMessage')}
              className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              language={getSpeechLanguage()}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


