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

// ── v2: 4개 원본 목록(내지갑/관심지갑/지갑별칭 등)은 이제 alias를 저장하지 않는다 ──
// 과거에 각 목록에 남아있던 alias를 문서 수정시각(updatedAt) 기준 오래된 것→최신 순으로 병합해
// 통합 보관소에 반영하고, 원본 4개 문서에서 alias 필드를 제거하는 1회성 정리 작업.
// pidex_quiz의 동일 함수와 짝을 이루며, 같은 migratedV2At 플래그를 공유해 두 앱 중 먼저 여는
// 쪽이 한 번만 실행한다.
export async function migrateAddressAliasesIfNeeded(username) {
  const db = getDb();
  if (!username || !db) return {};
  const ref = db.collection('pidex_address_aliases').doc(username);
  const snap = await ref.get();
  if (snap.exists && snap.data().migratedV2At) {
    return snap.data().aliases || {};
  }
  const merged = { ...(snap.exists ? (snap.data().aliases || {}) : {}) };
  try {
    const refs = {
      trade: db.collection('pidex_trade_wallets').doc(username),
      watch: db.collection('pidex_watch_list').doc(username),
      pidex: db.collection('pidex_wallets').doc(username),
      hack:  db.collection('hack_pending_wallets').doc(username),
    };
    const [tradeDoc, watchDoc, pidexDoc, hackDoc] = await Promise.all([
      refs.trade.get(), refs.watch.get(), refs.pidex.get(), refs.hack.get(),
    ]);
    const docs = {
      trade: { doc: tradeDoc, list: tradeDoc.exists ? (tradeDoc.data().mainnet || []) : [] },
      watch: { doc: watchDoc, list: watchDoc.exists ? (watchDoc.data().watchList || []) : [] },
      pidex: { doc: pidexDoc, list: pidexDoc.exists ? (pidexDoc.data().wallets || []) : [] },
      hack:  { doc: hackDoc,  list: hackDoc.exists  ? (hackDoc.data().wallets || [])  : [] },
    };
    const order = Object.entries(docs).sort((a, b) => {
      const ta = a[1].doc.exists ? (a[1].doc.data().updatedAt?.toMillis?.() ?? 0) : 0;
      const tb = b[1].doc.exists ? (b[1].doc.data().updatedAt?.toMillis?.() ?? 0) : 0;
      return ta - tb;
    });
    for (const [, { list }] of order) {
      for (const w of list) if (w.address && w.alias) merged[w.address] = w.alias;
    }

    const strip = (list) => list.map(w => { const { alias, ...rest } = w; return rest; });
    const writes = [];
    if (tradeDoc.exists) writes.push(refs.trade.set({ mainnet: strip(docs.trade.list) }, { merge: true }));
    if (watchDoc.exists) writes.push(refs.watch.set({ watchList: strip(docs.watch.list) }, { merge: true }));
    if (pidexDoc.exists) writes.push(refs.pidex.set({ wallets: strip(docs.pidex.list) }, { merge: true }));
    if (hackDoc.exists)  writes.push(refs.hack.set({ wallets: strip(docs.hack.list) }, { merge: true }));
    await Promise.all(writes);
  } catch { /* 마이그레이션 실패해도 이번 세션은 계속 진행 */ }

  try {
    await ref.set({ aliases: merged, migratedV2At: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  } catch { /* 저장 실패해도 이번 세션 메모리상 별칭은 사용 가능 */ }
  return merged;
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
  wallets.push({ id: `w${Date.now()}`, address });
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
