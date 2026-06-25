"use client";
import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const colors = {
    success: "bg-[#eaf3ef] border-[#cfe6dd] text-[#2f6f4c]",
    error: "bg-[#f6e6e1] border-[#e8cabf] text-[#9d3c29]",
    info: "bg-white border-[#ece5d6] text-[#16323a]",
  };

  const icons = { success: "✓", error: "✕", info: "ℹ" };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto ${colors[t.type]}
                        border rounded-xl px-5 py-3 shadow-lg
                        backdrop-blur-md text-sm font-medium
                        animate-[fadeSlideIn_0.3s_ease-out]
                        flex items-center gap-2.5 max-w-sm`}
          >
            <span className="text-base">{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
