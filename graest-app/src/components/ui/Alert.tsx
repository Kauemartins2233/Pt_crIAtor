import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AlertProps {
  variant?: "info" | "warning";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variants = {
  info: "border-primary-200 dark:border-primary-800/50 bg-primary-50 dark:bg-primary-950/30 text-primary-800 dark:text-primary-300 border-l-primary-500",
  warning: "border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-l-amber-500",
};

export function Alert({ variant = "info", icon, children, className }: AlertProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-l-4 px-4 py-3 text-sm",
        variants[variant],
        className
      )}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}
