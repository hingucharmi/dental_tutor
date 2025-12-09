'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface VoiceOutputProps {
  text: string;
  language?: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function VoiceOutput({
  text,
  language = 'en-US',
  autoPlay = false,
  onStart,
  onEnd,
  onError,
}: VoiceOutputProps) {
  const { t } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API (Text-to-Speech)
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      if (onError) {
        onError(t('voice.notSupported'));
      }
    }

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onError, t]);

  useEffect(() => {
    if (text && autoPlay && isSupported) {
      speak();
    }
  }, [text, autoPlay, isSupported]);

  const speak = () => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (onStart) {
        onStart();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) {
        onEnd();
      }
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      if (onError) {
        onError(t('voice.error'));
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={isSpeaking ? stop : speak}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        isSpeaking
          ? 'bg-orange-500 text-white hover:bg-orange-600'
          : 'bg-green-500 text-white hover:bg-green-600'
      }`}
      aria-label={isSpeaking ? t('voice.stopListening') : t('voice.startListening')}
    >
      {isSpeaking ? (
        <>
          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4-1a1 1 0 011 1v4a1 1 0 11-2 0V7a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">{t('voice.speaking')}</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-4.707a1 1 0 011.617-.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">{t('voice.enableVoice')}</span>
        </>
      )}
    </button>
  );
}

