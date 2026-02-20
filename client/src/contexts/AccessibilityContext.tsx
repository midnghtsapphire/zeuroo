import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AccessibilityMode = "none" | "eco" | "neuro" | "dyslexic" | "no-blue-light";

interface AccessibilityContextType {
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => void;
  wcagAAA: boolean;
  setWcagAAA: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  mode: "none",
  setMode: () => {},
  wcagAAA: false,
  setWcagAAA: () => {},
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AccessibilityMode>(() => {
    return (localStorage.getItem("zeuroo-a11y-mode") as AccessibilityMode) || "none";
  });
  const [wcagAAA, setWcagAAA] = useState(() => {
    return localStorage.getItem("zeuroo-wcag-aaa") === "true";
  });

  useEffect(() => {
    localStorage.setItem("zeuroo-a11y-mode", mode);
    const root = document.documentElement;
    root.classList.remove("eco-mode", "neuro-mode", "dyslexic-mode", "no-blue-light");
    if (mode === "eco") root.classList.add("eco-mode");
    if (mode === "neuro") root.classList.add("neuro-mode");
    if (mode === "dyslexic") root.classList.add("dyslexic-mode");
    if (mode === "no-blue-light") root.classList.add("no-blue-light");
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("zeuroo-wcag-aaa", String(wcagAAA));
  }, [wcagAAA]);

  return (
    <AccessibilityContext.Provider value={{ mode, setMode, wcagAAA, setWcagAAA }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
