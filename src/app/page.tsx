
"use client";

import { useState, useEffect, useRef } from 'react';
import ChatMessage, { type Message } from '@/components/chat-message';
import ChatInputArea from '@/components/chat-input-area';
import { ScrollArea } from '@/components/ui/scroll-area';
import { processUserMessage } from './actions';
import type { CorrectGrammarAndRespondInput } from '@/ai/flows/correct-grammar-and-respond';
import { BotIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [areVoicesLoaded, setAreVoicesLoaded] = useState(false); // New state
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
        const checkAndSetVoicesLoaded = () => {
            const currentVoices = window.speechSynthesis.getVoices();
            if (currentVoices.length > 0) {
                setAreVoicesLoaded(true);
                // Once voices are loaded, we can optionally remove the listener
                // if we don't expect the voice list to change, or don't need to react to it.
                // For now, to be safe, especially if system voices can change, we can leave it.
                // If issues persist or for optimization, one could remove it:
                // window.speechSynthesis.onvoiceschanged = null;
            }
        };
        
        // Check immediately in case voices are already available
        checkAndSetVoicesLoaded();
        
        // Subscribe to voiceschanged event for asynchronous loading
        window.speechSynthesis.onvoiceschanged = checkAndSetVoicesLoaded;

        return () => {
            window.speechSynthesis.onvoiceschanged = null; // Cleanup listener
            if (window.speechSynthesis.speaking) { // Cleanup speech if component unmounts
                window.speechSynthesis.cancel();
            }
        };
    }
  }, []); // Runs once on mount to setup voice loading


  const scrollToBottom = () => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTo({ top: scrollAreaViewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect for speaking the initial AI message, now dependent on voices being loaded
  useEffect(() => {
    if (
      messages.length === 1 &&
      messages[0].id === 'initial-ai-message' &&
      messages[0].text === INITIAL_GREETING_TEXT && // Be specific about the message
      areVoicesLoaded // Only speak if voices are confirmed to be loaded
    ) {
      speak(messages[0].text);
    }
  // messages and areVoicesLoaded are the key dependencies.
  // speak function could be a dependency if it's memoized with useCallback,
  // or if its definition changes based on other state/props.
  // For now, this should be fine.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, areVoicesLoaded]);


  const handleSendMessage = async (text: string) => {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
    }

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
      if (areVoicesLoaded) { // Also check here before speaking subsequent messages
        speak(aiResponse);
      } else {
        // Handle case where voices might not be loaded yet for some reason,
        // though less likely for subsequent messages.
        toast({
          title: "Speech Warning",
          description: "Voices not ready, cannot play audio response.",
          variant: "default",
        });
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
      if (areVoicesLoaded) {
        speak(errorMessageText);
      }
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
