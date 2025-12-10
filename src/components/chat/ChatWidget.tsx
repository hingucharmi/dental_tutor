'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/lib/hooks/useLanguage';
import apiClient from '@/lib/utils/apiClient';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function ChatWidget() {
  const { t, i18n } = useTranslation();
  const { getSpeechLanguage } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMessages = async (convId: number) => {
    try {
      const messagesResponse = await apiClient.get(`/api/chat/conversations/${convId}/messages`);
      if (messagesResponse.data.success && messagesResponse.data.data.messages) {
        const loadedMessages = messagesResponse.data.data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Continue even if messages fail to load
    }
  };

  const loadConversations = async () => {
    try {
      const response = await apiClient.get('/api/chat/conversations');
      if (response.data.success && response.data.data.conversations.length > 0) {
        const conv = response.data.data.conversations[0];
        setConversationId(conv.id);
        
        // Load messages for this conversation
        await loadMessages(conv.id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      loadConversations();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // Don't clear messages when closing - keep them for next time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated, user]);

  // Reload messages when conversationId changes (e.g., new conversation created)
  useEffect(() => {
    if (conversationId && isAuthenticated && user && isOpen) {
      loadMessages(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const textToSend = input.trim();
    if (!textToSend || loading || !isAuthenticated) return;

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
        language: i18n.language,
      });

      if (response.data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        if (response.data.data.conversationId) {
          const newConvId = response.data.data.conversationId;
          if (newConvId !== conversationId) {
            setConversationId(newConvId);
          }
        }

        // Dispatch events to refresh appointments page if appointment was modified
        if (response.data.data.appointmentAction) {
          const action = response.data.data.appointmentAction;
          const appointmentId = response.data.data.appointmentId;
          
          if (action === 'booked') {
            window.dispatchEvent(new CustomEvent('appointment-created', { detail: { appointmentId } }));
          } else if (action === 'cancelled') {
            window.dispatchEvent(new CustomEvent('appointment-cancelled', { detail: { appointmentId } }));
          } else if (action === 'rescheduled') {
            window.dispatchEvent(new CustomEvent('appointment-rescheduled', { detail: { appointmentId } }));
          }
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error.response?.data?.error || t('chat.sorryError', 'Sorry, I encountered an error. Please try again.'),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Chat Button - Fixed Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-primary-600 text-white rounded-full p-3 sm:p-4 shadow-lg hover:bg-primary-700 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={t('chat.openChat', 'Open chat')}
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
            <span className="sr-only">New messages</span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[calc(100vh-8rem)] sm:h-[600px] max-h-[600px] bg-white rounded-lg shadow-2xl border border-secondary-200 flex flex-col">
          {/* Header */}
          <div className="bg-primary-600 text-white p-3 sm:p-4 rounded-t-lg flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
              <h3 className="font-semibold text-sm sm:text-base">{t('chat.assistant', 'Dental Assistant')}</h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                // Don't clear messages - keep history until logout
              }}
              className="text-white hover:text-gray-200 transition-colors p-1"
              aria-label={t('chat.closeChat', 'Close chat')}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-secondary-600 py-6 sm:py-8">
                <div className="mb-3 sm:mb-4">
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm font-medium mb-1">{t('chat.welcome', 'Hello! How can I help you today?')}</p>
                <p className="text-xs text-secondary-500 px-2">
                  {t('chat.startConversationDesc', 'Ask me about appointments, services, or dental care tips.')}
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-secondary-800 border border-secondary-200'
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-secondary-800 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 border border-secondary-200">
                  <span className="text-xs sm:text-sm animate-pulse">{t('chat.thinking', 'Thinking...')}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="border-t border-secondary-200 p-2 sm:p-3 bg-white rounded-b-lg flex-shrink-0">
            <div className="flex gap-1.5 sm:gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.typeMessage', 'Type your message...')}
                className="flex-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                aria-label={t('common.send', 'Send')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

