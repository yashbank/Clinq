"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "clinq_dismissed_suggestions_v1";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string" && x.length > 0));
  } catch {
    return new Set();
  }
}

function writeSet(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(0, 200)));
  } catch {
    /* ignore quota */
  }
}

export function useDismissedSuggestionIds() {
  const [dismissed, setDismissed] = useState<Set<string>>(() => readSet());

  useEffect(() => {
    setDismissed(readSet());
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeSet(next);
      return next;
    });
  }, []);

  const isDismissed = useMemo(() => (id: string) => dismissed.has(id), [dismissed]);

  return { dismissed, dismiss, isDismissed };
}
