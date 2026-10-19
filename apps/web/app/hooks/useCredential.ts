"use client";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@repo/common/zod";
import { api } from "../lib/api";
import { useSession } from "next-auth/react";

export const useCredentials = (type: string, workflowId?: string): any => {
  const [cred, setCred] = useState<any[]>([]);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  useEffect(() => {
    const fetchCred = async () => {
      try {
        setIsLoading(true);
        // Clear credentials and authUrl when type is empty to prevent leaking credentials
        if (!type) {
          setCred([]);
          setAuthUrl(null);
          return;
        }

        const response = await api.Credentials.getCredentials(type);
        const data = JSON.stringify(response);
        console.log("This is the log from usecredentials", data);
        // Backend should ONLY return stored credentials
        if (response.hasCredentials) {
          setCred(response.data);
        } else {
          console.log("Redirect url:", window.location.pathname);
          const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
          const url = `${BACKEND_URL}/auth/google/initiate?authType=${type}&redirect_url=${encodeURIComponent(window.location.pathname)}${tokenParam}`;
          setAuthUrl(url);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchCred();
  }, [type, workflowId, token]);

  return { cred, authUrl, isLoading };
};
