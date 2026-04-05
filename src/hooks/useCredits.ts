"use client";

import { useState, useCallback } from "react";
import { getRecruiterCredits } from "@/lib/payments/credit-service";

export function useCredits(recruiterId?: string) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!recruiterId) return;
    setLoading(true);
    try {
      const c = await getRecruiterCredits(recruiterId);
      setCredits(c);
    } finally {
      setLoading(false);
    }
  }, [recruiterId]);

  return { credits, loading, refresh };
}
