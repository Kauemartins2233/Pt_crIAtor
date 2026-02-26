"use client";

import Link from "next/link";
import Image from "next/image";
import { FileText, Puzzle, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-surface-850/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src={theme === "dark" ? "/logo-full-dark.png" : "/logo-full.png"}
            alt="Graest"
            width={120}
            height={36}
            className="h-8 w-auto drop-shadow-sm"
            priority
          />
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavLink href="/plans" icon={<FileText size={18} />} label="Planos" />
          <NavLink href="/snippets" icon={<Puzzle size={18} />} label="Snippets" />
          <div className="ml-2 h-5 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={toggleTheme}
            className="ml-1 rounded-lg p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200"
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/50 hover:text-primary-700 dark:hover:text-primary-300"
    >
      {icon}
      {label}
    </Link>
  );
}
