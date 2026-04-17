import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../../firebase/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Search } from "lucide-react";
import TrainingRecordsModal from "./TrainingRecordsModal.jsx";

const API_BASE = "http://localhost:5000";

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

export default function GmailAccounts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const [csvMode, setCsvMode] = useState(false);
  const [selectedCsvIds, setSelectedCsvIds] = useState(new Set());

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [showAdminCautionModal, setShowAdminCautionModal] = useState(false);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);

  const [currentUserRole, setCurrentUserRole] = useState("");
  const isStaff = currentUserRole === "staff";

  async function getTokenOrThrow() {
    const u = auth.currentUser;
    if (!u) throw new Error("Not logged in.");
    return await u.getIdToken();
  }

  useEffect(() => {
    const loadCurrentUserRole = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setCurrentUserRole("");
          return;
        }

        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (!snap.exists()) {
          setCurrentUserRole("");
          return;
        }

        setCurrentUserRole(String(snap.data()?.role || "").toLowerCase());
      } catch (e) {
        console.error("Failed to load current user role:", e);
        setCurrentUserRole("");
      }
    };

    loadCurrentUserRole();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");

    const baseRef = collection(db, "users");
    const qRef =
      filter === "all"
        ? query(baseRef)
        : query(baseRef, where("status", "==", filter));

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRows(data);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Failed to load users.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [filter]);

  useEffect(() => {
    setSelectedCsvIds((prev) => {
      const next = new Set(prev);
      const all = new Set(rows.map((u) => u.id));
      for (const id of next) {
        if (!all.has(id)) next.delete(id);
      }
      return next;
    });
  }, [rows]);

  const StatusBadge = ({ status }) => {
    const s = (status || "pending").toLowerCase();
    const cls =
      s === "approved"
        ? "bg-green-100 text-green-800"
        : s === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800";

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>
        {s}
      </span>
    );
  };

  const filteredAndSortedRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = rows.filter((u) => {
      const matchesSearch = term
        ? (u.lastName || "").toLowerCase().includes(term) ||
          (u.firstName || "").toLowerCase().includes(term) ||
          (u.email || "").toLowerCase().includes(term)
        : true;

      const role = String(u.role || "").toLowerCase();
      const matchesRole = roleFilter === "all" ? true : role === roleFilter;

      const region = String(u.region || "").trim();
      const matchesRegion = regionFilter === "all" ? true : region === regionFilter;

      return matchesSearch && matchesRole && matchesRegion;
    });

    return [...filtered].sort((a, b) => {
      const la = (a.lastName || "").toLowerCase();
      const lb = (b.lastName || "").toLowerCase();
      return la.localeCompare(lb);
    });
  }, [rows, searchTerm, roleFilter, regionFilter]);

  const setUserStatus = async (uid, status) => {
    setError("");
    setBusy(true);
    try {
      const token = await getTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/admin/update-user-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, uid, status }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 160));
      }

      if (!res.ok) throw new Error(data?.error || "Failed.");
    } catch (e) {
      setError(e?.message || "Failed to update user status.");
    } finally {
      setBusy(false);
    }
  };

  const setUserRole = async (uid, role) => {
    setError("");
    setBusy(true);
    try {
      const token = await getTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/admin/update-user-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, uid, role }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 160));
      }

      if (!res.ok) throw new Error(data?.error || "Failed.");
    } catch (e) {
      setError(e?.message || "Failed to update user role.");
    } finally {
      setBusy(false);
    }
  };

  const approveUser = (uid) => setUserStatus(uid, "approved");
  const rejectUser = (uid) => setUserStatus(uid, "rejected");

  const openAuditLog = async () => {
    setShowAuditModal(true);
    setAuditError("");
    setAuditLoading(true);

    try {
      const token = await getTokenOrThrow();
      const res = await fetch(
        `${API_BASE}/api/admin/audit-log?limit=120&token=${encodeURIComponent(token)}`
      );

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 160));
      }

      if (!res.ok) throw new Error(json?.error || "Failed to load audit logs.");

      const logs = Array.isArray(json.logs) ? json.logs : [];
      setAuditLogs(logs);
    } catch (e) {
      setAuditError(e?.message || "Failed to load audit logs.");
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const closeAllRemoveModals = () => {
    setShowRemoveModal(false);
    setShowRemoveConfirmModal(false);
    setShowAdminCautionModal(false);
  };

  const normalizeRole = (r) => String(r || "user").trim().toLowerCase();
  const normalizeStatus = (s) => String(s || "").trim().toLowerCase();

  const getRoleLabel = (user) => {
    const r = normalizeRole(user?.role);
    if (r === "admin") return "admin";
    if (r === "participant") return "participant";
    if (r === "visitor") return "visitor";
    if (r === "staff") return "staff";
    return r || "user";
  };

  const isApprovedAdmin = (user) => {
    const r = normalizeRole(user?.role);
    const s = normalizeStatus(user?.status);
    return r === "admin" && s === "approved";
  };

  const confirmRemoveSelected = async () => {
    if (isStaff) return;

    setError("");
    setBusy(true);
    try {
      const token = await getTokenOrThrow();
      const uids = Array.from(selectedIds);

      const res = await fetch(`${API_BASE}/api/admin/remove-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, uids }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 160));
      }

      if (!res.ok) throw new Error(data?.error || "Failed to remove users.");

      setSelectedIds(new Set());
      closeAllRemoveModals();
    } catch (e) {
      setError(e?.message || "Failed to remove users.");
    } finally {
      setBusy(false);
    }
  };

  const removeOneUser = (uid) => {
    if (isStaff) return;
    setSelectedIds(new Set([uid]));
    setShowRemoveModal(true);
  };

  const selectedUsersInfo = useMemo(() => {
    const map = new Map(filteredAndSortedRows.map((u) => [u.id, u]));
    return Array.from(selectedIds)
      .map((id) => map.get(id))
      .filter(Boolean);
  }, [selectedIds, filteredAndSortedRows]);

  const onClickConfirmRemoveStep1 = () => {
    if (isStaff) return;
    setShowRemoveModal(false);
    setShowRemoveConfirmModal(true);
  };

  const onConfirmRemoveStep2 = () => {
    if (isStaff) return;

    const target = selectedUsersInfo?.[0];
    setShowRemoveConfirmModal(false);

    if (isApprovedAdmin(target)) {
      setShowAdminCautionModal(true);
      return;
    }

    confirmRemoveSelected();
  };

  const onConfirmAdminCaution = () => {
    if (isStaff) return;
    setShowAdminCautionModal(false);
    confirmRemoveSelected();
  };

  const toggleCsvSelect = (uid) => {
    setSelectedCsvIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const onRowClick = (u) => {
    if (csvMode) {
      toggleCsvSelect(u.id);
      return;
    }
    setSelectedUser(u);
  };

  const escapeCsv = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const fmtDate = (rec) => {
    const d = rec?.date ?? rec?.trainingDate ?? rec?.createdAt ?? rec?.updatedAt;
    try {
      if (!d) return "";
      if (typeof d === "string") return d;

      if (typeof d?.toDate === "function") return d.toDate().toLocaleDateString();
      if (typeof d?.seconds === "number") return new Date(d.seconds * 1000).toLocaleDateString();
      if (typeof d?._seconds === "number") return new Date(d._seconds * 1000).toLocaleDateString();

      const dd = new Date(d);
      if (!Number.isNaN(dd.getTime())) return dd.toLocaleDateString();
      return "";
    } catch {
      return "";
    }
  };

  const fetchTrainingRecordsForUser = async (user) => {
    const nk = String(user?.nameKey || "").trim();
    if (!nk) return [];

    const ref = collection(db, "trainingRecords");
    const q = query(ref, where("nameKey", "==", nk));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  const downloadCsv = (filename, csvText) => {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportSelectedTrainingRecordsCsv = async () => {
    setError("");
    const ids = Array.from(selectedCsvIds);
    if (ids.length === 0) {
      setError("Please select at least one account to export.");
      return;
    }

    setBusy(true);
    try {
      const map = new Map(rows.map((u) => [u.id, u]));
      const selectedUsers = ids.map((id) => map.get(id)).filter(Boolean);

      let all = [];
      for (const u of selectedUsers) {
        const recs = await fetchTrainingRecordsForUser(u);
        all = all.concat(
          recs.map((r) => ({
            serialNumber: r.serialNumber ?? r.serial ?? r.serialNo ?? r["Serial #"] ?? "",
            date: fmtDate(r),
            lastName: r.lastName ?? r.last ?? "",
            firstName: r.firstName ?? r.first ?? "",
            middleInitial: r.middleInitial ?? r.mi ?? r.middle ?? "",
            agency: r.agency ?? "",
            department: r.department ?? "",
            position: r.position ?? "",
            pre: r.preTestScore ?? r.pre ?? "",
            post: r.postTestScore ?? r.post ?? "",
          }))
        );
      }

      const headers = [
        "Serial No.",
        "Date",
        "Last Name",
        "First Name",
        "MI",
        "Agency",
        "Department",
        "Position",
        "Pre",
        "Post",
      ];
      const lines = [headers.map(escapeCsv).join(",")];

      for (const row of all) {
        lines.push(
          [
            row.serialNumber,
            row.date,
            row.lastName,
            row.firstName,
            row.middleInitial,
            row.agency,
            row.department,
            row.position,
            row.pre,
            row.post,
          ]
            .map(escapeCsv)
            .join(",")
        );
      }

      const csv = lines.join("\n");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      downloadCsv(`training-records-export-${ts}.csv`, csv);

      setCsvMode(false);
      setSelectedCsvIds(new Set());
    } catch (e) {
      setError(e?.message || "Failed to export CSV.");
    } finally {
      setBusy(false);
    }
  };

  const isAllVisibleSelected = useMemo(() => {
    if (filteredAndSortedRows.length === 0) return false;
    return filteredAndSortedRows.every((u) => selectedCsvIds.has(u.id));
  }, [filteredAndSortedRows, selectedCsvIds]);

  const toggleSelectAllVisible = () => {
    setSelectedCsvIds((prev) => {
      const next = new Set(prev);
      const allSelected = filteredAndSortedRows.every((u) => next.has(u.id));

      if (allSelected) {
        filteredAndSortedRows.forEach((u) => next.delete(u.id));
      } else {
        filteredAndSortedRows.forEach((u) => next.add(u.id));
      }

      return next;
    });
  };

  const formatDateTime = (log) => {
    try {
      if (typeof log?.createdAtMs === "number") return new Date(log.createdAtMs).toLocaleString();

      const createdAt = log?.createdAt;
      if (createdAt?.seconds) return new Date(createdAt.seconds * 1000).toLocaleString();
      if (createdAt?._seconds) return new Date(createdAt._seconds * 1000).toLocaleString();
      if (typeof createdAt?.toDate === "function") return createdAt.toDate().toLocaleString();

      if (typeof createdAt === "string") {
        const d = new Date(createdAt);
        if (!Number.isNaN(d.getTime())) return d.toLocaleString();
      }

      return "—";
    } catch {
      return "—";
    }
  };

  const fmtRole = (r) => {
    const s = String(r || "").trim().toLowerCase();
    if (!s) return "";
    if (s === "admin") return "admin";
    if (s === "staff") return "staff";
    if (s === "participant") return "participant";
    if (s === "visitor") return "visitor";
    return s;
  };

  const buildAuditDetails = (log) => {
    const target = log?.target || {};
    const action = String(log?.action || "").toLowerCase();

    if (action === "update_role") {
      const br = fmtRole(target.beforeRole);
      const ar = fmtRole(target.afterRole);

      if (br || ar) {
        const fromPart = br ? `from ${br}` : "";
        const toPart = ar ? `to ${ar}` : "";
        return `${fromPart}${fromPart && toPart ? " " : ""}${toPart}`.trim() || "—";
      }

      return "role updated";
    }

    const before = String(target.beforeStatus || target.status || "").toLowerCase();
    const after = String(target.afterStatus || "").toLowerCase();

    if (before || after) {
      const fromPart = before ? `from ${before}` : "";
      const toPart = after ? `to ${after}` : "";
      return `${fromPart}${fromPart && toPart ? " " : ""}${toPart}`.trim() || "—";
    }

    if (action === "remove") return before ? `removed (was ${before})` : "removed";

    return "—";
  };

  const ActionButtons = ({ user }) => {
    const uid = user.id;

    const baseBtn = "px-3 py-1 rounded text-white disabled:opacity-40 text-sm";
    const singleBtn = `${baseBtn} w-[110px]`;
    const splitBtn = `${baseBtn} flex-1 min-w-0 px-2`;

    if (filter === "all") {
      if (isStaff) return null;

      return (
        <button
          onClick={() => removeOneUser(uid)}
          disabled={busy}
          className={`${singleBtn} bg-red-900 hover:bg-red-800`}
        >
          Remove
        </button>
      );
    }

    if (filter === "rejected") {
      return (
        <button
          onClick={() => approveUser(uid)}
          disabled={busy}
          className={`${singleBtn} bg-green-600 hover:bg-green-700`}
        >
          Approve
        </button>
      );
    }

    if (filter === "approved") {
      return (
        <button
          onClick={() => rejectUser(uid)}
          disabled={busy}
          className={`${singleBtn} bg-red-600 hover:bg-red-700`}
        >
          Reject
        </button>
      );
    }

    return (
      <>
        <button
          onClick={() => approveUser(uid)}
          disabled={busy}
          className={`${splitBtn} bg-green-600 hover:bg-green-700`}
        >
          Approve
        </button>

        <button
          onClick={() => rejectUser(uid)}
          disabled={busy}
          className={`${splitBtn} bg-red-600 hover:bg-red-700`}
        >
          Reject
        </button>
      </>
    );
  };

  const showActionColumn = !(isStaff && filter === "all");

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Gmail Accounts</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded font-semibold ${
                filter === "pending" ? "bg-red-900 text-white" : "bg-white border hover:bg-gray-50"
              }`}
            >
              Pending
            </button>

            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded font-semibold ${
                filter === "approved" ? "bg-red-900 text-white" : "bg-white border hover:bg-gray-50"
              }`}
            >
              Approved
            </button>

            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded font-semibold ${
                filter === "rejected" ? "bg-red-900 text-white" : "bg-white border hover:bg-gray-50"
              }`}
            >
              Rejected
            </button>

            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded font-semibold ${
                filter === "all" ? "bg-red-900 text-white" : "bg-white border hover:bg-gray-50"
              }`}
            >
              All
            </button>

            <button
              onClick={openAuditLog}
              className="px-4 py-2 rounded font-semibold bg-white border hover:bg-gray-50"
            >
              Audit Log
            </button>
          </div>

          <div className="flex items-center gap-2 border border-zinc-300 bg-white px-3 py-2 rounded-lg w-[280px]">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search last, first, or email..."
              className="w-full outline-none"
            />

            {searchTerm.trim() ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-gray-500 hover:text-gray-700 px-1"
                aria-label="Clear search"
                title="Clear search"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!csvMode ? (
            <button
              onClick={() => {
                setCsvMode(true);
                setSelectedCsvIds(new Set());
                setError("");
              }}
              disabled={busy}
              className="px-4 py-2 rounded font-semibold bg-white border hover:bg-gray-50 disabled:opacity-60"
              type="button"
            >
              Export CSV
            </button>
          ) : (
            <>
              <button
                onClick={exportSelectedTrainingRecordsCsv}
                disabled={busy || selectedCsvIds.size === 0}
                className="px-4 py-2 rounded font-semibold bg-white border hover:bg-gray-50 disabled:opacity-60"
                type="button"
                title={
                  selectedCsvIds.size === 0
                    ? "Select users first"
                    : "Download selected users training records"
                }
              >
                Download CSV
              </button>

              <button
                onClick={() => {
                  setCsvMode(false);
                  setSelectedCsvIds(new Set());
                  setError("");
                }}
                disabled={busy}
                className="px-4 py-2 rounded font-semibold bg-white border hover:bg-gray-50 disabled:opacity-60"
                type="button"
              >
                Cancel
              </button>
            </>
          )}

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown((v) => !v)}
              className="px-4 py-2 rounded font-semibold bg-white border hover:bg-gray-50"
              type="button"
              disabled={busy}
            >
              Filter
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-[320px] bg-white border rounded shadow p-4 z-40">
                <div className="text-base font-semibold mb-3">Filter by</div>

                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm mb-4"
                >
                  <option value="all">All</option>
                  <option value="admin">Admin</option>
                  <option value="participant">Participant</option>
                  <option value="visitor">Visitor</option>
                  <option value="staff">Staff</option>
                </select>

                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Region
                </label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm mb-4"
                >
                  <option value="all">All</option>
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setRoleFilter("all");
                      setRegionFilter("all");
                    }}
                    className="px-4 py-2 rounded border text-sm"
                    type="button"
                  >
                    Clear
                  </button>

                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-800"
                    type="button"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
        {csvMode ? (
          <div>
            <b>CSV Export Mode:</b> Select a row to export to CSV. (Click the row or
            checkbox to select/deselect)
          </div>
        ) : (
          <div>Tip: Click any user row to view/edit their training records.</div>
        )}
      </div>

      {error ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="p-4">Loading...</div>
      ) : filteredAndSortedRows.length === 0 ? (
        <div className="p-4 bg-white border rounded text-gray-600">
          No matching accounts found.
        </div>
      ) : (
        <div className="bg-white rounded-md shadow border overflow-hidden">
          <table className="w-full border-collapse table-fixed text-xs">
            <thead>
              <tr className="bg-gray-100 text-left">
                {csvMode ? (
                  <th className="px-2 py-2 w-[40px] text-center">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Select all visible"
                      title="Select all visible"
                    />
                  </th>
                ) : null}

                <th className={`px-2 py-2 ${showActionColumn ? "w-[90px]" : "w-[110px]"}`}>
                  Last Name
                </th>
                <th className={`px-2 py-2 ${showActionColumn ? "w-[90px]" : "w-[110px]"}`}>
                  First Name
                </th>
                <th className="px-2 py-2 w-[50px] text-center">MI</th>
                <th className={`px-2 py-2 ${showActionColumn ? "w-[180px]" : "w-[220px]"}`}>
                  Email
                </th>
                <th className={`px-2 py-2 ${showActionColumn ? "w-[180px]" : "w-[230px]"}`}>
                  Address
                </th>
                <th className={`px-2 py-2 ${showActionColumn ? "w-[80px]" : "w-[100px]"}`}>
                  Region
                </th>
                <th className={`px-2 py-2 ${showActionColumn ? "w-[80px]" : "w-[100px]"}`}>
                  Gender
                </th>
                <th className={`px-2 py-2 ${showActionColumn ? "w-[90px]" : "w-[110px]"}`}>
                  Role
                </th>
                <th className={`px-2 py-2 ${showActionColumn ? "w-[90px]" : "w-[110px]"}`}>
                  Status
                </th>

                {showActionColumn && (
                  <th className="px-2 py-2 w-[170px] text-center">Action</th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredAndSortedRows.map((u) => {
                const selected = selectedCsvIds.has(u.id);
                const roleLower = String(u.role || "").trim().toLowerCase();

                return (
                  <tr
                    key={u.id}
                    className={`border-t hover:bg-gray-50 cursor-pointer ${
                      csvMode && selected ? "bg-gray-50" : ""
                    }`}
                    onClick={() => onRowClick(u)}
                  >
                    {csvMode ? (
                      <td
                        className="px-2 py-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCsvSelect(u.id)}
                          aria-label={`Select ${u.email || "user"}`}
                        />
                      </td>
                    ) : null}

                    <td className="px-2 py-2 break-words">{u.lastName || "—"}</td>
                    <td className="px-2 py-2 break-words">{u.firstName || "—"}</td>
                    <td className="px-2 py-2 text-center">{u.middleInitial || "—"}</td>
                    <td className="px-2 py-2 break-words">{u.email || "—"}</td>
                    <td className="px-2 py-2 break-words">{u.address || "—"}</td>
                    <td className="px-2 py-2">{u.region || "—"}</td>
                    <td className="px-2 py-2 capitalize">{u.gender || "—"}</td>

                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      {roleLower === "visitor" || roleLower === "participant" ? (
                        <select
                          value={roleLower}
                          disabled={busy}
                          onChange={(e) => setUserRole(u.id, e.target.value)}
                          className="bg-transparent outline-none"
                          title="Change role"
                        >
                          <option value="participant">participant</option>
                          <option value="visitor">visitor</option>
                        </select>
                      ) : (
                        u.role || "—"
                      )}
                    </td>

                    <td className="px-2 py-2">
                      <StatusBadge status={u.status} />
                    </td>

                    {showActionColumn && (
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex w-full justify-center gap-2">
                          <ActionButtons user={u} />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <TrainingRecordsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {!isStaff && showRemoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowRemoveModal(false)}
              className="absolute top-3 right-3 text-xl"
              type="button"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-2">Remove Accounts</h2>
            <p className="text-gray-600 mb-4">
              You selected <b>{selectedIds.size}</b> account(s). This will delete them
              from Firestore <b>and</b> Firebase Auth (email becomes reusable).
            </p>

            <div className="border rounded p-3 max-h-[260px] overflow-y-auto text-sm">
              {selectedUsersInfo.length === 0 ? (
                <p className="text-gray-500">No selected users found.</p>
              ) : (
                <ul className="space-y-3">
                  {selectedUsersInfo.map((u) => (
                    <li key={u.id} className="border-b pb-2 last:border-b-0">
                      <div>
                        <b>Email:</b> {u.email || "—"}
                      </div>
                      <div>
                        <b>Name:</b>{" "}
                        {(u.fullName ||
                          `${u.firstName || ""} ${u.lastName || ""}`.trim()) || "—"}
                      </div>
                      <div>
                        <b>Role:</b> {u.role || "—"} | <b>Status:</b> {u.status || "—"}
                      </div>
                      <div>
                        <b>Region:</b> {u.region || "—"}
                      </div>
                      <div>
                        <b>Address:</b> {u.address || "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 rounded border"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={onClickConfirmRemoveStep1}
                disabled={selectedIds.size === 0 || busy}
                className="px-4 py-2 rounded bg-red-900 text-white hover:bg-red-800 disabled:opacity-60"
                type="button"
              >
                {busy ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isStaff && showRemoveConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowRemoveConfirmModal(false)}
              className="absolute top-3 right-3 text-xl"
              type="button"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-2">Confirm Deletion</h2>

            {(() => {
              const target = selectedUsersInfo?.[0];
              const roleLabel = getRoleLabel(target);

              return (
                <>
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to delete this <b>{roleLabel}</b> account?
                  </p>

                  <p className="text-gray-600 mb-4">
                    Deleting this account would delete the registered gmail and its
                    registered records, but won't delete their existing training records.
                  </p>

                  <div className="border rounded p-3 text-sm">
                    <div>
                      <b>Email:</b> {target?.email || "—"}
                    </div>
                    <div>
                      <b>Name:</b>{" "}
                      {(target?.fullName ||
                        `${target?.firstName || ""} ${target?.lastName || ""}`.trim()) ||
                        "—"}
                    </div>
                    <div>
                      <b>Role:</b> {target?.role || "—"} | <b>Status:</b>{" "}
                      {target?.status || "—"}
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowRemoveConfirmModal(false);
                  setShowRemoveModal(true);
                }}
                className="px-4 py-2 rounded border"
                type="button"
              >
                Back
              </button>

              <button
                onClick={() => setShowRemoveConfirmModal(false)}
                className="px-4 py-2 rounded border"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={onConfirmRemoveStep2}
                disabled={busy}
                className="px-4 py-2 rounded bg-red-900 text-white hover:bg-red-800 disabled:opacity-60"
                type="button"
              >
                {busy ? "Removing..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isStaff && showAdminCautionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowAdminCautionModal(false)}
              className="absolute top-3 right-3 text-xl"
              type="button"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-2">Admin Account Warning</h2>

            <p className="text-gray-700 mb-4">
              This user is currently an <b>admin</b>. Take extra caution when removing
              an admin account.
            </p>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowAdminCautionModal(false)}
                className="px-4 py-2 rounded border"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={onConfirmAdminCaution}
                disabled={busy}
                className="px-4 py-2 rounded bg-red-900 text-white hover:bg-red-800 disabled:opacity-60"
                type="button"
              >
                {busy ? "Removing..." : "Yes, Remove Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl p-6 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowAuditModal(false)}
              className="absolute top-3 right-3 text-xl"
              type="button"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold mb-3">Audit Log</h2>

            {auditError ? (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {auditError}
              </div>
            ) : null}

            <div className="border rounded overflow-hidden flex-1 min-h-0">
              {auditLoading ? (
                <div className="p-4">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-4 text-gray-600">No audit logs found.</div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-sm table-fixed">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-left w-[180px]">Date/Time</th>
                        <th className="p-3 text-left w-[210px]">Admin</th>
                        <th className="p-3 text-left w-[90px]">Action</th>
                        <th className="p-3 text-left w-[250px]">Target Email</th>
                        <th className="p-3 text-left w-[220px]">Target Name</th>
                        <th className="p-3 text-left">Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {auditLogs.map((log) => {
                        const target = log?.target || {};
                        return (
                          <tr key={log.id} className="border-t align-top">
                            <td className="p-3 whitespace-nowrap">{formatDateTime(log)}</td>
                            <td className="p-3 break-words">
                              {log.adminEmail || log.adminUid || "—"}
                            </td>
                            <td className="p-3 font-semibold capitalize break-words">
                              {log.action || "—"}
                            </td>
                            <td className="p-3 break-all">{target.email || "—"}</td>
                            <td className="p-3 break-words">{target.fullName || "—"}</td>
                            <td className="p-3 text-gray-700 break-words">
                              {buildAuditDetails(log)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={openAuditLog}
                className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-800"
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}