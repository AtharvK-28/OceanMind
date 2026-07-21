"use client";
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[70] bg-[#c0772f] text-white text-center text-xs py-2 font-medium
                 flex items-center justify-center gap-2"
    >
      <i className="ph ph-wifi-slash text-[14px]" />
      You&apos;re offline — showing the last data that loaded successfully.
    </div>
  );
}
