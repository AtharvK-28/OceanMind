"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Persona = "fisher" | "researcher";

interface PersonaCtx {
  persona: Persona | null;
  ready: boolean; // true once localStorage has been read (avoids first-run flash)
  setPersona: (p: Persona | null) => void;
}

const Ctx = createContext<PersonaCtx>({ persona: null, ready: false, setPersona: () => {} });

export const usePersona = () => useContext(Ctx);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<Persona | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("oceanmind_persona");
    if (saved === "fisher" || saved === "researcher") setPersonaState(saved);
    setReady(true);
  }, []);

  const setPersona = useCallback((p: Persona | null) => {
    setPersonaState(p);
    if (p) localStorage.setItem("oceanmind_persona", p);
    else localStorage.removeItem("oceanmind_persona");
  }, []);

  return <Ctx.Provider value={{ persona, ready, setPersona }}>{children}</Ctx.Provider>;
}
