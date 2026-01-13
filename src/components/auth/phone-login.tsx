"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

type Step = "phone" | "otp";

export function PhoneLogin() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const internationalPhone = toInternational(phone);
      await signIn("whatsapp-phone", { phone: internationalPhone });
      setStep("otp");
    } catch (err) {
      setError("שגיאה בשליחת הקוד. נסה שוב.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const internationalPhone = toInternational(phone);
      await signIn("whatsapp-phone", { phone: internationalPhone, code: otp });
    } catch (err) {
      setError("קוד שגוי. נסה שוב.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

        <button
          type="submit"
          disabled={loading || phone.length < 9}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "שולח..." : "שלח קוד בוואטסאפ"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleOtpSubmit} className="w-full max-w-xs space-y-4">
      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
          קוד אימות
        </label>
        <p className="text-xs text-gray-500 mb-2">
          נשלח קוד לוואטסאפ שלך ({formatPhoneDisplay(phone)})
        </p>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="w-full px-4 py-3 text-2xl tracking-[0.5em] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono"
          dir="ltr"
          autoComplete="one-time-code"
          required
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "מאמת..." : "כניסה"}
      </button>

      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setOtp("");
          setError("");
        }}
        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        שלח קוד חדש
      </button>
    </form>
  );
}
