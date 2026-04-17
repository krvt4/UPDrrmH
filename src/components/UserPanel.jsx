import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  Globe,
  LogOut,
  Users,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

const makeNameKey = (first = "", last = "") =>
  `${first}`.trim().toLowerCase() + "|" + `${last}`.trim().toLowerCase();

function formatCap(v) {
  if (!v) return "—";
  const s = String(v);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SidebarField({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-semibold tracking-widest text-amber-200">
          {label}
        </span>
      </div>
      <div className="text-sm text-white pl-7">{value}</div>
    </div>
  );
}

export default function UserPanel() {
  const navigate = useNavigate();

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);

  const [userInfo, setUserInfo] = useState({
    fullName: "",
    email: "",
    role: "visitor",
    gender: "—",
    region: "—",
    nameKey: "",
  });

  const [rows, setRows] = useState([]);

  const initials = useMemo(
    () => initialsFromName(userInfo.fullName),
    [userInfo.fullName]
  );

  const recordsUnsubRef = useRef(null);
  const currentNameKeyRef = useRef("");

  useEffect(() => {
    let userDocUnsub = null;

    const authUnsub = onAuthStateChanged(auth, (u) => {
      if (userDocUnsub) userDocUnsub();
      userDocUnsub = null;

      if (recordsUnsubRef.current) {
        recordsUnsubRef.current();
        recordsUnsubRef.current = null;
      }

      setRows([]);
      setLoadingRows(true);

      if (!u) {
        setLoadingUser(false);
        navigate("/");
        return;
      }

      setLoadingUser(true);

      const userRef = doc(db, "users", u.uid);

      userDocUnsub = onSnapshot(
        userRef,
        (snap) => {
          if (!snap.exists()) {
            setUserInfo({
              fullName: "User",
              email: u.email || "",
              role: "visitor",
              gender: "—",
              region: "—",
              nameKey: "",
            });

            setRows([]);
            setLoadingRows(false);
            setLoadingUser(false);
            return;
          }

          const data = snap.data();

          if (data.role === "visitor") {
            navigate("/", { replace: true });
            return;
          }

          const fullName =
            data.fullName ||
            `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
            "User";

          const email = data.email || u.email || "";
          const role = data.role || "visitor";
          const gender = data.gender || "—";
          const region = data.region || "—";

          const nameKey =
            data.nameKey ||
            makeNameKey(data.firstName || "", data.lastName || "");

          setUserInfo({
            fullName,
            email,
            role,
            gender,
            region,
            nameKey,
          });

          const prevNk = currentNameKeyRef.current;

          if (nameKey !== prevNk) {
            currentNameKeyRef.current = nameKey;

            if (recordsUnsubRef.current) {
              recordsUnsubRef.current();
              recordsUnsubRef.current = null;
            }

            if (nameKey && nameKey !== "|") {
              setLoadingRows(true);

              const qy = query(
                collection(db, "trainingRecords"),
                where("nameKey", "==", nameKey)
              );

              recordsUnsubRef.current = onSnapshot(
                qy,
                (qs) => {
                  const records = qs.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                  }));
                  setRows(records);
                  setLoadingRows(false);
                },
                (err) => {
                  console.error("Realtime records error:", err);
                  setRows([]);
                  setLoadingRows(false);
                }
              );
            } else {
              setRows([]);
              setLoadingRows(false);
            }
          }

          setLoadingUser(false);
        },
        (err) => {
          console.error("User doc realtime error:", err);

          setUserInfo({
            fullName: "User",
            email: u.email || "",
            role: "visitor",
            gender: "—",
            region: "—",
            nameKey: "",
          });

          setRows([]);
          setLoadingRows(false);
          setLoadingUser(false);
        }
      );
    });

    return () => {
      if (userDocUnsub) userDocUnsub();
      if (recordsUnsubRef.current) recordsUnsubRef.current();
      authUnsub();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("otpPending");
      sessionStorage.removeItem("otpVerified");
      sessionStorage.removeItem("postOtpRedirect");
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-neutral-50 grid place-items-center">
        <p className="text-neutral-700 font-semibold">Loading user profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex min-h-screen">
        <aside className="w-[320px] shrink-0 bg-gradient-to-b from-[#7f1212] via-[#6d0f0f] to-[#4a0707] text-white flex flex-col min-h-screen">
          <div className="pt-20 flex-1 overflow-y-auto">
            <div className="px-8 pt-10 pb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 rounded-full border-4 border-amber-400 bg-[#5b0c0c] grid place-items-center shadow-lg">
                  <span className="text-2xl font-bold">{initials}</span>
                </div>

                <h2 className="text-lg font-semibold text-center">
                  {userInfo.fullName || "User"}
                </h2>

                <button
                  onClick={() => navigate("/edit-profile")}
                  className="mt-1 w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#4a0707] hover:bg-amber-300 transition border border-amber-300 inline-flex items-center justify-center gap-2"
                >
                  <Edit3 size={18} />
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="mx-8 border-t border-white/20" />

            <div className="px-8 py-6 space-y-4">
              <SidebarField
                icon={<ShieldCheck size={18} className="text-amber-300" />}
                label="ROLE"
                value={
                  <span className="inline-flex items-center rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase text-[#5b0c0c]">
                    {userInfo.role}
                  </span>
                }
              />

              <SidebarField
                icon={<Mail size={18} className="text-amber-300" />}
                label="EMAIL"
                value={<span className="break-all">{userInfo.email}</span>}
              />

              <SidebarField
                icon={<Users size={18} className="text-amber-300" />}
                label="GENDER"
                value={formatCap(userInfo.gender)}
              />

              <SidebarField
                icon={<Globe size={18} className="text-amber-300" />}
                label="REGION"
                value={userInfo.region}
              />
            </div>
          </div>

          <div className="px-8 py-6 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#8b1a1a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a32020] transition"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-white pt-20">
          <div className="px-6 md:px-10 py-10">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
              <p className="mt-1 text-neutral-600">
                View and manage your training records
              </p>
            </header>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Training Records
              </h2>

              <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full text-sm">
                    <thead className="bg-neutral-50">
                      <tr className="text-left text-neutral-700">
                        <th className="px-5 py-4 font-semibold">Serial Number</th>
                        <th className="px-5 py-4 font-semibold">Training Date</th>
                        <th className="px-5 py-4 font-semibold">Last Name</th>
                        <th className="px-5 py-4 font-semibold">First Name</th>
                        <th className="px-5 py-4 font-semibold">Middle Initial</th>
                        <th className="px-5 py-4 font-semibold">Agency</th>
                        <th className="px-5 py-4 font-semibold">Department</th>
                        <th className="px-5 py-4 font-semibold">Position</th>
                        <th className="px-5 py-4 font-semibold">Pre-test Score</th>
                        <th className="px-5 py-4 font-semibold">Post-test Score</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loadingRows ? (
                        <tr>
                          <td colSpan={10} className="px-5 py-10 text-neutral-600">
                            Loading records...
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-5 py-10 text-neutral-500">
                            No training records found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((r, idx) => (
                          <tr
                            key={r.id}
                            className={
                              "border-t border-neutral-200 " +
                              (idx % 2 === 0 ? "bg-white" : "bg-neutral-50/40")
                            }
                          >
                            <td className="px-5 py-5 font-semibold text-neutral-900">
                              {r.serialNumber || "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.trainingDate || "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.lastName || "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.firstName || "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.middleInitial || "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.agency || "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.department || "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.position || "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.preTestScore ?? "—"}
                            </td>
                            <td className="px-5 py-5 text-neutral-700">
                              {r.postTestScore ?? "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}