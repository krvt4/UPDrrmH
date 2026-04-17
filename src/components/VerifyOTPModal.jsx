import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";

const RESEND_COOLDOWN = 30;
const API_BASE = "http://localhost:5000";

export default function VerifyOTPModal({ otpUser, onClose, onVerified, onCancel }) {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const purpose = otpUser?.purpose || sessionStorage.getItem("otpPurpose") || "login";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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

  const clearOtpSessionFlags = () => {
    sessionStorage.removeItem("otpPending");
    sessionStorage.removeItem("otpVerified");
    sessionStorage.removeItem("postOtpRedirect");
    sessionStorage.removeItem("otpPurpose");
  };

  const handleCancel = async () => {
    try {
      clearOtpSessionFlags();
      await signOut(auth);
    } catch (err) {
      console.error("OTP CANCEL ERROR:", err);
    } finally {
      onCancel?.();
      onClose?.();
      navigate("/", { replace: true });
    }
  };

  const verifyOtp = async ({ uid, code, token, purpose }) => {
    const endpoint =
      purpose === "registration"
        ? "/api/verify-registration-otp"
        : "/api/verify-login-code";

    const res = await fetch(`${API_BASE}${endpoint}`, {
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

  const resendOtp = async ({ uid, email, token, purpose }) => {
    const endpoint =
      purpose === "registration"
        ? "/api/send-registration-otp"
        : "/api/send-login-code";

    const res = await fetch(`${API_BASE}${endpoint}`, {
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

    if (!user || !otpUser?.uid) {
      setError("User session not found. Please log in again.");
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

      await verifyOtp({
        uid: otpUser.uid,
        code: otp.trim(),
        token,
        purpose,
      });

      sessionStorage.removeItem("otpPending");
      sessionStorage.setItem("otpVerified", "true");

      if (purpose === "registration") {
        setMessage("OTP verified successfully. Please wait for admin approval.");

        setTimeout(async () => {
          try {
            await signOut(auth);
          } catch (err) {
            console.error("SIGNOUT AFTER REGISTRATION OTP ERROR:", err);
          }

          clearOtpSessionFlags();
          onVerified?.();
          onClose?.();
          navigate("/", { replace: true });
        }, 900);

        return;
      }

      const redirectPath =
        otpUser.redirectPath ||
        sessionStorage.getItem("postOtpRedirect") ||
        "/";

      setMessage("OTP verified successfully.");

      setTimeout(() => {
        onVerified?.();
        onClose?.();
        navigate(redirectPath, { replace: true });
      }, 700);
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

    if (!user || !user.email || !otpUser?.uid) {
      setError("User session not found. Please log in again.");
      return;
    }

    if (cooldown > 0) return;

    try {
      setResending(true);

      const token = await user.getIdToken(true);

      await resendOtp({
        uid: otpUser.uid,
        email: otpUser.email || user.email,
        token,
        purpose,
      });

      sessionStorage.setItem("otpPending", "true");
      sessionStorage.removeItem("otpVerified");
      sessionStorage.setItem("otpPurpose", purpose);

      setMessage("A new OTP has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      console.error("RESEND OTP ERROR:", err);
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/15">
          <div>
            <h2 className="text-xl font-semibold text-white leading-none">
              Verify OTP
            </h2>
            <p className="text-xs text-white/70 mt-1">
              Enter the 6-digit code sent to your email.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            onClick={handleCancel}
            type="button"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {(error || message) && (
          <div className="px-5 pt-4">
            {error ? (
              <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-200 text-sm">
                {error}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-200 text-sm">
                {message}
              </div>
            )}
          </div>
        )}

        <div className="px-5 pb-5 pt-4">
          <div>
            <label className="block text-white/90 text-sm mb-1">
              One-Time Password
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className="w-full h-11 px-3 rounded-lg border border-white/25 bg-white/10 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-yellow-300/60 focus:border-white/40"
            />
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="mt-5 w-full h-11 rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-900 font-semibold transition"
          >
            {verifying ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-yellow-200 hover:text-yellow-100 text-sm disabled:opacity-60"
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                ? `Resend OTP in ${cooldown}s`
                : "Resend OTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}