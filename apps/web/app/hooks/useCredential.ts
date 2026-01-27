"use client";
import { useEffect, useState } from "react";
import { getCredentials } from "../workflow/lib/config";
import { BACKEND_URL } from "@repo/common/zod";

export const useCredentials = (type: string, workflowId?: string): any => {
  const [cred, setCred] = useState<any[]>([]);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCred = async () => {
      try {
        // Clear credentials and authUrl when type is empty to prevent leaking credentials
        if (!type) {
          setCred([]);
          setAuthUrl(null);
          return;
        }

        const response = await getCredentials(type);
        const data = JSON.stringify(response)
        console.log("This is the log from usecredentials" , data)
        // Backend should ONLY return stored credentials
        if (Array.isArray(response)) {
          setCred(response);
        } else {
          setCred([]);
        }

        // Frontend defines where to redirect for OAuth
        if (type === "google") {
          const baseUrl = `${BACKEND_URL}/oauth/google/initiate`;
          const url = workflowId ? `${baseUrl}?workflowId=${workflowId}` : baseUrl;
          setAuthUrl(url);
        } else {
          setAuthUrl(null);
        }
      } catch (e) {
        console.log(
          e instanceof Error
            ? e.message
            : "unknown error from useCredentials hook"
        );
        // Clear state on error to prevent stale data
        setCred([]);
        setAuthUrl(null);
      }
    };

    fetchCred();
  }, [type, workflowId]);

  return { cred, authUrl };
};
