export let currentUser = null;
export let currentAccessToken = null;

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyD7mL96caMFNv6BxJDU21bLx2Xt9f78WI8',
  authDomain:        'pidex-quiz.firebaseapp.com',
  projectId:         'pidex-quiz',
  storageBucket:     'pidex-quiz.firebasestorage.app',
  messagingSenderId: '235433934182',
  appId:             '1:235433934182:web:272e11233e3a077728dca7',
};

// Pi accessToken을 서버에서 검증받아 Firebase 커스텀 토큰으로 교환 후 로그인
// — 이 로그인이 끝나야 Firestore 보안규칙의 request.auth가 채워짐
async function signInFirebase(accessToken) {
  try {
    if (typeof firebase === 'undefined') return;
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    const res = await fetch('/api/firebase-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });
    if (!res.ok) return;
    const { token } = await res.json();
    if (token) await firebase.auth().signInWithCustomToken(token);
  } catch { /* 실패해도 로그인 자체는 진행 — Firestore 호출은 이후 실패할 수 있음 */ }
}

async function serverApprove(paymentId) {
  const res = await fetch('/api/payments/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
  if (!res.ok) throw new Error(`approve failed: ${res.status}`);
}

async function serverComplete(paymentId, txid, username) {
  const res = await fetch('/api/payments/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, txid, username }),
  });
  if (!res.ok) throw new Error(`complete failed: ${res.status}`);
}

async function syncSubscription(username) {
  try {
    const res = await fetch(`/api/subscription/status?username=${encodeURIComponent(username)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.active && data.expiry) {
      localStorage.setItem('sub_expiry', data.expiry);
      window.dispatchEvent(new CustomEvent('sub:synced'));
    } else if (!data.active) {
      // 서버에 없고 로컬에 유효한 구독이 있으면 서버에 등록 (마이그레이션)
      const localExpiry = localStorage.getItem('sub_expiry');
      if (localExpiry && new Date(localExpiry) > new Date()) {
        await fetch('/api/subscription/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: currentAccessToken, expiry: localExpiry }),
        });
        const confirm = await fetch(`/api/subscription/status?username=${encodeURIComponent(username)}`).then(r => r.json());
        if (confirm.active && confirm.expiry) {
          localStorage.setItem('sub_expiry', confirm.expiry);
          window.dispatchEvent(new CustomEvent('sub:synced'));
        }
      }
    }
  } catch { /* 실패 시 localStorage 그대로 유지 */ }
}

async function onIncompletePaymentFound(payment) {
  console.warn('미완료 결제 처리 중:', payment.identifier);
  try {
    if (payment.transaction == null) {
      await serverApprove(payment.identifier);
    } else {
      await serverComplete(payment.identifier, payment.transaction.txid);
    }
  } catch (err) {
    console.error('미완료 결제 처리 실패:', err);
  }
}

export async function initPiSDK() {
  await Pi.init({ version: '2.0', sandbox: true });
}

export async function authenticate() {
  return new Promise((resolve, reject) => {
    Pi.authenticate(['username', 'payments', 'wallet_address'], onIncompletePaymentFound)
      .then(async auth => {
        currentUser = auth.user;
        currentAccessToken = auth.accessToken ?? null;

        // wallet_address가 없으면 서버에서 조회 (테스트넷 제한)
        if (!auth.user?.wallet_address && auth.accessToken) {
          try {
            const r = await fetch('/api/user/wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: auth.accessToken }),
            });
            const d = await r.json();
            if (d.wallet_address) {
              currentUser = { ...auth.user, wallet_address: d.wallet_address };
              localStorage.setItem('stellar_pub_key', d.wallet_address);
            }
          } catch { /* 실패 시 무시 */ }
        }

        const username = currentUser?.username;
        if (username) syncSubscription(username);
        if (currentAccessToken) await signInFirebase(currentAccessToken);
        resolve(auth);
      })
      .catch(reject);
  });
}

export function createDonation(amount) {
  if (typeof Pi === 'undefined') {
    return Promise.reject(new Error('Pi SDK를 찾을 수 없어요. Pi Browser에서 실행해주세요.'));
  }
  return new Promise((resolve, reject) => {
    Pi.createPayment(
      {
        amount,
        memo: `pidex 유틸 후원 ${amount}π`,
        metadata: { app: 'pidex_util', type: 'donation' },
      },
      {
        onReadyForServerApproval: async (paymentId) => {
          try { await serverApprove(paymentId); } catch (err) { reject(err); }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try { await serverComplete(paymentId, txid); resolve({ paymentId, txid }); } catch (err) { reject(err); }
        },
        onCancel: () => reject(new Error('cancelled')),
        onError: (err) => reject(err),
      }
    );
  });
}

export async function createSubscriptionPayment() {
  if (typeof Pi === 'undefined') {
    return Promise.reject(new Error('Pi SDK를 찾을 수 없어요. Pi Browser에서 실행해주세요.'));
  }
  return new Promise((resolve, reject) => {
    Pi.createPayment(
      { amount: 1, memo: 'PiDEX 유틸 1개월 이용권', metadata: { app: 'pidex_util', type: 'subscription' } },
      {
        onReadyForServerApproval: async (paymentId) => {
          try { await serverApprove(paymentId); } catch (err) { reject(err); }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try { await serverComplete(paymentId, txid, currentUser?.username); resolve({ paymentId, txid }); } catch (err) { reject(err); }
        },
        onCancel: () => reject(new Error('cancelled')),
        onError: (err) => reject(err),
      }
    );
  });
}
