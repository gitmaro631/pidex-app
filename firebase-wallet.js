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

// 공용 주소 별칭 사전 (주소당 별칭 하나, 두 앱 공유) — 등록/관리는 퀴즈파이 앱에서 통합 관리,
// 여기서는 읽기 + 이 앱에서 발생하는 등록 이벤트의 반영만 함
export async function fetchAddressAliases(username) {
  const db = getDb();
  if (!db || !username) return {};
  try {
    const doc = await db.collection('pidex_address_aliases').doc(username).get();
    return doc.exists ? (doc.data().aliases || {}) : {};
  } catch { return {}; }
}

export async function setAddressAlias(username, address, alias) {
  const db = getDb();
  if (!db || !username || !address) return;
  try {
    await db.collection('pidex_address_aliases').doc(username).set({
      aliases: { [address]: alias },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch { /* 실패해도 각 목록 자체의 alias로 표시되므로 무시 */ }
}

async function syncAddressAliasesFromList(username, list) {
  if (!username || !list?.length) return;
  const patch = {};
  for (const w of list) if (w.address && w.alias) patch[w.address] = w.alias;
  if (!Object.keys(patch).length) return;
  const db = getDb();
  if (!db) return;
  try {
    await db.collection('pidex_address_aliases').doc(username).set({
      aliases: patch,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch { /* 실패해도 무시 — 다음 저장 때 다시 시도됨 */ }
}

// 파이덱스앱 지갑 탭 (테스트넷) — 서버가 원본, pidex_wallets 컬렉션
export const PIDEX_WALLET_MAX = 30;

export async function fetchWalletsServer(username) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  const doc = await db.collection('pidex_wallets').doc(username).get();
  return doc.exists ? (doc.data().wallets || []) : [];
}

export async function saveWalletsServer(username, wallets) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  await db.collection('pidex_wallets').doc(username).set({
    wallets,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  await syncAddressAliasesFromList(username, wallets);
}

// MM 탭 — AMM 실계좌 LP 포지션 추적 (서버가 원본, pidex_lp_positions 컬렉션)
export const LP_POSITION_MAX = 20;

export async function fetchLpPositionsServer(username) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  const doc = await db.collection('pidex_lp_positions').doc(username).get();
  return doc.exists ? (doc.data().positions || []) : [];
}

export async function saveLpPositionsServer(username, positions) {
  const db = getDb();
  if (!db || !username) throw new Error('no_login');
  await db.collection('pidex_lp_positions').doc(username).set({
    positions,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
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
  await setAddressAlias(username, address, alias);
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
  await setAddressAlias(username, address, alias);
  return 'added';
}
