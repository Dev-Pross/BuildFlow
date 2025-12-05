"use client";
import { useEffect, useState } from "react";
import type { AvailableTrigger } from "../types/workflow.types";
import { getAvailableTriggers } from "../workflow/lib/config";

export function useTriggers(shouldFetch: boolean) {
  const [triggers, setTriggers] = useState<AvailableTrigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetch) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAvailableTriggers();
        setTriggers(response.Data);
      } catch (err) {
        setError("Error while fetching triggers");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shouldFetch]);

  return { triggers, loading, error };
}
