import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Phone, MessageSquare, Wrench } from "lucide-react";
import { Item } from "@/components/types";

type TranscriptProps = {
  items: Item[];
};

const Transcript: React.FC<TranscriptProps> = ({ items }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  // Show messages, function calls, and function call outputs in the transcript
  const transcriptItems = items.filter(
    (it) =>
      it.type === "message" ||
      it.type === "function_call" ||
      it.type === "function_call_output"
  );

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full py-3 px-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 border-b border-gray-100 dark:border-gray-700 flex items-center">
        <MessageSquare className="h-4 w-4 text-indigo-500 mr-2" />
        <h3 className="text-sm font-semibold">Conversation Transcript</h3>
      </div>
      
      <div className="flex-1 h-full min-h-0 overflow-hidden flex flex-col pt-12">
        {transcriptItems.length === 0 ? (
          <div className="flex flex-1 h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 justify-center h-full">
              <div className="h-[140px] w-[140px] rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center animate-pulse-slow">
                <MessageSquare className="h-16 w-16 text-indigo-200 dark:text-indigo-700 bg-transparent" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  No conversation yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start a call to see the transcript
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 p-6">
              {transcriptItems.map((msg, i) => {
                const isUser = msg.role === "user";
                const isTool = msg.role === "tool";
                const Icon = isUser ? Phone : isTool ? Wrench : Bot;
                const isLast = i === transcriptItems.length - 1;

                // Combine all text parts into a single string for display
                const displayText = msg.content
                  ? msg.content.map((c) => c.text).join("")
                  : "";

                return (
                  <div 
                    key={i} 
                    className={`flex items-start gap-3 ${isLast ? 'animate-fade-in' : ''}`}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                        isUser
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                          : isTool
                          ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={`flex-1 min-w-0 ${isUser ? 'pr-12' : 'pl-0 pr-0'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-sm font-medium ${
                            isUser ? "text-blue-600 dark:text-blue-400" : 
                            isTool ? "text-amber-600 dark:text-amber-400" : 
                            "text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          {isUser
                            ? "Caller"
                            : isTool
                            ? "Tool Response"
                            : "Assistant"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {msg.timestamp || "Just now"}
                        </span>
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed break-words ${
                        isUser 
                          ? "bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-200" 
                          : isTool 
                          ? "bg-amber-50 dark:bg-amber-900/20 text-gray-800 dark:text-gray-200" 
                          : "bg-indigo-50 dark:bg-indigo-900/20 text-gray-800 dark:text-gray-200"
                      }`}>
                        {displayText}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Transcript;
