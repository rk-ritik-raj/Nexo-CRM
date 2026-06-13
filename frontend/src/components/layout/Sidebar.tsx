"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Segments",
    href: "/segments",
    icon: Layers,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    name: "Shopper Sandbox",
    href: "/sandbox",
    icon: Smartphone,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 text-zinc-200 border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-900 gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-linear-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="h-4 w-4 text-white animate-pulse" />
        </div>
        <span className="font-bold text-xl tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
           Nexo CRM
        </span>
        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
          AI-Native
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest px-3 mb-3">
          Core Operations
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                isActive
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"
                )}
              />
              {item.name}
              
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-linear-to-b from-violet-500 to-indigo-500 rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 border border-zinc-900">
          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-indigo-400 border border-zinc-700">
            MK
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold truncate text-zinc-200">
              Marketer Mode
            </div>
            <div className="text-[10px] text-zinc-500 truncate">
              Local Sandbox Connected
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
