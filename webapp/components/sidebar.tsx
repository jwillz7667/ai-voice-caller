"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Home,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Phone
} from "lucide-react";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
  isCollapsed: boolean;
};

const SidebarItem = ({ icon, label, href, isCollapsed }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full flex justify-start items-center py-3 gap-3 rounded-md",
          isActive 
            ? "bg-slate-100 text-slate-900 hover:bg-slate-200" 
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <span className={cn("shrink-0")}>{icon}</span>
        {!isCollapsed && <span className="truncate">{label}</span>}
      </Button>
    </Link>
  );
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-screen border-r border-slate-200 py-4 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="flex items-center gap-2 px-4 mb-8">
        {!isCollapsed && (
          <span className="text-xl font-semibold truncate">AI Voice Caller</span>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-auto p-0 h-8 w-8"
          onClick={toggleCollapse}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <div className="space-y-1 px-2">
        <SidebarItem
          icon={<Home size={20} />}
          label="Dashboard"
          href="/"
          isCollapsed={isCollapsed}
        />
        <SidebarItem
          icon={<Phone size={20} />}
          label="Call Interface"
          href="/"
          isCollapsed={isCollapsed}
        />
        <SidebarItem
          icon={<ClipboardList size={20} />}
          label="Logs"
          href="/logs"
          isCollapsed={isCollapsed}
        />
        <SidebarItem
          icon={<Settings size={20} />}
          label="Settings"
          href="/settings"
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  );
}
