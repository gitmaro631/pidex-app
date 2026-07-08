const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyD7mL96caMFNv6BxJDU21bLx2Xt9f78WI8',
  authDomain:        'pidex-quiz.firebaseapp.com',
  projectId:         'pidex-quiz',
  storageBucket:     'pidex-quiz.firebasestorage.app',
  messagingSenderId: '235433934182',
  appId:             '1:235433934182:web:272e11233e3a077728dca7',
};

let _db = null;

export function getDb() {
  if (_db) return _db;
  if (typeof firebase === 'undefined') return null;
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  _db = firebase.firestore();
  return _db;
}

export async function backupWalletsToCloud(username, wallets) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  await db.collection('pidex_wallets').doc(username).set({
    wallets,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function restoreWalletsFromCloud(username) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  const doc = await db.collection('pidex_wallets').doc(username).get();
  if (!doc.exists) return null;
  return doc.data().wallets ?? null;
}

// pidex_app → hack_tracker 관심주소 등록
export async function registerInHackWatch(username, address, alias) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  const docRef = db.collection('hack_pending_watch').doc(username);
  const doc    = await docRef.get();
  const wallets = doc.exists ? (doc.data().wallets || []) : [];
  if (!wallets.some(w => w.address === address)) {
    wallets.push({ address, alias, addedAt: Date.now() });
    await docRef.set({ wallets });
  }
}

// pidex_app → hack_tracker 내 지갑 등록
export async function registerInHackWallet(username, address, alias) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  const docRef = db.collection('hack_pending_wallets').doc(username);
  const doc    = await docRef.get();
  const wallets = doc.exists ? (doc.data().wallets || []) : [];
  if (!wallets.some(w => w.address === address)) {
    wallets.push({ address, alias, addedAt: Date.now() });
    await docRef.set({ wallets });
  }
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
