"use client";

import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X } from "lucide-react";

export function Toast() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => {
        dispatch({ type: "CLEAR_TOAST" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.toast, dispatch]);

  if (!state.toast) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:bottom-6">
      <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
        <button
          onClick={() => {
            dispatch({ type: "SET_TAB", tab: "comps" });
            dispatch({ type: "CLEAR_TOAST" });
          }}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {state.toast.message}
        </button>
        <button
          onClick={() => dispatch({ type: "CLEAR_TOAST" })}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
