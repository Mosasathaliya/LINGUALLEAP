
"use client";

import { useState, useEffect, useRef } from 'react';
import ChatMessage, { type Message } from '@/components/chat-message';
import ChatInputArea from '@/components/chat-input-area';
import { ScrollArea } from '@/components/ui/scroll-area';
import { processUserMessage } from './actions';
import type { CorrectGrammarAndRespondInput } from '@/ai/flows/correct-grammar-and-respond';
import { BotIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function LinguaLivePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-ai-message',
      text: "Hello! I'm LinguaLive, your AI English tutor. Speak or type to start practicing your English!",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);


  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; 
      
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.startsWith('en') && voice.default) || voices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = (event) => {
        console.error("Speech synthesis error", event);
        toast({
          title: "Speech Error",
          description: "Could not play audio response.",
          variant: "destructive",
        });
        setIsAiSpeaking(false);
      };
      
      utteranceRef.current = utterance; 
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Speech Feature Not Available",
        description: "Text-to-speech is not supported by your browser.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const loadVoices = () => {
            window.speechSynthesis.getVoices(); 
        };
        loadVoices(); 
        window.speechSynthesis.onvoiceschanged = loadVoices; 

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }
  }, []);


  const scrollToBottom = () => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTo({ top: scrollAreaViewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'initial-ai-message' && !messages[0].text.startsWith("Hello! I'm LinguaLive")) {
        // Only speak if it's the very first default message, to avoid re-speaking if user refreshes.
        // This logic might need adjustment if the initial message changes or if we want it to always speak on first load.
    } else if (messages.length === 1 && messages[0].id === 'initial-ai-message') {
      setTimeout(() => speak(messages[0].text), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSendMessage = async (text: string) => {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
    }

    const historyToKeep = 10;
    // Prepare conversation history from messages *before* adding the current user's message
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
      const { aiResponse } = await processUserMessage({ 
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
      speak(aiResponse);
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
      speak(errorMessageText);
    } finally {
      setIsAiResponding(false);
    }
  };
  
  const isLoadingOverall = isAiResponding || isAiSpeaking;

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
          {isAiResponding && !isAiSpeaking && ( 
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

      <ChatInputArea onSubmit={handleSendMessage} isLoading={isLoadingOverall} />
    </div>
  );
}
