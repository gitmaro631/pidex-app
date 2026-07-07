const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyD7mL96caMFNv6BxJDU21bLx2Xt9f78WI8',
  authDomain:        'pidex-quiz.firebaseapp.com',
  projectId:         'pidex-quiz',
  storageBucket:     'pidex-quiz.firebasestorage.app',
  messagingSenderId: '235433934182',
  appId:             '1:235433934182:web:272e11233e3a077728dca7',
};

let _db = null;

function getDb() {
  if (_db) return _db;
  if (typeof firebase === 'undefined') return null;
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  _db = firebase.firestore();
  return _db;
}

export async function backupWalletsToCloud(uid, wallets) {
  const db = getDb();
  if (!db || !uid) throw new Error('no_login');
  await db.collection('pidex_wallets').doc(uid).set({
    wallets,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function restoreWalletsFromCloud(uid) {
  const db = getDb();
  if (!db || !uid) throw new Error('no_login');
  const doc = await db.collection('pidex_wallets').doc(uid).get();
  if (!doc.exists) return null;
  return doc.data().wallets ?? null;
}

// hack_tracker에서 등록 요청한 pending 지갑 가져와 목록 반환 후 삭제
export async function importPendingWallets(username) {
  const db = getDb();
  if (!db || !username) return [];
  try {
    const docRef = db.collection('pidex_pending_wallets').doc(username);
    const doc    = await docRef.get();
    if (!doc.exists) return [];
    const wallets = doc.data().wallets ?? [];
    await docRef.delete();
    return wallets; // [{address, alias, addedAt}]
  } catch { return []; }
}
