import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";

const RESEND_COOLDOWN = 30;
const API_BASE = "http://localhost:5000";

export default function VerifyOTP() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const otpPending = sessionStorage.getItem("otpPending") === "true";
    const otpVerified = sessionStorage.getItem("otpVerified") === "true";

    if (!auth.currentUser) {
      navigate("/", { replace: true });
      return;
    }

    if (!otpPending && !otpVerified) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const verifyLoginCode = async ({ uid, code, token }) => {
    const res = await fetch(`${API_BASE}/api/verify-login-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid, code, token }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Failed to verify code.");
    }

    return data;
  };

  const resendLoginCode = async ({ uid, email, token }) => {
    const res = await fetch(`${API_BASE}/api/send-login-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid, email, token }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Failed to resend code.");
    }

    return data;
  };

  const handleVerify = async () => {
    setError("");
    setMessage("");

    const user = auth.currentUser;

    if (!user) {
      setError("User not found. Please log in again.");
      navigate("/", { replace: true });
      return;
    }

    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("OTP must be a 6-digit number.");
      return;
    }

    try {
      setVerifying(true);

      const token = await user.getIdToken(true);

      await verifyLoginCode({
        uid: user.uid,
        code: otp.trim(),
        token,
      });

      sessionStorage.removeItem("otpPending");
      sessionStorage.setItem("otpVerified", "true");

      const redirectPath = sessionStorage.getItem("postOtpRedirect") || "/user-panel";

      setMessage("OTP verified successfully.");

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 800);
    } catch (err) {
      console.error("VERIFY OTP ERROR:", err);
      setError(err?.message || "Failed to verify OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");

    const user = auth.currentUser;

    if (!user || !user.email) {
      setError("User not found. Please log in again.");
      navigate("/", { replace: true });
      return;
    }

    if (cooldown > 0) return;

    try {
      setResending(true);

      const token = await user.getIdToken(true);

      await resendLoginCode({
        uid: user.uid,
        email: user.email,
        token,
      });

      sessionStorage.setItem("otpPending", "true");
      sessionStorage.removeItem("otpVerified");

      setMessage("A new OTP has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      console.error("RESEND OTP ERROR:", err);
      setError(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-neutral-900">Verify OTP</h2>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
          Enter the 6-digit code sent to your email to complete login.
        </p>

        {(error || message) && (
          <div className="mt-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {message}
              </div>
            )}
          </div>
        )}

        <div className="mt-5">
          <label className="block text-sm font-semibold text-neutral-700 mb-1">
            One-Time Password
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit code"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying}
          className="mt-5 w-full rounded-xl bg-red-800 px-4 py-3 text-white font-semibold shadow hover:opacity-95 disabled:opacity-60"
        >
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-sm font-semibold text-red-800 disabled:text-neutral-400"
          >
            {resending
              ? "Sending..."
              : cooldown > 0
              ? `Resend OTP in ${cooldown}s`
              : "Resend OTP"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="text-sm text-neutral-500 hover:text-neutral-700 underline underline-offset-4"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}