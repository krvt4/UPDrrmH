import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase/firebase";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

const REGIONS = [
  { value: "NCR", label: "NCR: National Capital Region (Metro Manila)" },
  { value: "CAR", label: "CAR: Cordillera Administrative Region" },
  { value: "Region I", label: "Region I: Ilocos Region" },
  { value: "Region II", label: "Region II: Cagayan Valley" },
  { value: "Region III", label: "Region III: Central Luzon" },
  { value: "Region IV-A", label: "Region IV-A: CALABARZON" },
  { value: "Region IV-B", label: "Region IV-B: MIMAROPA Region" },
  { value: "Region V", label: "Region V: Bicol Region" },
  { value: "Region VI", label: "Region VI: Western Visayas" },
  { value: "Region VII", label: "Region VII: Central Visayas" },
  { value: "Region VIII", label: "Region VIII: Eastern Visayas" },
  { value: "NIR", label: "NIR: Negros Island Region" },
  { value: "Region IX", label: "Region IX: Zamboanga Peninsula" },
  { value: "Region X", label: "Region X: Northern Mindanao" },
  { value: "Region XI", label: "Region XI: Davao Region" },
  { value: "Region XII", label: "Region XII: SOCCSKSARGEN" },
  { value: "Region XIII", label: "Region XIII: Caraga" },
  {
    value: "BARMM",
    label: "BARMM: Bangsamoro Autonomous Region in Muslim Mindanao",
  },
];

const ROLES = [
  { value: "visitor", label: "Visitor" },
  { value: "participant", label: "Participant" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const makeNameKey = (first = "", last = "") =>
  `${first}`.trim().toLowerCase() + "|" + `${last}`.trim().toLowerCase();

const makeNameKeyWithMI = (first = "", mi = "", last = "") =>
  `${first}`.trim().toLowerCase() +
  "|" +
  `${mi}`.trim().toLowerCase() +
  "|" +
  `${last}`.trim().toLowerCase();

const API_BASE = "http://localhost:5000";

const LoginRegisterForm = ({
  closeForm,
  setUser,
  alertMessage,
  onOtpRequired,
  setAuthTransitioning,
}) => {
  const [isLogin, setIsLogin] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");

  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [role, setRole] = useState("visitor");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(alertMessage || "");
  const [message, setMessage] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (alertMessage) setError(alertMessage);
  }, [alertMessage]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const buildFullName = () => {
    const fn = firstName.trim();
    const mi = middleInitial.trim();
    const ln = lastName.trim();
    return `${fn} ${mi ? `${mi}. ` : ""}${ln}`.trim();
  };

  const resetForm = ({ keepMessage = false } = {}) => {
    setFirstName("");
    setMiddleInitial("");
    setLastName("");
    setGender("");
    setAddress("");
    setRegion("");
    setRole("visitor");

    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPrivacyAccepted(false);

    setShowPassword(false);
    setShowConfirmPassword(false);

    setError("");
    if (!keepMessage) setMessage("");
    setForgotPasswordLoading(false);
  };

  const clearOtpSessionFlags = () => {
    sessionStorage.removeItem("otpPending");
    sessionStorage.removeItem("otpVerified");
    sessionStorage.removeItem("postOtpRedirect");
    sessionStorage.removeItem("otpPurpose");
  };

  const sendLoginCode = async ({ uid, email, token }) => {
    const res = await fetch(`${API_BASE}/api/send-login-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid, email, token }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Failed to send login code.");
    }

    return data;
  };

  const sendRegistrationOtp = async ({ uid, email, token }) => {
    const res = await fetch(`${API_BASE}/api/send-registration-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid, email, token }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Failed to send registration OTP.");
    }

    return data;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!isLogin) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter your first name and last name.");
        return;
      }
      if (!gender) {
        setError("Please select gender.");
        return;
      }
      if (!address.trim()) {
        setError("Please enter your address.");
        return;
      }
      if (!region) {
        setError("Please select your region.");
        return;
      }
      if (!role) {
        setError("Please select your role.");
        return;
      }
      if (!ROLES.some((r) => r.value === role)) {
        setError("Invalid role selected.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!privacyAccepted) {
        setError("Please accept the privacy policy to continue.");
        return;
      }
    }

    try {
      setSubmitting(true);

      if (isLogin) {
        clearOtpSessionFlags();
        setAuthTransitioning?.(true);

        const userCredential = await signInWithEmailAndPassword(
          auth,
          trimmedEmail,
          password
        );

        const fbUser = userCredential.user;

        const userRef = doc(db, "users", fbUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await signOut(auth);
          setAuthTransitioning?.(false);
          setError("User data not found.");
          return;
        }

        const userData = userSnap.data();
        const isAdmin = String(userData?.role || "").toLowerCase() === "admin";

        const needsRegistrationOtp =
          userData?.registrationOtpVerified === false ||
          (userData?.registrationOtpVerified == null &&
            userData?.status !== "approved");

        if (needsRegistrationOtp) {
          await signOut(auth);
          setAuthTransitioning?.(false);
          setError("Please verify the OTP sent to your email before logging in.");
          return;
        }

        if (!isAdmin && userData.status !== "approved") {
          await signOut(auth);
          setAuthTransitioning?.(false);
          setError("Your account is pending approval by admin.");
          return;
        }

        if (userData.twoFactorEnabled) {
          const redirectPath = "/";
          const token = await fbUser.getIdToken();

          await sendLoginCode({
            uid: fbUser.uid,
            email: fbUser.email,
            token,
          });

          sessionStorage.setItem("otpPending", "true");
          sessionStorage.removeItem("otpVerified");
          sessionStorage.setItem("postOtpRedirect", redirectPath);
          sessionStorage.setItem("otpPurpose", "login");

          setUser?.(fbUser);

          onOtpRequired?.({
            uid: fbUser.uid,
            email: fbUser.email,
            redirectPath,
            purpose: "login",
          });

          return;
        }

        sessionStorage.removeItem("otpPending");
        sessionStorage.setItem("otpVerified", "true");
        sessionStorage.setItem("postOtpRedirect", "/");
        sessionStorage.setItem("otpPurpose", "login");

        setUser?.(fbUser);
        setAuthTransitioning?.(false);
        closeForm?.();

        navigate("/", { replace: true });
        return;
      }

      let newUser = null;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password
        );

        newUser = userCredential.user;

        const mi = middleInitial.trim().toUpperCase().slice(0, 1);
        const fullName = buildFullName();
        const first = firstName.trim();
        const last = lastName.trim();

        const selectedRole = role;

        await setDoc(
          doc(db, "users", newUser.uid),
          {
            email: newUser.email,
            role: selectedRole,
            firstName: first,
            middleInitial: mi,
            lastName: last,
            fullName,
            gender,
            address: address.trim(),
            region,
            nameKey: makeNameKey(first, last),
            nameKeyWithMI: makeNameKeyWithMI(first, mi, last),
            twoFactorEnabled: false,
            registrationOtpVerified: false,
            status: "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        const token = await newUser.getIdToken();

        await sendRegistrationOtp({
          uid: newUser.uid,
          email: newUser.email,
          token,
        });

        sessionStorage.setItem("otpPending", "true");
        sessionStorage.removeItem("otpVerified");
        sessionStorage.setItem("otpPurpose", "registration");
        sessionStorage.setItem("postOtpRedirect", "/");

        setUser?.(newUser);

        setMessage(
          "✅ Account created. Please enter the OTP sent to your Gmail. After that, wait for admin approval."
        );

        onOtpRequired?.({
          uid: newUser.uid,
          email: newUser.email,
          redirectPath: "/",
          purpose: "registration",
        });

        return;
      } catch (regErr) {
        console.error("REGISTRATION FLOW ERROR:", regErr);

        if (newUser?.uid) {
          try {
            await deleteDoc(doc(db, "users", newUser.uid));
          } catch (cleanupErr) {
            console.error("FIRESTORE CLEANUP ERROR:", cleanupErr);
          }

          try {
            await deleteUser(newUser);
          } catch (cleanupErr) {
            console.error("AUTH CLEANUP ERROR:", cleanupErr);
            try {
              await signOut(auth);
            } catch (signoutErr) {
              console.error("SIGNOUT CLEANUP ERROR:", signoutErr);
            }
          }
        }

        throw regErr;
      }
    } catch (err) {
      console.error("LOGIN/REGISTER ERROR:", err);
      setAuthTransitioning?.(false);

      switch (err?.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled.");
          break;
        case "auth/user-not-found":
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        case "auth/wrong-password":
          setError("Invalid email or password.");
          break;
        case "auth/email-already-in-use":
          setError("This email is already registered.");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;
        default:
          setError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (forgotPasswordLoading) return;

    setError("");
    setMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email first, then click Forgot Password.");
      return;
    }

    try {
      setForgotPasswordLoading(true);

      await sendPasswordResetEmail(auth, trimmedEmail);

      setMessage(
        "Password reset email sent successfully. Please check your inbox and spam folder."
      );
    } catch (err) {
      console.error("FORGOT PASSWORD ERROR:", err);

      switch (err?.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/too-many-requests":
          setError("Too many requests. Please try again later.");
          break;
        default:
          setError(err?.message || "Failed to send password reset email.");
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleClose = () => {
    setAuthTransitioning?.(false);
    closeForm?.();
  };

  const labelCls = "block text-white/90 text-sm mb-1";
  const inputCls =
    "w-full h-11 px-3 rounded-lg border border-white/25 bg-white/10 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-yellow-300/60 focus:border-white/40";
  const selectCls =
    "w-full h-11 px-3 rounded-lg border border-white/25 bg-white/10 text-white outline-none focus:ring-2 focus:ring-yellow-300/60 focus:border-white/40";
  const textareaCls =
    "w-full px-3 py-2 rounded-lg border border-white/25 bg-white/10 text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-yellow-300/60 focus:border-white/40";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/15">
          <div>
            <h2 className="text-xl font-semibold text-white leading-none">
              {isLogin ? "Login" : "Register"}
            </h2>
            <p className="text-xs text-white/70 mt-1">
              {isLogin
                ? "Sign in to continue."
                : "Create an account (OTP confirmation and admin approval required)."}
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            onClick={handleClose}
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

        <div
          className={`px-5 pb-5 pt-4 ${
            !isLogin ? "max-h-[72vh] overflow-y-auto custom-scrollbar pr-2" : ""
          }`}
        >
          <form onSubmit={handleAuth} className="space-y-3">
            {!isLogin && (
              <>
                <div>
                  <label className={labelCls}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Middle Initial</label>
                  <input
                    type="text"
                    value={middleInitial}
                    onChange={(e) =>
                      setMiddleInitial(e.target.value.toUpperCase().slice(0, 1))
                    }
                    className={inputCls}
                    maxLength={1}
                  />
                </div>

                <div>
                  <label className={labelCls}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={selectCls}
                    required
                  >
                    <option value="" className="text-black">
                      Select gender
                    </option>
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value} className="text-black">
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={textareaCls}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={selectCls}
                    required
                  >
                    <option value="" className="text-black">
                      Select region
                    </option>
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value} className="text-black">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={selectCls}
                    required
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value} className="text-black">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="privacyCheckbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <label htmlFor="privacyCheckbox" className="text-white/90 text-sm">
                    I agree to the{" "}
                    <span
                      className="text-yellow-200 hover:text-yellow-100 cursor-pointer underline"
                      onClick={() => setShowPrivacyPopup(true)}
                    >
                      Privacy Policy
                    </span>
                  </label>
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Email</label>
              <div className="flex gap-2 items-center h-11 px-3 rounded-lg border border-white/25 bg-white/10 text-white focus-within:ring-2 focus-within:ring-yellow-300/60">
                <User size={18} className="opacity-80" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-white/60"
                  placeholder="Enter email"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Password</label>
              <div className="flex gap-2 items-center h-11 px-3 rounded-lg border border-white/25 bg-white/10 text-white focus-within:ring-2 focus-within:ring-yellow-300/60">
                <Lock size={18} className="opacity-80" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-white/60"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-white/90 hover:text-white"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isLogin && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading || !email.trim()}
                    className="text-yellow-200 hover:text-yellow-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? "Sending reset email..." : "Forgot Password?"}
                  </button>
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className={labelCls}>Confirm Password</label>
                <div className="flex gap-2 items-center h-11 px-3 rounded-lg border border-white/25 bg-white/10 text-white focus-within:ring-2 focus-within:ring-yellow-300/60">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent outline-none placeholder:text-white/60"
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="text-white/90 hover:text-white"
                    aria-label="Toggle confirm password"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-lg bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-900 font-semibold transition"
            >
              {submitting ? "Please wait..." : isLogin ? "Login" : "Register"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin((v) => !v);
                resetForm();
              }}
              className="text-white/80 hover:text-white text-sm underline underline-offset-4"
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>

      {showPrivacyPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/15">
              <h3 className="text-lg font-semibold text-white">
                Privacy Terms and Conditions
              </h3>
              <button
                onClick={() => setShowPrivacyPopup(false)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                type="button"
                aria-label="Close privacy"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 text-white/90 space-y-3 text-sm">
              <p>
                This website complies with the Philippine Data Privacy Act of 2012
                (RA 10173). We are committed to protecting your personal data and
                ensuring your rights as a data subject.
              </p>
              <p>
                By using this website, you consent to the collection and processing
                of your personal data as described in this policy.
              </p>
              <p>
                To know more about your privacy rights, visit:{" "}
                <a
                  href="https://privacy.gov.ph/data-privacy-act/#w11"
                  className="text-yellow-200 hover:text-yellow-100 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  RA 10173 Data Privacy Act of 2012
                </a>
              </p>
            </div>

            <div className="px-5 pb-5 flex justify-end">
              <button
                onClick={() => setShowPrivacyPopup(false)}
                className="h-11 px-4 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-semibold transition"
                type="button"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginRegisterForm;