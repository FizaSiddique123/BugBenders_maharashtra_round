"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function YouTubeCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const err = searchParams.get("error");

    if (err) {
      setStatus("error");
      setErrorMsg(`Authorization failed: ${err}`);
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setErrorMsg("Missing authorization code or state.");
      return;
    }

    async function exchangeToken() {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        
        const res = await fetch(`${apiUrl}/api/integrations/youtube/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ code, state })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Failed to exchange token");
        }

        setStatus("success");
        setTimeout(() => {
          router.push("/analytics");
        }, 2000);
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e.message || "An unexpected error occurred.");
      }
    }

    exchangeToken();
  }, [searchParams, getToken, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold tracking-tighter">Connecting YouTube...</h2>
          <p className="text-sm text-gray-500">Please wait while we securely connect your account.</p>
        </div>
      )}
      
      {status === "success" && (
        <div className="flex flex-col items-center gap-4 text-green-600">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tighter text-black">YouTube Connected!</h2>
          <p className="text-sm text-gray-500">Redirecting to analytics...</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 text-red-600">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tighter text-black">Connection Failed</h2>
          <p className="text-sm text-red-500">{errorMsg}</p>
          <button 
            onClick={() => router.push("/analytics")}
            className="mt-4 px-4 py-2 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Return to Analytics
          </button>
        </div>
      )}
    </div>
  );
}
