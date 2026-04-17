/**
 * Delete legacy trainingRecords docs.
 * Legacy = documents missing the "source" field (old importer).
 *
 * Usage:
 *   node delete-legacy-training-records.js --dry-run
 *   node delete-legacy-training-records.js
 */

import admin from "firebase-admin";

const DRY_RUN = process.argv.includes("--dry-run");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function main() {
  const col = db.collection("trainingRecords");

  let deleted = 0;
  let scanned = 0;

  console.log(DRY_RUN ? "🟡 DRY RUN (no deletes)" : "🔴 LIVE DELETE MODE");

  // Firestore batches max 500 ops
  let batch = db.batch();
  let batchOps = 0;

  // Pagination
  let lastDoc = null;

  while (true) {
    let q = col.orderBy(admin.firestore.FieldPath.documentId()).limit(400);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      scanned++;
      const data = docSnap.data() || {};

      const isLegacy = data.source == null; // missing source => legacy
      if (!isLegacy) continue;

      if (DRY_RUN) {
        console.log(`Would delete: ${docSnap.id}`);
      } else {
        batch.delete(docSnap.ref);
        batchOps++;
      }

      // Commit in chunks
      if (!DRY_RUN && batchOps >= 450) {
        await batch.commit();
        deleted += batchOps;
        console.log(`✅ Deleted batch of ${batchOps} (scanned ${scanned})`);
        batch = db.batch();
        batchOps = 0;
      }
    }

    lastDoc = snap.docs[snap.docs.length - 1];
  }

  if (!DRY_RUN && batchOps > 0) {
    await batch.commit();
    deleted += batchOps;
    console.log(`✅ Deleted final batch of ${batchOps}`);
  }

  console.log("--------------------------------------------------");
  console.log(`Scanned docs: ${scanned}`);
  console.log(DRY_RUN ? `Would delete: (see list above)` : `Deleted docs: ${deleted}`);
  console.log("Done.");
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
