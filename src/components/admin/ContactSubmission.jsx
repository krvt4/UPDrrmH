import React, { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  PlayCircle,
  Send,
  Clock3,
  MessageSquareText,
  Sparkles,
  User,
  Building2,
  Mail,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { auth } from "../../firebase/firebase";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const LIST_URL = `${API_BASE}/api/contact`;
const DELETE_URL = (id) => `${API_BASE}/api/contact/${id}`;
const STATUS_URL = (id) => `${API_BASE}/api/contact/${id}/status`;
const THREAD_URL = (id) => `${API_BASE}/api/contact/${id}/thread`;
const REPLY_URL = (id) => `${API_BASE}/api/contact/${id}/reply`;

const CATEGORY_OPTIONS = [
  "All categories",
  "General Inquiry",
  "Training / Registration",
  "Technical Support",
  "Partnership / Collaboration",
  "Feedback",
  "Other",
];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "closed", label: "Closed" },
];

const QUICK_REPLIES = [
  {
    label: "Greeting",
    text: `Hello,

Thank you for reaching out to DRRM for Health. We have received your concern and we are currently reviewing it.

We will get back to you as soon as possible.

Regards,
DRRM for Health`,
  },
  {
    label: "We are reviewing",
    text: `Hello,

Thank you for your message. Your concern is now under review by our team. We will provide you with an update as soon as possible.

Regards,
DRRM for Health`,
  },
  {
    label: "Need more details",
    text: `Hello,

Thank you for your message. To assist you better, kindly provide additional details regarding your concern.

Once we receive the information, we will continue processing your request.

Regards,
DRRM for Health`,
  },
  {
    label: "Resolved",
    text: `Hello,

Your concern has been addressed. Please check on your end and let us know if you still need further assistance.

Regards,
DRRM for Health`,
  },
];

function getDateMs(m) {
  if (typeof m?.createdAtMs === "number") return m.createdAtMs;
  if (m?.createdAt?._seconds) return m.createdAt._seconds * 1000;
  if (m?.createdAt?.seconds) return m.createdAt.seconds * 1000;
  return 0;
}

function formatDate(ms) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeStatus(s) {
  const v = String(s || "open").toLowerCase();
  if (v === "closed") return "closed";
  if (v === "in_progress") return "in_progress";
  return "open";
}

function statusLabel(s) {
  const v = normalizeStatus(s);
  if (v === "closed") return "Closed";
  if (v === "in_progress") return "In Progress";
  return "Open";
}

function getRemainingMs(ticket) {
  if (!ticket?.awaitingAdmin) return null;
  if (typeof ticket?.slaDueAtMs !== "number") return null;
  return ticket.slaDueAtMs - Date.now();
}

function formatRemaining(ms) {
  if (typeof ms !== "number") return "—";
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((v) => String(v).padStart(2, "0")).join(":");
}

function StatusBadge({ status }) {
  const s = normalizeStatus(status);
  const cls =
    s === "closed"
      ? "bg-green-50 text-green-700 border-green-200"
      : s === "in_progress"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-yellow-50 text-yellow-800 border-yellow-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${cls}`}>
      {statusLabel(s)}
    </span>
  );
}

function CountdownBadge({ ticket }) {
  const remaining = getRemainingMs(ticket);

  if (!ticket?.awaitingAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-200">
        <PlayCircle size={14} />
        Waiting for user
      </span>
    );
  }

  if (remaining == null) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-gray-50 text-gray-700 border-gray-200">
        <Clock3 size={14} />
        —
      </span>
    );
  }

  const expired = remaining <= 0;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${
        expired
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-orange-50 text-orange-700 border-orange-200"
      }`}
    >
      <Clock3 size={14} />
      {expired ? "Overdue" : formatRemaining(remaining)}
    </span>
  );
}

function ThreadBubble({ item }) {
  const isAdmin = item?.senderRole === "admin";

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 border shadow-sm ${
          isAdmin
            ? "bg-blue-50 border-blue-200 text-blue-950"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
          <span className="text-sm font-semibold">
            {item?.senderName || (isAdmin ? "Admin" : "Requester")}
          </span>
          <span className="text-[11px] text-gray-500">{formatDate(getDateMs(item))}</span>
          {item?.sentViaEmail ? (
            <span className="text-[11px] text-gray-500">• email</span>
          ) : null}
        </div>

        <div className="whitespace-pre-wrap break-words text-sm leading-6">
          {item?.body || "—"}
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 min-w-0">
      <Icon size={14} className="shrink-0 text-gray-500" />
      <span className="truncate">{value || "—"}</span>
    </div>
  );
}

function TicketDetail({ ticket, onBack, onSetStatus, busy, onTicketUpdated }) {
  const [thread, setThread] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadThread() {
      try {
        setThreadLoading(true);
        setThreadError("");

        const res = await fetch(THREAD_URL(ticket.id), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || `Thread load failed (${res.status})`);
        }

        if (mounted) {
          setThread(Array.isArray(data.thread) ? data.thread : []);
        }
      } catch (e) {
        if (mounted) {
          setThreadError(e?.message || "Failed to load conversation");
        }
      } finally {
        if (mounted) {
          setThreadLoading(false);
        }
      }
    }

    loadThread();

    const refreshInterval = setInterval(loadThread, 60000);
    const clockInterval = setInterval(() => setTick((v) => v + 1), 1000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      clearInterval(clockInterval);
    };
  }, [ticket.id]);

  async function handleSendReply() {
    try {
      const trimmed = reply.trim();
      if (!trimmed) return;

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No logged-in admin found.");

      setSendingReply(true);
      setThreadError("");

      const token = await currentUser.getIdToken();

      const res = await fetch(REPLY_URL(ticket.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Reply failed (${res.status})`);
      }

      const appendedReply = {
        id: data?.replyId || `temp-${Date.now()}`,
        ...(data?.reply || {}),
        body: data?.reply?.body || trimmed,
        senderRole: "admin",
        senderName:
          data?.reply?.senderName ||
          currentUser.displayName ||
          currentUser.email ||
          "Admin",
        senderEmail: data?.reply?.senderEmail || currentUser.email || "",
        sentViaEmail: true,
        createdAtMs: data?.reply?.createdAtMs || Date.now(),
      };

      setThread((prev) => [...prev, appendedReply]);
      setReply("");

      onTicketUpdated(ticket.id, {
        status: "in_progress",
        awaitingAdmin: false,
        updatedAtMs: Date.now(),
        lastSenderUid: currentUser.uid,
        lastSenderEmail: currentUser.email || "",
        lastSenderName: currentUser.displayName || currentUser.email || "Admin",
      });
    } catch (e) {
      setThreadError(e?.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b bg-white px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm"
          >
            <ArrowLeft size={16} />
            Back to list
          </button>

          <h3 className="text-2xl font-bold">Ticket Conversation</h3>
          <StatusBadge status={ticket.status} />
          <CountdownBadge ticket={ticket} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <InfoChip icon={User} value={ticket.name} />
          <InfoChip icon={Mail} value={ticket.email} />
          <InfoChip icon={Building2} value={ticket.company} />
          <InfoChip icon={Tag} value={ticket.category} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] min-h-[720px]">
        <div className="bg-[#f8fafc] p-5 border-r border-gray-200">
          {threadError ? (
            <div className="mb-3 text-sm text-red-600">{threadError}</div>
          ) : null}

          <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <MessageSquareText size={16} />
              Original Concern
            </div>
            <div className="whitespace-pre-wrap break-words text-sm text-gray-800 leading-6">
              {ticket.message || "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="text-base font-semibold text-gray-900">Conversation History</div>
              <div className="text-xs text-gray-500">Auto-refresh every 1 minute</div>
            </div>

            <div className="space-y-4 min-h-[520px] max-h-[720px] overflow-y-auto pr-2">
              {threadLoading ? (
                <div className="text-sm text-gray-500">Loading conversation...</div>
              ) : thread.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No conversation history yet.</div>
              ) : (
                thread.map((item) => (
                  <ThreadBubble
                    key={item.id || `${item.senderEmail}-${getDateMs(item)}`}
                    item={item}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Sparkles size={16} />
            Quick Response Guide
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {QUICK_REPLIES.map((item) => (
              <button
                key={item.label}
                onClick={() => setReply(item.text)}
                className="px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="text-sm font-semibold text-gray-800 mb-2">Reply to Ticket</div>

          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={18}
            placeholder="Type your reply here. This will be saved in the ticket conversation and sent through email."
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <div className="mt-4 text-xs text-gray-500 leading-5">
            When admin replies, the ticket automatically becomes <b>In Progress</b>.
            When the user replies by email, it becomes <b>Open</b> again and the 24-hour countdown restarts.
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => onSetStatus(ticket.id, "open")}
              disabled={busy || normalizeStatus(ticket.status) === "open"}
              className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm disabled:opacity-50"
            >
              Mark Open
            </button>

            <button
              onClick={() => onSetStatus(ticket.id, "in_progress")}
              disabled={busy || normalizeStatus(ticket.status) === "in_progress"}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
            >
              <PlayCircle size={16} />
              In Progress
            </button>

            <button
              onClick={() => onSetStatus(ticket.id, "closed")}
              disabled={busy || normalizeStatus(ticket.status) === "closed"}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              Mark Done
            </button>

            <button
              onClick={handleSendReply}
              disabled={sendingReply || !reply.trim()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
            >
              <Send size={16} />
              {sendingReply ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactSubmissionsTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [category, setCategory] = useState("All categories");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [, setTick] = useState(0);

  async function fetchMessages() {
    try {
      setErr("");
      setLoading(true);

      const res = await fetch(LIST_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "API returned ok=false");

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (e) {
      setErr(e?.message || "Failed to load contact submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
    const listInterval = setInterval(fetchMessages, 60000);
    const clockInterval = setInterval(() => setTick((v) => v + 1), 1000);

    return () => {
      clearInterval(listInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    let arr = [...messages];

    if (q) {
      arr = arr.filter((m) => {
        const blob = [m.name, m.email, m.company, m.category, m.message, m.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }

    if (category !== "All categories") {
      arr = arr.filter(
        (m) => (m.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    if (statusFilter !== "all") {
      arr = arr.filter((m) => normalizeStatus(m.status) === statusFilter);
    }

    if (fromMs != null) arr = arr.filter((m) => getDateMs(m) >= fromMs);
    if (toMs != null) arr = arr.filter((m) => getDateMs(m) <= toMs);

    arr.sort((a, b) => {
      const da = getDateMs(a);
      const db = getDateMs(b);
      return sortDir === "asc" ? da - db : db - da;
    });

    return arr;
  }, [messages, query, category, statusFilter, dateFrom, dateTo, sortDir]);

  async function handleDelete(id) {
    if (!id) return;

    const ok = window.confirm("Delete this submission? This cannot be undone.");
    if (!ok) return;

    try {
      setErr("");
      setBusyId(id);

      const res = await fetch(DELETE_URL(id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.ok === false)) {
        throw new Error(data?.error || `Delete failed (${res.status})`);
      }

      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      setErr(e?.message || "Failed to delete submission");
    } finally {
      setBusyId("");
    }
  }

  async function setTicketStatus(id, status) {
    try {
      setErr("");
      setSavingStatus(true);

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No logged-in admin found.");

      const token = await currentUser.getIdToken();

      const res = await fetch(STATUS_URL(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, token }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Status update failed (${res.status})`);
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, status, statusUpdatedAtMs: Date.now() }
            : m
        )
      );

      setSelected((prev) =>
        prev?.id === id
          ? { ...prev, status, statusUpdatedAtMs: Date.now() }
          : prev
      );
    } catch (e) {
      setErr(e?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  }

  function updateTicketLocally(id, patch) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  }

  function clearFilters() {
    setQuery("");
    setCategory("All categories");
    setDateFrom("");
    setDateTo("");
    setSortDir("desc");
    setStatusFilter("all");
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Contact Submissions</h2>
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            <RefreshCw size={16} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, company, message..."
            className="w-full md:w-80 px-3 py-2 rounded border-2 border-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full md:w-56 px-3 py-2 rounded border-2 border-gray-400 bg-white"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`px-3 py-2 rounded text-sm border ${
              statusFilter === s.key
                ? "bg-[#7b1113] text-white border-[#7b1113]"
                : "bg-white hover:bg-gray-50 border-gray-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded border-2 border-gray-400 bg-white"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded border-2 border-gray-400 bg-white"
          />
        </div>
      </div>

      {err ? <div className="mt-3 text-red-600 font-medium">Error: {err}</div> : null}

      <div className="mt-4 overflow-hidden rounded border border-gray-200 bg-white">
        <table className="w-full table-fixed border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="w-[170px] text-left p-2 md:p-3 border-b cursor-pointer select-none"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title="Click to sort by date"
              >
                <div className="flex items-center gap-2">
                  <span>Date</span>
                  {sortDir === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </th>
              <th className="w-[130px] text-left p-2 md:p-3 border-b">Status</th>
              <th className="w-[160px] text-left p-2 md:p-3 border-b">Countdown</th>
              <th className="w-[140px] text-left p-2 md:p-3 border-b">Name</th>
              <th className="w-[220px] text-left p-2 md:p-3 border-b">Email</th>
              <th className="w-[160px] text-left p-2 md:p-3 border-b">Company</th>
              <th className="w-[170px] text-left p-2 md:p-3 border-b">Category</th>
              <th className="w-[140px] text-left p-2 md:p-3 border-b">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={8}>Loading...</td>
              </tr>
            ) : filteredSorted.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={8}>No submissions found.</td>
              </tr>
            ) : (
              filteredSorted.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-gray-50 cursor-pointer ${selected?.id === m.id ? "bg-blue-50/50" : ""}`}
                  onClick={() => setSelected(m)}
                  title="Click to open ticket"
                >
                  <td className="p-2 md:p-3 border-b whitespace-nowrap text-sm text-gray-700">
                    {formatDate(getDateMs(m))}
                  </td>

                  <td className="p-2 md:p-3 border-b">
                    <StatusBadge status={m.status} />
                  </td>

                  <td className="p-2 md:p-3 border-b">
                    <CountdownBadge ticket={m} />
                  </td>

                  <td className="p-2 md:p-3 border-b truncate" title={m.name}>
                    {m.name || "—"}
                  </td>

                  <td className="p-2 md:p-3 border-b truncate">
                    {m.email ? (
                      <a
                        className="text-blue-600 hover:underline"
                        href={`mailto:${m.email}`}
                        onClick={(e) => e.stopPropagation()}
                        title={m.email}
                      >
                        {m.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="p-2 md:p-3 border-b truncate" title={m.company || ""}>
                    {m.company || "—"}
                  </td>

                  <td className="p-2 md:p-3 border-b text-sm text-gray-800 break-words whitespace-normal">
                    {m.category || "—"}
                  </td>

                  <td className="p-2 md:p-3 border-b">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(m.id);
                      }}
                      disabled={busyId === m.id}
                      className="inline-flex items-center justify-center gap-2 rounded bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-50 px-2 md:px-3 py-2 w-full"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                      <span className="hidden md:inline">
                        {busyId === m.id ? "Deleting..." : "Delete"}
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <TicketDetail
          ticket={selected}
          busy={savingStatus}
          onBack={() => setSelected(null)}
          onSetStatus={setTicketStatus}
          onTicketUpdated={updateTicketLocally}
        />
      ) : null}
    </div>
  );
}