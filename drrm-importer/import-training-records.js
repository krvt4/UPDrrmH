import fs from "fs";
import path from "path";
import process from "process";
import crypto from "crypto";
import admin from "firebase-admin";
import { parse } from "csv-parse/sync";

// ---------- Helpers ----------
const normalize = (s) => String(s ?? "").trim();
const normalizeLower = (s) => normalize(s).toLowerCase();

const makeNameKey = (firstName, lastName) =>
  `${normalizeLower(firstName)}|${normalizeLower(lastName)}`;

const toNumberOrNull = (val) => {
  const s = normalize(val);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const cleanKey = (k) =>
  String(k ?? "").replace(/^\uFEFF/, "").trim().toLowerCase();

const pick = (row, ...keys) => {
  const normalizedRow = {};
  for (const k of Object.keys(row)) {
    normalizedRow[cleanKey(k)] = row[k];
  }
  for (const k of keys) {
    const v = normalizedRow[cleanKey(k)];
    if (v !== undefined) return v;
  }
  return "";
};

// ✅ Firestore doc IDs cannot contain "/" (and it’s safer to sanitize the whole string)
const safeDocId = (id) => {
  let s = normalize(id);
  // turn any slashes into hyphens
  s = s.replaceAll("/", "-");
  // also remove leading/trailing whitespace just in case
  s = s.trim();
  return s;
};

const sha1 = (text) =>
  crypto.createHash("sha1").update(text, "utf8").digest("hex");

const buildFallbackId = (obj) => {
  const parts = [
    obj.serialNumber,
    obj.trainingDate,
    obj.lastName,
    obj.firstName,
    obj.middleInitial,
    obj.agency,
    obj.department,
    obj.position,
    obj.source,
    obj.nameKey,
  ].map((x) => normalizeLower(x));

  return `row_${sha1(parts.join("|"))}`;
};

// ---------- Firebase Admin ----------
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();

// ---------- MAIN ----------
async function importCsv(csvPath) {
  const absPath = path.resolve(csvPath);

  // ✅ determine source label from filename
  const fileBase = path.basename(csvPath).toLowerCase();
  const source = fileBase.includes("mci") ? "MCI" : "BERTST";

  if (!fs.existsSync(absPath)) {
    console.error(`❌ Missing file: ${absPath}`);
    return;
  }

  const rows = parse(fs.readFileSync(absPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  console.log(`📄 ${source}: ${rows.length} rows`);

  const col = db.collection("trainingRecords");
  let batch = db.batch();
  let ops = 0;

  const commit = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];

    const serialNumber = normalize(pick(r, "Serial Number"));
    const trainingDate = normalize(pick(r, "Training Date"));
    const lastName = normalize(pick(r, "Last Name"));
    const firstName = normalize(pick(r, "First Name"));
    const middleInitial = normalize(pick(r, "Middle Initial"));
    const agency = normalize(pick(r, "Agency"));
    const department = normalize(pick(r, "Department"));
    const position = normalize(pick(r, "Position"));

    const preTestScore = toNumberOrNull(pick(r, "Pre-test Score"));
    const postTestScore = toNumberOrNull(
      pick(r, "Post test Score", "Post-test Score", "Post-test score")
    );

    // skip empty name rows
    if (!firstName && !lastName) continue;

    const nameKey = makeNameKey(firstName, lastName);

    const payload = {
      serialNumber: serialNumber || null,
      trainingDate: trainingDate || null,
      lastName: lastName || null,
      firstName: firstName || null,
      middleInitial: middleInitial || null,
      agency: agency || null,
      department: department || null,
      position: position || null,
      preTestScore,
      postTestScore,
      nameKey,
      source, // ✅ NEW
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // ✅ Doc ID strategy (safe for duplicates + safe for slashes)
    let rawDocId = "";
    if (serialNumber) {
      // keep serialNumber but avoid overwriting between sources & people w/ same SN
      rawDocId = `${serialNumber}_${source}_${nameKey}`;
    } else {
      rawDocId = buildFallbackId({ ...payload, source });
    }

    const docId = safeDocId(rawDocId);

    if (!docId) continue;

    batch.set(col.doc(docId), payload, { merge: true });
    ops++;

    if (ops >= 450) await commit();
  }

  await commit();
  console.log(`✅ Imported ${source}`);
}

async function main() {
  const files = process.argv.slice(2);

  if (!files.length) {
    console.error("❌ Please provide CSV files");
    process.exit(1);
  }

  for (const f of files) {
    await importCsv(f);
  }

  console.log("🎉 ALL IMPORTS COMPLETE");
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
