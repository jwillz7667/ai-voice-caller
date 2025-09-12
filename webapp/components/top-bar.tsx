import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Github, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const TopBar = () => {
  return (
    <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-800 px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/" className="sm:mr-2">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-10 sm:w-10">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-1.5 sm:p-2 rounded-lg">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h1 className="text-base sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">Jingle.AI</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
          <Link
            href="https://platform.openai.com/docs/guides/realtime"
            className="flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Docs</span>
          </Link>
        </Button>
        
        <Button variant="ghost" size="sm" className="rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
          <Link
            href="https://github.com/yourusername/openai-realtime-twilio-demo"
            className="flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </Link>
        </Button>
        
        <ThemeToggle />
      </div>
    </div>
  );
};

export default TopBar;
