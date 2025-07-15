
"use client";

import { useState, useEffect, useRef } from 'react';
import ChatMessage, { type Message } from '@/components/chat-message';
import ChatInputArea from '@/components/chat-input-area';
import { ScrollArea } from '@/components/ui/scroll-area';
import { processUserMessage } from './actions';
import type { CorrectGrammarAndRespondInput } from '@/ai/flows/correct-grammar-and-respond';
import { BotIcon } from 'lucide-react';

const INITIAL_GREETING_TEXT = "Hello! I'm LinguaLive, your AI English tutor. Speak or type to start practicing your English!";

export default function LinguaLivePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-ai-message',
      text: INITIAL_GREETING_TEXT,
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTo({ top: scrollAreaViewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const historyToKeep = 10;
    const conversationHistoryForAPI: CorrectGrammarAndRespondInput['conversationHistory'] =
      messages.slice(-historyToKeep).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.text,
      }));

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsAiResponding(true);

    try {
      const { aiResponse, audioDataUri } = await processUserMessage({ 
        userText: text,
        conversationHistory: conversationHistoryForAPI,
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      if (audioRef.current && audioDataUri) {
        audioRef.current.src = audioDataUri;
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessageText = "Sorry, I couldn't process that. Please try again.";
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: errorMessageText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsAiResponding(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b shadow-sm bg-background sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-2">
          <BotIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">LinguaLive</h1>
        </div>
      </header>

      <ScrollArea className="flex-grow" viewportRef={scrollAreaViewportRef}>
        <div className="container mx-auto p-4 space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isAiResponding && ( 
            <div className="flex justify-start items-end gap-2">
                <div className="h-8 w-8 flex-shrink-0">
                    <BotIcon className="h-full w-full text-primary" />
                </div>
                <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-md max-w-xs md:max-w-md">
                    <p className="text-sm animate-pulse">LinguaLive is thinking...</p>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <ChatInputArea onSubmit={handleSendMessage} isLoading={isAiResponding} />
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
