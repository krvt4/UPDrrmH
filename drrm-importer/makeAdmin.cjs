const admin = require("firebase-admin");
const path = require("path");

// Load your service account
admin.initializeApp({
  credential: admin.credential.cert(
    require(path.join(__dirname, "./serviceAccountKey.json"))
  ),
});

const db = admin.firestore();

async function makeAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);

    await db.collection("users").doc(user.uid).set(
      {
        email,
        role: "admin",
        status: "approved",
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ Admin successfully bootstrapped:", email);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

const emailArg = process.argv[2];
if (!emailArg) {
  console.log("Usage: node makeAdmin.js <email>");
  process.exit(1);
}

makeAdmin(emailArg);
