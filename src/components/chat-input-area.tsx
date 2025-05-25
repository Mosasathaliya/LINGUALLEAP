"use client";

import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, Send, Loader2 } from "lucide-react";

interface ChatInputAreaProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const ChatInputArea: FC<ChatInputAreaProps> = ({ onSubmit, isLoading }) => {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSubmit(inputText.trim());
      setInputText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      <div className="flex items-center gap-2 rounded-lg border p-2 shadow-sm">
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message or practice speaking..."
          className="flex-grow resize-none border-0 shadow-none focus-visible:ring-0 p-2 min-h-[40px]"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={isLoading}
          aria-label="Chat input"
        />
        <Button type="submit" size="icon" disabled={isLoading || !inputText.trim()} aria-label="Send message">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : inputText.trim() ? (
            <Send className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  );
};

export default ChatInputArea;
