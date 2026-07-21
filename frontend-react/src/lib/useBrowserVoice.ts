"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Real speech in/out using the browser's Web Speech API — no external account.
// STT: Chrome/Edge/Android (webkitSpeechRecognition), sends audio to the
// browser's speech service. TTS: SpeechSynthesis (OS voices, works offline).
// Gracefully reports unsupported so the UI can fall back.

export const LANG_TAG: Record<string, string> = { hi: "hi-IN", ta: "ta-IN", en: "en-IN" };

export function useBrowserVoice() {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const recRef = useRef<unknown>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setSttSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      try { (recRef.current as { stop?: () => void } | null)?.stop?.(); } catch { /* noop */ }
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const startListening = useCallback((langTag: string, onResult: (text: string) => void) => {
    const w = window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR() as {
      lang: string; interimResults: boolean; maxAlternatives: number;
      start: () => void; stop: () => void;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null; onend: (() => void) | null;
    };
    rec.lang = langTag;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) onResult(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }, []);

  const stopListening = useCallback(() => {
    try { (recRef.current as { stop?: () => void } | null)?.stop?.(); } catch { /* noop */ }
    setListening(false);
  }, []);

  const speak = useCallback((text: string, langTag: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langTag;
    u.rate = 0.98;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, sttSupported, ttsSupported, startListening, stopListening, speak, stopSpeaking };
}
