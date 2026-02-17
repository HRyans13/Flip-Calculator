"use client";

import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { ActiveTab } from "@/lib/types";
import { Home, BarChart3, Calculator } from "lucide-react";

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: "property", label: "Property", icon: <Home className="h-4 w-4" /> },
  { id: "comps", label: "Comps", icon: <BarChart3 className="h-4 w-4" /> },
  {
    id: "calculator",
    label: "Calculator",
    icon: <Calculator className="h-4 w-4" />,
  },
];

export function TabShell({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop top tabs */}
      <header className="hidden border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900 md:block">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-8 py-3">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Flip Calculator
            </h1>
            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => dispatch({ type: "SET_TAB", tab: tab.id })}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    state.activeTab === tab.id
                      ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900 md:hidden">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Flip Calculator
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900 md:hidden">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: "SET_TAB", tab: tab.id })}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                state.activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-neutral-400 dark:text-neutral-500"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
