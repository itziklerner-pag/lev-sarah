"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect, useRef } from "react";

type Step = "phone" | "sent";

interface PhoneLoginProps {
  /** Pre-fill phone number (from expired magic link resend flow) */
  initialPhone?: string;
  /** Auto-submit to resend link when coming from expired link */
  autoResend?: boolean;
  /** Callback when login is successful (not used - login happens via magic link click) */
  onSuccess?: () => void;
}

export function PhoneLogin({ initialPhone, autoResend }: PhoneLoginProps) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const hasAutoResent = useRef(false);

  // Format phone for display
  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 14)}`;
  };

  // Convert to international format
  const toInternational = (phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, "");
    // If starts with 0, assume Israeli and replace with +972
    if (digits.startsWith("0")) {
      return `+972${digits.slice(1)}`;
    }
    // If starts with 1 and is 10-11 digits, assume US
    if (digits.startsWith("1") && digits.length >= 10 && digits.length <= 11) {
      return `+${digits}`;
    }
    // If 10 digits without country code, assume US
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    // If already has country code (starts with country code)
    if (digits.length > 10) {
      return `+${digits}`;
    }
    // Default: assume Israeli number
    return `+972${digits}`;
  };

  const handlePhoneSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    setResendMessage("");

    try {
      const internationalPhone = toInternational(phone);
      await signIn("whatsapp-phone", { phone: internationalPhone });
      setStep("sent");
      if (autoResend && hasAutoResent.current) {
        setResendMessage("נשלח קישור חדש!");
      }
    } catch (err) {
      setError("שגיאה בשליחת הקישור. נסה שוב.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-resend when coming from expired magic link
  useEffect(() => {
    if (initialPhone && autoResend && !hasAutoResent.current && phone.length >= 9) {
      hasAutoResent.current = true;
      handlePhoneSubmit();
    }
  }, [initialPhone, autoResend, phone]);

  if (step === "phone") {
    return (
      <form onSubmit={handlePhoneSubmit} className="w-full max-w-xs space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            מספר טלפון
          </label>
          <input
            id="phone"
            type="tel"
            value={formatPhoneDisplay(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="050-123-4567 / 555-123-4567"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            dir="ltr"
            autoComplete="tel"
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        {resendMessage && (
          <p className="text-green-600 text-sm text-center">{resendMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading || phone.length < 9}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "שולח..." : "שלח קישור בוואטסאפ"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          נשלח לך קישור להתחברות מהירה בוואטסאפ
        </p>
      </form>
    );
  }

  // "sent" step - show check WhatsApp message
  return (
    <div className="w-full max-w-xs space-y-4 text-center">
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <svg
          className="w-12 h-12 mx-auto text-green-500 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          נשלח קישור לוואטסאפ!
        </h3>
        <p className="text-sm text-gray-600">
          פתח את הוואטסאפ ולחץ על כפתור ההתחברות
        </p>
        <p className="text-xs text-gray-500 mt-2">
          ({formatPhoneDisplay(phone)})
        </p>
      </div>

      {resendMessage && (
        <p className="text-green-600 text-sm">{resendMessage}</p>
      )}

      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setError("");
        }}
        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        שלח שוב לטלפון אחר
      </button>

      <button
        type="button"
        onClick={() => {
          setResendMessage("");
          handlePhoneSubmit();
        }}
        disabled={loading}
        className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {loading ? "שולח..." : "שלח קישור חדש"}
      </button>
    </div>
  );
}
