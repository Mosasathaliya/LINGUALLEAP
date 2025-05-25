"use client";

import type { FC } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import { format } from 'date-fns';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
        </Avatar>
      )}
      <Card className={cn(
        "max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-xl shadow-md",
        isUser ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
      )}>
        <CardContent className="p-3">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          <p className={cn(
            "text-xs mt-1",
            isUser ? "text-muted-foreground/70 text-right" : "text-primary-foreground/70 text-left"
          )}>
            {format(message.timestamp, 'p')}
          </p>
        </CardContent>
      </Card>
      {isUser && (
         <Avatar className="h-8 w-8">
          <AvatarFallback><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
