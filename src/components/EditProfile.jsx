import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

const makeNameKey = (first = "", last = "") =>
  `${first}`.trim().toLowerCase() + "|" + `${last}`.trim().toLowerCase();

const makeNameKeyWithMI = (first = "", mi = "", last = "") =>
  `${first}`.trim().toLowerCase() +
  "|" +
  `${mi}`.trim().toLowerCase() +
  "|" +
  `${last}`.trim().toLowerCase();

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
  { value: "BARMM", label: "BARMM: Bangsamoro Autonomous Region in Muslim Mindanao" },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const MAROON = "#7B1113";
const MAROON_DARK = "#5E0D0F";

export default function EditProfile() {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    middleInitial: "",
    lastName: "",
    gender: "",
    region: "",
    email: "",
  });

  const fullName = useMemo(() => {
    const fn = form.firstName.trim();
    const mi = form.middleInitial.trim();
    const ln = form.lastName.trim();
    return `${fn} ${mi ? `${mi}. ` : ""}${ln}`.trim();
  }, [form.firstName, form.middleInitial, form.lastName]);

  const initials = useMemo(() => initialsFromName(fullName), [fullName]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/");
        return;
      }
      setUid(u.uid);

      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setForm({
            firstName: data.firstName || "",
            middleInitial: data.middleInitial || "",
            lastName: data.lastName || "",
            gender: data.gender || "",
            region: data.region || "",
            email: data.email || u.email || "",
          });
          setTwoFactorEnabled(!!data.twoFactorEnabled);
        } else {
          setForm((prev) => ({
            ...prev,
            email: u.email || "",
          }));
          setTwoFactorEnabled(false);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [navigate]);

  const handleChange = (key) => (e) => {
    const value = e.target.value;

    if (key === "middleInitial") {
      setForm((p) => ({ ...p, [key]: value.toUpperCase().slice(0, 1) }));
      return;
    }

    setForm((p) => ({ ...p, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!uid) return;

    setError("");

    const first = form.firstName.trim();
    const last = form.lastName.trim();
    const mi = form.middleInitial.trim().toUpperCase().slice(0, 1);
    const gender = form.gender.trim();
    const region = form.region.trim();

    if (!first || !last) {
      setError("First name and last name are required.");
      return;
    }

    if (!gender) {
      setError("Please select gender.");
      return;
    }

    if (!region) {
      setError("Please select region.");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", uid);

      const nextNameKey = makeNameKey(first, last);
      const nextNameKeyWithMI = makeNameKeyWithMI(first, mi, last);

      await updateDoc(userRef, {
        firstName: first,
        middleInitial: mi,
        lastName: last,
        gender,
        region,
        fullName: `${first} ${mi ? `${mi}. ` : ""}${last}`.trim(),
        nameKey: nextNameKey,
        nameKeyWithMI: nextNameKeyWithMI,
        updatedAt: serverTimestamp(),
      });

      navigate("/user-panel");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    if (!uid) return;

    try {
      setTwoFactorLoading(true);
      setError("");

      const userRef = doc(db, "users", uid);

      await updateDoc(userRef, {
        twoFactorEnabled: !twoFactorEnabled,
        updatedAt: serverTimestamp(),
      });

      setTwoFactorEnabled((prev) => !prev);
    } catch (err) {
      console.error(err);
      setError("Failed to update 2FA setting.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handlePasswordFieldChange = (key) => (e) => {
    setPasswordForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const resetPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordMessage("");
    setChangingPassword(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.email) {
      setPasswordError("No authenticated user found.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    try {
      setChangingPassword(true);

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      setPasswordMessage("Password changed successfully.");

      setTimeout(() => {
        setShowPasswordModal(false);
        resetPasswordModal();
      }, 1200);
    } catch (err) {
      console.error(err);

      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordError("Current password is incorrect.");
      } else if (err.code === "auth/too-many-requests") {
        setPasswordError("Too many attempts. Please try again later.");
      } else {
        setPasswordError("Failed to change password. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 font-sans">
        <p className="text-base font-semibold text-neutral-700">Loading profile…</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen pt-[88px] pb-4 font-sans"
        style={{
          background:
            "radial-gradient(circle at top, rgba(123, 17, 19, 0.05), rgba(123, 17, 19, 0.10)), linear-gradient(180deg, #faf7f7 0%, #f6f2f2 100%)",
        }}
      >
        <div className="mx-auto max-w-[1040px] px-4">
          <div className="overflow-hidden rounded-[22px] border border-[#eadede] bg-white shadow-[0_14px_40px_rgba(123,17,19,0.10)]">
            <div className="px-5 pt-5 pb-3 md:px-6">
              <h1 className="text-2xl font-bold text-neutral-900 font-sans">
                Edit Profile
              </h1>
              <p className="mt-2 text-sm font-medium text-neutral-600 font-sans">
                Update your personal information.
              </p>
              <div
                className="mt-3 h-1 w-20 rounded-full"
                style={{ backgroundColor: MAROON }}
              />

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 font-sans">
                  {error}
                </div>
              )}
            </div>

            <div className="px-5 pb-5 md:px-6">
              <form
                onSubmit={handleSave}
                className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start"
              >
                <aside className="rounded-[18px] border border-[#efe5e5] bg-[#fcf8f8] p-4 shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="grid h-16 w-16 place-items-center rounded-full border-2 bg-white shadow-sm"
                      style={{ borderColor: MAROON }}
                    >
                      <span className="text-2xl font-bold tracking-wide text-neutral-800 font-sans">
                        {initials}
                      </span>
                    </div>

                    <h2 className="mt-3 break-words text-lg font-bold leading-tight text-neutral-900 font-sans">
                      {form.firstName || form.lastName ? fullName : "Your Name"}
                    </h2>
                    <p className="mt-1 break-all text-xs font-medium leading-snug text-neutral-500 font-sans">
                      {form.email || "—"}
                    </p>
                  </div>

                  <div className="my-4 h-px bg-[#eadede]" />

                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-neutral-900 font-sans">
                      Profile Information
                    </h3>

                    <div className="mt-3 space-y-3 text-neutral-700">
                      <div>
                        <p className="text-sm font-medium text-neutral-500 font-sans">
                          Gender
                        </p>
                        <p className="text-base font-bold text-neutral-900 font-sans">
                          {GENDERS.find((g) => g.value === form.gender)?.label || "Not set"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-neutral-500 font-sans">
                          Region
                        </p>
                        <p className="text-base font-bold leading-snug text-neutral-900 font-sans">
                          {REGIONS.find((r) => r.value === form.region)?.label || "Not set"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        resetPasswordModal();
                        setShowPasswordModal(true);
                      }}
                      className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition font-sans"
                      style={{
                        background: `linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DARK} 100%)`,
                      }}
                    >
                      Change Password
                    </button>
                  </div>
                </aside>

                <div className="space-y-4">
                  <section className="overflow-hidden rounded-[18px] border border-[#eadede] bg-white shadow-sm">
                    <div
                      className="px-4 py-3 text-white"
                      style={{
                        background: `linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DARK} 100%)`,
                      }}
                    >
                      <h3 className="text-lg font-bold tracking-tight text-white font-sans">
                        Personal Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                          First Name
                        </label>
                        <input
                          value={form.firstName}
                          onChange={handleChange("firstName")}
                          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 font-sans focus:border-transparent focus:outline-none focus:ring-2"
                          style={{ "--tw-ring-color": `${MAROON}33` }}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                          Middle Initial
                        </label>
                        <input
                          value={form.middleInitial}
                          onChange={handleChange("middleInitial")}
                          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 font-sans focus:border-transparent focus:outline-none focus:ring-2"
                          style={{ "--tw-ring-color": `${MAROON}33` }}
                          maxLength={1}
                          placeholder="Enter initial"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                          Last Name
                        </label>
                        <input
                          value={form.lastName}
                          onChange={handleChange("lastName")}
                          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 font-sans focus:border-transparent focus:outline-none focus:ring-2"
                          style={{ "--tw-ring-color": `${MAROON}33` }}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                          Gender
                        </label>
                        <select
                          value={form.gender}
                          onChange={handleChange("gender")}
                          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 font-sans focus:border-transparent focus:outline-none focus:ring-2"
                          style={{ "--tw-ring-color": `${MAROON}33` }}
                          required
                        >
                          <option value="">Select gender</option>
                          {GENDERS.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                          Region
                        </label>
                        <select
                          value={form.region}
                          onChange={handleChange("region")}
                          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 font-sans focus:border-transparent focus:outline-none focus:ring-2"
                          style={{ "--tw-ring-color": `${MAROON}33` }}
                          required
                        >
                          <option value="">Select region</option>
                          {REGIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <section className="overflow-hidden rounded-[18px] border border-[#eadede] bg-white shadow-sm">
                      <div className="border-b border-[#f0e5d7] bg-[#f8f2ea] px-4 py-3">
                        <h3 className="text-lg font-bold tracking-tight text-neutral-900 font-sans">
                          Contact Information
                        </h3>
                      </div>

                      <div className="p-4">
                        <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                          Email Address
                        </label>
                        <div className="mt-1.5 rounded-xl border border-[#eadede] bg-[#fcf8f8] px-3 py-2.5">
                          <div className="flex flex-col gap-2">
                            <span className="break-all text-sm font-medium text-neutral-700 font-sans">
                              {form.email || "—"}
                            </span>
                            <span className="inline-flex w-fit items-center justify-center rounded-full bg-[#efe6c8] px-2.5 py-1 text-xs font-bold text-[#6e5610] font-sans">
                              Verified
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-neutral-500 font-sans">
                          Email cannot be changed. Please contact support if needed.
                        </p>
                      </div>
                    </section>

                    <section className="rounded-[18px] border border-[#eadede] bg-[#fffdf9] p-4 shadow-sm">
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold tracking-tight text-neutral-900 font-sans">
                            Account Security
                          </h3>
                          <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600 font-sans">
                            Add an extra layer of security to your account.
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold font-sans"
                            style={{
                              backgroundColor: twoFactorEnabled ? "#e8f7ed" : "#fdeaea",
                              color: twoFactorEnabled ? "#166534" : MAROON,
                            }}
                          >
                            {twoFactorEnabled ? "Enabled" : "Not Enabled"}
                          </span>

                          <button
                            type="button"
                            onClick={handleToggleTwoFactor}
                            disabled={twoFactorLoading}
                            className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-[#fff6f6] font-sans disabled:opacity-60"
                            style={{ borderColor: "#e9cfcf", color: MAROON }}
                          >
                            {twoFactorLoading
                              ? "Updating..."
                              : twoFactorEnabled
                              ? "Disable 2FA"
                              : "Enable 2FA"}
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("/user-panel")}
                      className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700 shadow-sm hover:bg-neutral-50 font-sans"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition disabled:opacity-60 font-sans"
                      style={{
                        background: `linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DARK} 100%)`,
                      }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[22px] border border-[#eadede] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 font-sans">
                Change Password
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  resetPasswordModal();
                }}
                className="rounded-full px-3 py-1 text-sm font-bold text-neutral-500 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-sm font-medium text-neutral-600 font-sans">
              Enter your current password and choose a new one.
            </p>

            {passwordError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 font-sans">
                {passwordError}
              </div>
            )}

            {passwordMessage && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700 font-sans">
                {passwordMessage}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordFieldChange("currentPassword")}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 font-sans focus:border-transparent focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": `${MAROON}33` }}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordFieldChange("newPassword")}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 font-sans focus:border-transparent focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": `${MAROON}33` }}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.03em] text-neutral-700 font-sans">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFieldChange("confirmPassword")}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-800 font-sans focus:border-transparent focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": `${MAROON}33` }}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    resetPasswordModal();
                  }}
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 shadow-sm hover:bg-neutral-50 font-sans"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition disabled:opacity-60 font-sans"
                  style={{
                    background: `linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DARK} 100%)`,
                  }}
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}