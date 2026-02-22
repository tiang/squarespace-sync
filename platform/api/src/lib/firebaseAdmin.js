const admin = require('firebase-admin');

// In local dev with the emulator, FIREBASE_AUTH_EMULATOR_HOST is set.
// In production, FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY are set.
if (!admin.apps.length) {
  const credential = process.env.FIREBASE_CLIENT_EMAIL
    ? admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    : admin.credential.applicationDefault();

  admin.initializeApp({ credential });
}

async function verifyIdToken(token) {
  return admin.auth().verifyIdToken(token);
}

module.exports = { verifyIdToken };
