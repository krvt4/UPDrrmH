// src/components/admin/TrainingRecordsModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";

export default function TrainingRecordsModal({ user, onClose }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  // view | update | remove
  const [mode, setMode] = useState("view");
  const [selectedId, setSelectedId] = useState(null);

  // edit modal (also used for create)
  const [editing, setEditing] = useState(null); // record object
  const [editKind, setEditKind] = useState(null); // "edit" | "create"
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // delete confirm UI
  const [confirmDelete, setConfirmDelete] = useState(null); // record object
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ✅ same matching logic as UserPanel: nameKey
  const nameKey = useMemo(() => {
    if (user?.nameKey) return user.nameKey;
    const first = (user?.firstName || "").trim().toLowerCase();
    const last = (user?.lastName || "").trim().toLowerCase();
    const nk = `${first}|${last}`;
    return nk === "|" ? "" : nk;
  }, [user]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        if (!nameKey) {
          setRecords([]);
          return;
        }

        const qy = query(collection(db, "trainingRecords"), where("nameKey", "==", nameKey));
        const snap = await getDocs(qy);
        if (!alive) return;

        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // stable-ish ordering (date then serial)
        list.sort((a, b) => {
          const ad = (a.trainingDate || "").toString();
          const bd = (b.trainingDate || "").toString();
          const cmp = ad.localeCompare(bd);
          if (cmp !== 0) return cmp;
          return (a.serialNumber || "").toString().localeCompare((b.serialNumber || "").toString());
        });

        setRecords(list);
      } catch (e) {
        setError(e?.message || "Failed to load training records.");
        setRecords([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [nameKey]);

  // ---------- helpers ----------
  const resetModes = () => {
    setMode("view");
    setSelectedId(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditKind(null);
    setForm({});
    setSaveError("");
    setSaving(false);
  };

  // ✅ digits-only sanitizer for Pre/Post
  const digitsOnly = (v) => String(v ?? "").replace(/[^\d]/g, "");

  const openEdit = (record) => {
    setSaveError("");
    setEditKind("edit");
    setEditing(record);

    setForm({
      serialNumber: record?.serialNumber || "",
      trainingDate: record?.trainingDate || "",

      lastName: record?.lastName || "",
      firstName: record?.firstName || "",
      middleInitial: record?.middleInitial || "",
      agency: record?.agency || "",
      department: record?.department || "",
      position: record?.position || "",

      // ✅ keep as string in UI, but digits-only
      preTestScore: record?.preTestScore == null ? "" : String(record.preTestScore),
      postTestScore: record?.postTestScore == null ? "" : String(record.postTestScore),

      nameKey: record?.nameKey || nameKey,
      source: record?.source || "",
    });
  };

  const openCreate = () => {
    setSaveError("");
    setEditKind("create");
    setEditing({ id: null });

    setForm({
      serialNumber: "",
      trainingDate: "",

      lastName: user?.lastName || "",
      firstName: user?.firstName || "",
      middleInitial: user?.middleInitial || "",
      agency: "",
      department: "",
      position: "",

      // ✅ UI strings
      preTestScore: "",
      postTestScore: "",

      nameKey: nameKey || "",
      source: "",
    });
  };

  // ✅ supports normal fields + special numeric fields
  const onChange = (key) => (e) => {
    const v = e?.target?.value ?? "";

    // ✅ Pre/Post numbers only
    if (key === "preTestScore" || key === "postTestScore") {
      setForm((prev) => ({ ...prev, [key]: digitsOnly(v) }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: v }));
  };

  const toggleUpdateMode = () => {
    // only one mode at a time
    setConfirmDelete(null);
    setDeleteError("");
    setSelectedId(null);
    setMode((m) => (m === "update" ? "view" : "update"));
  };

  const toggleRemoveMode = () => {
    setConfirmDelete(null);
    setDeleteError("");
    setSelectedId(null);
    setMode((m) => (m === "remove" ? "view" : "remove"));
  };

  // ---------- actions ----------
  async function onSave() {
    if (!editKind) return;
    setSaving(true);
    setSaveError("");

    try {
      const preStr = digitsOnly(form.preTestScore);
      const postStr = digitsOnly(form.postTestScore);

      const payload = {
        serialNumber: (form.serialNumber || "").trim(),

        // ✅ stored as YYYY-MM-DD from <input type="date" />
        trainingDate: (form.trainingDate || "").trim(),

        lastName: (form.lastName || "").trim(),
        firstName: (form.firstName || "").trim(),
        middleInitial: (form.middleInitial || "").trim(),
        agency: (form.agency || "").trim(),
        department: (form.department || "").trim(),
        position: (form.position || "").trim(),

        // ✅ store as number or "" (keeps original behavior)
        preTestScore: preStr === "" ? "" : Number(preStr),
        postTestScore: postStr === "" ? "" : Number(postStr),

        nameKey: (form.nameKey || nameKey || "").trim(),
        source: (form.source || "").trim(),
        updatedAt: serverTimestamp(),
      };

      if (editKind === "edit") {
        if (!editing?.id) throw new Error("Missing record id.");
        const ref = doc(db, "trainingRecords", editing.id);
        await updateDoc(ref, payload);

        // update local list
        setRecords((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r)));

        closeEdit();
        return;
      }

      // create
      const ref = collection(db, "trainingRecords");
      const created = await addDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });

      // add locally ONLY after save succeeds
      setRecords((prev) => {
        const next = [...prev, { id: created.id, ...payload }];
        next.sort((a, b) => {
          const ad = (a.trainingDate || "").toString();
          const bd = (b.trainingDate || "").toString();
          const cmp = ad.localeCompare(bd);
          if (cmp !== 0) return cmp;
          return (a.serialNumber || "").toString().localeCompare((b.serialNumber || "").toString());
        });
        return next;
      });

      closeEdit();
    } catch (e) {
      setSaveError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const requestDelete = (record) => {
    setDeleteError("");
    setConfirmDelete(record);
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
    setDeleteError("");
    setDeleting(false);
  };

  const confirmDeleteNow = async () => {
    if (!confirmDelete?.id) return;
    setDeleting(true);
    setDeleteError("");

    try {
      await deleteDoc(doc(db, "trainingRecords", confirmDelete.id));
      setRecords((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      cancelDelete();
      setSelectedId((id) => (id === confirmDelete.id ? null : id));
    } catch (e) {
      setDeleteError(e?.message || "Failed to delete record.");
    } finally {
      setDeleting(false);
    }
  };

  // ---------- row click behavior ----------
  const onRowClick = (r) => {
    if (mode === "update") {
      setSelectedId(r.id);
      openEdit(r);
      return;
    }
    if (mode === "remove") {
      setSelectedId(r.id);
      requestDelete(r);
      return;
    }
  };

  const modeHint =
    mode === "update"
      ? "Update mode is ON: click a row to edit it."
      : mode === "remove"
      ? "Remove mode is ON: click a row to delete it."
      : "";

  const handleCloseAll = () => {
    if (confirmDelete) return cancelDelete();
    if (editing) return closeEdit();
    resetModes();
    onClose?.();
  };

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={handleCloseAll}>
        <div
          className="bg-white rounded-xl w-[80%] p-6 relative max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* X */}
          <button
            onClick={handleCloseAll}
            className="absolute top-4 right-4 text-2xl text-gray-700 hover:text-black leading-none cursor-pointer"
            type="button"
            aria-label="Close"
          >
            ✕
          </button>

          <h2 className="text-4xl font-extrabold mb-1">Training Records</h2>
          <p className="text-base text-gray-600 mb-3">
            {user?.email || "—"} <span className="text-gray-400">•</span> nameKey: <b>{nameKey || "—"}</b>
          </p>

          {modeHint ? (
            <div className="mb-4 text-sm text-gray-700">
              <b>{modeHint.split(":")[0]}:</b> {modeHint.split(":").slice(1).join(":").trim()}
            </div>
          ) : null}

          {loading ? (
            <div className="p-4">Loading...</div>
          ) : error ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
          ) : records.length === 0 ? (
            <div className="p-4 bg-gray-50 border rounded text-gray-700">No training records found for this user.</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-100">
                  <tr className="text-left">
                    <Th w="w-[12%]">Serial No.</Th>
                    <Th w="w-[10%]">Date</Th>
                    <Th w="w-[10%]">Last Name</Th>
                    <Th w="w-[14%]">First Name</Th>
                    <Th w="w-[6%]">MI</Th>
                    <Th w="w-[13%]">Agency</Th>
                    <Th w="w-[20%]">Department</Th>
                    <Th w="w-[10%]">Position</Th>
                    <Th w="w-[7%]">Pre</Th>
                    <Th w="w-[8%]">Post</Th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((r, idx) => {
                    const isSelected = selectedId === r.id;
                    const clickable = mode === "update" || mode === "remove";
                    return (
                      <tr
                        key={r.id}
                        onClick={() => clickable && onRowClick(r)}
                        className={
                          "border-t align-top " +
                          (idx % 2 === 0 ? "bg-white" : "bg-gray-50") +
                          (clickable ? " cursor-pointer hover:bg-yellow-50" : "") +
                          (isSelected ? " outline outline-2 outline-red-300" : "")
                        }
                        title={
                          mode === "update"
                            ? "Click to edit this record"
                            : mode === "remove"
                            ? "Click to delete this record"
                            : ""
                        }
                      >
                        <Td wrap="break-all" strong>
                          {r.serialNumber || "—"}
                        </Td>
                        <Td wrap="break-words">{r.trainingDate || "—"}</Td>
                        <Td wrap="break-words">{r.lastName || "—"}</Td>
                        <Td wrap="break-words">{r.firstName || "—"}</Td>
                        <Td wrap="break-words">{r.middleInitial || "—"}</Td>
                        <Td wrap="break-words">{r.agency || "—"}</Td>
                        <Td wrap="break-words">{r.department || "—"}</Td>
                        <Td wrap="break-words">{r.position || "—"}</Td>
                        <Td wrap="break-words">{r.preTestScore ?? "—"}</Td>
                        <Td wrap="break-words">{r.postTestScore ?? "—"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Top-right buttons (moved away from X) */}
          <div className="flex justify-end mt-6 gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirmDelete) return;
                if (editKind === "create") {
                  closeEdit();
                } else {
                  setMode("view");
                  setSelectedId(null);
                  openCreate();
                }
              }}
              disabled={loading}
              className={
                "px-4 py-2 rounded border font-semibold disabled:opacity-60" +
                (editKind === "create" ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-900 cursor-pointer" : "hover:bg-gray-50")
              }
            >
              {editKind === "create" ? "Cancel" : "Add"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (editing) return;
                toggleRemoveMode();
              }}
              disabled={loading || records.length === 0}
              className={
                "px-4 py-2 rounded border font-semibold disabled:opacity-60 cursor-pointer" +
                (mode === "remove" ? "bg-red-700 text-white border-red-700 hover:bg-red-800" : "hover:bg-gray-50")
              }
            >
              {mode === "remove" ? "Cancel" : "Remove"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (editing) return;
                toggleUpdateMode();
              }}
              disabled={loading || records.length === 0}
              className={
                "px-4 py-2 rounded border font-semibold disabled:opacity-60 cursor-pointer" +
                (mode === "update" ? "bg-red-900 text-white border-red-900 hover:bg-red-800" : "hover:bg-gray-50")
              }
            >
              {mode === "update" ? "Cancel" : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4" onClick={cancelDelete}>
          <div className="bg-white rounded-xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={cancelDelete}
              className="absolute top-4 right-4 text-2xl leading-none cursor-pointer"
              type="button"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold mb-2">Delete Training Record?</h3>
            <p className="text-gray-700 mb-4">
              This will permanently remove the selected record for <b>{user?.email || "this user"}</b>.
            </p>

            <div className="border rounded-lg p-3 text-sm text-gray-800 mb-4 bg-gray-50">
              <div>
                <b>Serial:</b> {confirmDelete.serialNumber || "—"}
              </div>
              <div>
                <b>Name:</b> {(confirmDelete.firstName || "—") + " " + (confirmDelete.lastName || "—")}
              </div>
              <div>
                <b>Record ID:</b> {confirmDelete.id}
              </div>
            </div>

            {deleteError ? (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{deleteError}</div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button onClick={cancelDelete} className="px-4 py-2 rounded border" type="button" disabled={deleting}>
                Cancel
              </button>
              <button
                onClick={confirmDeleteNow}
                className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-800 disabled:opacity-60"
                type="button"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4" onClick={closeEdit}>
          <div
            className="bg-white rounded-xl w-full max-w-5xl p-6 relative max-h-[88vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeEdit}
              className="absolute top-4 right-4 text-2xl leading-none cursor-pointer"
              type="button"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-3xl font-extrabold mb-1">
              {editKind === "create" ? "Add Training Record" : "Edit Training Record"}
            </h3>
            <p className="text-gray-600 mb-5">
              {editKind === "create" ? (
                <>
                  Creating a new record for <b>{user?.email || "—"}</b>
                </>
              ) : (
                <>
                  Record ID: <b>{editing.id}</b>
                </>
              )}
            </p>

            {saveError ? (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{saveError}</div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Serial Number" value={form.serialNumber} onChange={onChange("serialNumber")} />

              {/* ✅ click/focus anywhere opens date picker */}
              <Field
                label="Training Date"
                type="date"
                value={form.trainingDate}
                onChange={onChange("trainingDate")}
                openPickerOnClick
              />

              <Field label="Last Name" value={form.lastName} onChange={onChange("lastName")} />
              <Field label="First Name" value={form.firstName} onChange={onChange("firstName")} />

              <Field label="Middle Initial" value={form.middleInitial} onChange={onChange("middleInitial")} />
              <Field label="Agency" value={form.agency} onChange={onChange("agency")} />

              <Field label="Department" value={form.department} onChange={onChange("department")} />
              <Field label="Position" value={form.position} onChange={onChange("position")} />

              <Field
                label="Pre-test Score"
                value={String(form.preTestScore ?? "")}
                onChange={onChange("preTestScore")}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Numbers only"
              />
              <Field
                label="Post-test Score"
                value={String(form.postTestScore ?? "")}
                onChange={onChange("postTestScore")}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Numbers only"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeEdit} className="px-6 py-3 rounded border text-lg cursor-pointer" type="button" disabled={saving}>
                Cancel
              </button>

              <button
                onClick={onSave}
                disabled={saving}
                className="px-6 py-3 rounded bg-red-800 text-white hover:bg-red-900 disabled:opacity-60 text-lg cursor-pointer"
                type="button"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Th({ children, w = "" }) {
  return <th className={`p-3 font-bold whitespace-normal ${w}`}>{children}</th>;
}

function Td({ children, strong = false, wrap = "break-words" }) {
  const text =
    children == null ? "" : typeof children === "string" || typeof children === "number" ? String(children) : "";

  return (
    <td className={"p-3 whitespace-normal " + wrap + " " + (strong ? "font-semibold" : "")} title={text}>
      {children}
    </td>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  pattern,
  placeholder,
  openPickerOnClick = false,
}) {
  const inputRef = useRef(null);

  const maybeOpenPicker = () => {
    if (!openPickerOnClick) return;
    if (type !== "date") return;
    if (typeof inputRef.current?.showPicker === "function") {
      inputRef.current.showPicker();
    }
  };

  return (
    <div>
      <div className="text-sm font-semibold mb-1">{label}</div>
      <input
        ref={inputRef}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        inputMode={inputMode}
        pattern={pattern}
        placeholder={placeholder}
        onClick={maybeOpenPicker}
        onFocus={maybeOpenPicker}
        className={"w-full border rounded-lg px-3 py-2" + (type === "date" ? " cursor-pointer" : "")}
      />
    </div>
  );
}