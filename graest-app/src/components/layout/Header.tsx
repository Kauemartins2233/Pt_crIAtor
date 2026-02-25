"use client";

import Link from "next/link";
import { FileText, Puzzle, LayoutDashboard } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Graest
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavLink href="/plans" icon={<FileText size={18} />} label="Planos" />
          <NavLink href="/snippets" icon={<Puzzle size={18} />} label="Snippets" />
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
    >
      {icon}
      {label}
    </Link>
  );
}
