
"use client";

import type { FC, FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Send, Loader2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInputAreaProps {
  onSubmit: (text: string) => void;
  isLoading: boolean; // True if AI is responding OR speaking
}

const ChatInputArea: FC<ChatInputAreaProps> = ({ onSubmit, isLoading }) => {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const speechResult = event.results[0][0].transcript;
        setInputText((prevText) => prevText + (prevText ? " " : "") + speechResult);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        let errorMessage = "Speech recognition error. Please try again.";
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
        } else if (event.error === 'no-speech') {
          errorMessage = "No speech detected. Please try speaking again.";
        }
        toast({
          title: "Speech Recognition Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
    } else {
      console.warn("Speech recognition not supported by this browser.");
      // Optionally, disable mic functionality or inform user via toast
      // For now, the mic button just won't appear effectively if speechRecognitionRef.current is null
    }

    return () => {
      if (speechRecognitionRef.current && isRecording) {
        speechRecognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSubmit(inputText.trim());
      setInputText("");
    }
  };

  const handleButtonClick = () => {
    if (isLoading) return;

    if (isRecording) {
      speechRecognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (inputText.trim()) {
        // This case is handled by form submit, button click here means it's a submit action
        // So, if there's text, the form's onSubmit will trigger.
        // This explicit call handles if the button is clicked directly instead of Enter key.
         if (inputText.trim() && !isLoading) {
            onSubmit(inputText.trim());
            setInputText("");
        }
      } else {
        // No text, start recording
        if (speechRecognitionRef.current) {
          setInputText(""); // Clear any previous text before starting new recording
          speechRecognitionRef.current.start();
          setIsRecording(true);
        } else {
          toast({
            title: "Speech Feature Not Available",
            description: "Speech recognition is not supported by your browser.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    if (isRecording) {
      return <Square className="h-5 w-5" />; // Stop icon
    }
    if (inputText.trim()) {
      return <Send className="h-5 w-5" />;
    }
    return <Mic className="h-5 w-5" />;
  };
  
  const getButtonLabel = () => {
    if (isLoading) return "Processing...";
    if (isRecording) return "Stop recording";
    if (inputText.trim()) return "Send message";
    return "Start recording";
  }

  return (
    <form onSubmit={handleFormSubmit} className="p-4 border-t bg-background">
      <div className="flex items-center gap-2 rounded-lg border p-2 shadow-sm">
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or speak your message..."
          className="flex-grow resize-none border-0 shadow-none focus-visible:ring-0 p-2 min-h-[40px]"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isRecording) {
              e.preventDefault();
              handleFormSubmit(e);
            }
          }}
          disabled={isLoading || isRecording}
          aria-label="Chat input"
        />
        <Button 
          type={inputText.trim() && !isRecording ? "submit" : "button"} 
          size="icon" 
          onClick={inputText.trim() && !isRecording ? undefined : handleButtonClick}
          disabled={isLoading} 
          aria-label={getButtonLabel()}
        >
          {getButtonIcon()}
        </Button>
      </div>
    </form>
  );
};

export default ChatInputArea;
