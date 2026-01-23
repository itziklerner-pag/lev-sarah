"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";

type PageState = "validating" | "authenticating" | "expired" | "error" | "success";

function MagicLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();

  const [state, setState] = useState<PageState>("validating");
  const [phone, setPhone] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [returnUrl, setReturnUrl] = useState<string>("/schedule");
  const hasAttemptedAuth = useRef(false);
  const hasRedirected = useRef(false);

  const tokenValidation = useQuery(
    api.magicLink.validateMagicLinkToken,
    token ? { token } : "skip"
  );

  const consumeToken = useMutation(api.magicLink.consumeMagicLinkToken);
  const { signIn } = useAuthActions();

  const handleAuthenticate = useCallback(async () => {
    console.log("[MagicLink] handleAuthenticate called", {
      token: token ? `${token.substring(0, 8)}...` : null,
      hasAttemptedAuth: hasAttemptedAuth.current,
    });

    if (!token || hasAttemptedAuth.current) {
      console.log("[MagicLink] Skipping auth - no token or already attempted");
      return;
    }
    hasAttemptedAuth.current = true;

    setState("authenticating");

    try {
      // 1. Consume the magic link token and get the verification code
      console.log("[MagicLink] Consuming token...");
      const result = await consumeToken({ token });
      console.log("[MagicLink] consumeToken result:", {
        success: result.success,
        phone: result.phone,
        hasCode: !!result.code,
        returnUrl: result.returnUrl,
      });

      if (!result.success || !result.code) {
        console.log("[MagicLink] Token consumption failed");
        setState("error");
        setErrorMessage("Failed to verify token");
        return;
      }

      // Store return URL for redirect after auth settles
      setReturnUrl(result.returnUrl || "/schedule");

      // 2. Sign in via Convex Auth using the phone and the token as the code
      // The magic link token is also the verification code for the Phone provider
      console.log("[MagicLink] Calling signIn with phone:", result.phone);
      await signIn("whatsapp-phone", {
        phone: result.phone,
        code: result.code,
      });
      console.log("[MagicLink] signIn completed successfully");

      // Set success state - useEffect will handle redirect once auth is confirmed
      setState("success");
    } catch (err) {
      console.error("[MagicLink] Authentication error:", err);
      setState("error");
      setErrorMessage("Authentication failed. The link may have expired.");
    }
  }, [token, consumeToken, signIn]);

  // Redirect once auth is fully settled (after success state)
  useEffect(() => {
    if (
      state === "success" &&
      isAuthenticated &&
      !isAuthLoading &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true;
      // Small delay to ensure state is fully propagated
      setTimeout(() => {
        router.push(returnUrl);
      }, 200);
    }
  }, [state, isAuthenticated, isAuthLoading, returnUrl, router]);

  // Handle token validation result
  useEffect(() => {
    console.log("[MagicLink] useEffect triggered", {
      token: token ? `${token.substring(0, 8)}...` : null,
      tokenValidation,
      state,
      hasAttemptedAuth: hasAttemptedAuth.current,
    });

    if (!token) {
      console.log("[MagicLink] No token in URL");
      setState("error");
      setErrorMessage("Missing token");
      return;
    }

    if (tokenValidation === undefined) {
      console.log("[MagicLink] Token validation still loading...");
      // Still loading
      return;
    }

    console.log("[MagicLink] Token validation result:", tokenValidation);

    if (tokenValidation.valid) {
      console.log("[MagicLink] Token is valid, proceeding with auth");
      setPhone(tokenValidation.phone);
      // Auto-proceed with authentication
      handleAuthenticate();
    } else if (tokenValidation.error === "TOKEN_EXPIRED") {
      console.log("[MagicLink] Token expired");
      setState("expired");
      if ("phone" in tokenValidation) {
        setPhone(tokenValidation.phone);
      }
    } else if (tokenValidation.error === "TOKEN_ALREADY_USED") {
      console.log("[MagicLink] Token already used");
      setState("error");
      setErrorMessage("This link has already been used.");
    } else {
      console.log("[MagicLink] Token invalid:", tokenValidation.error);
      setState("error");
      setErrorMessage("Invalid or expired link.");
    }
  }, [token, tokenValidation, handleAuthenticate]);

  const handleRequestNewCode = () => {
    if (phone) {
      // Redirect to login with phone pre-filled and resend flag
      router.push(`/schedule?phone=${encodeURIComponent(phone)}&resend=true`);
    } else {
      // No phone available, just redirect to login
      router.push("/schedule");
    }
  };

  const handleGoToLogin = () => {
    router.push("/schedule");
  };

  // Format phone for display
  const formatPhoneDisplay = (phoneNumber: string) => {
    // Remove + prefix for display
    const digits = phoneNumber.replace(/^\+/, "");
    if (digits.startsWith("972")) {
      // Israeli number - format as 0XX-XXX-XXXX
      const localNumber = "0" + digits.slice(3);
      return `${localNumber.slice(0, 3)}-${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
    }
    return phoneNumber;
  };

  // Validating state
  if (state === "validating") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="mb-4">
            <svg
              className="w-12 h-12 mx-auto text-amber-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">מאמת את הקישור...</h1>
          <p className="text-gray-500 mt-2">רק רגע</p>
        </div>
      </main>
    );
  }

  // Authenticating state
  if (state === "authenticating") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="mb-4">
            <svg
              className="w-12 h-12 mx-auto text-green-500 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">מתחבר...</h1>
          <p className="text-gray-500 mt-2">הקישור תקין, מעביר אותך למערכת</p>
        </div>
      </main>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">התחברת בהצלחה!</h1>
          <p className="text-gray-500">מעביר אותך למערכת...</p>
        </div>
      </main>
    );
  }

  // Expired state
  if (state === "expired") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">פג תוקף הקישור</h1>
          <p className="text-gray-600 mb-4">
            הקישור היה בתוקף ל-10 דקות בלבד.
          </p>
          {phone && (
            <p className="text-gray-500 mb-6 text-sm">
              מספר: {formatPhoneDisplay(phone)}
            </p>
          )}
          <button
            onClick={handleRequestNewCode}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            שלח קוד חדש
          </button>
        </div>
      </main>
    );
  }

  // Error state
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">קישור לא תקין</h1>
        <p className="text-gray-600 mb-6">
          {errorMessage || "הקישור שגוי או כבר נוצל."}
        </p>
        <button
          onClick={handleGoToLogin}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          להתחברות
        </button>
      </div>
    </main>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense
      fallback={
        <main
          className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
            <div className="mb-4">
              <svg
                className="w-12 h-12 mx-auto text-amber-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">טוען...</h1>
          </div>
        </main>
      }
    >
      <MagicLinkContent />
    </Suspense>
  );
}
