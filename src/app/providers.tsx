"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useState, useEffect, createContext, useContext } from "react";
import { ErrorBoundary, OfflineMessage } from "@/components/common/error-boundary";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

// Online status context
const OnlineContext = createContext<boolean>(true);
export const useOnlineStatus = () => useContext(OnlineContext);

function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OnlineContext.Provider value={isOnline}>
      {children}
      {!isOnline && <OfflineMessage />}
    </OnlineContext.Provider>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <OnlineStatusProvider>
        <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
      </OnlineStatusProvider>
    </ErrorBoundary>
  );
}
