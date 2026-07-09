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

// pidex_app → hack_tracker 관심주소 등록 (서버가 원본 — pidex_watch_list 직접 갱신)
export const HACK_WATCH_MAX  = 10;
export const HACK_WALLET_MAX = 30;

export async function registerInHackWatch(username, address, alias) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  const docRef = db.collection('pidex_watch_list').doc(username);
  const doc     = await docRef.get();
  const wallets = doc.exists ? (doc.data().watchList || []) : [];
  if (wallets.some(w => w.address === address)) return 'duplicate';
  if (wallets.length >= HACK_WATCH_MAX) return 'full';
  wallets.push({ id: `w${Date.now()}`, address, alias });
  await docRef.set({ watchList: wallets, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  return 'added';
}

// pidex_app → hack_tracker 내 지갑 등록 (서버가 원본 — hack_pending_wallets 직접 갱신)
export async function registerInHackWallet(username, address, alias) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  const docRef = db.collection('hack_pending_wallets').doc(username);
  const doc     = await docRef.get();
  const wallets = doc.exists ? (doc.data().wallets || []) : [];
  if (wallets.some(w => w.address === address)) return 'duplicate';
  if (wallets.length >= HACK_WALLET_MAX) return 'full';
  wallets.push({ id: `h${Date.now()}`, address, alias, addedAt: Date.now() });
  await docRef.set({ wallets, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  return 'added';
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
