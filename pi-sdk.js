export let currentUser = null;

async function serverApprove(paymentId) {
  const res = await fetch('/api/payments/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
  if (!res.ok) throw new Error(`approve failed: ${res.status}`);
}

async function serverComplete(paymentId, txid, walletAddress) {
  const res = await fetch('/api/payments/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, txid, walletAddress }),
  });
  if (!res.ok) throw new Error(`complete failed: ${res.status}`);
}

async function syncSubscription(walletAddress) {
  try {
    const res = await fetch(`/api/subscription/status?wallet=${encodeURIComponent(walletAddress)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.active && data.expiry) {
      // Redis에 유효한 기록 → localStorage 갱신
      localStorage.setItem('sub_expiry', data.expiry);
    } else if (!data.active) {
      const localExpiry = localStorage.getItem('sub_expiry');
      if (localExpiry && new Date(localExpiry) > new Date()) {
        // Redis에 없지만 localStorage에 유효한 이용권 → Redis에 업로드
        await fetch('/api/subscription/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: walletAddress, expiry: localExpiry }),
        });
        const confirm = await fetch(`/api/subscription/status?wallet=${encodeURIComponent(walletAddress)}`).then(r => r.json());
        if (confirm.active && confirm.expiry) localStorage.setItem('sub_expiry', confirm.expiry);
      } else {
        // 둘 다 없거나 만료 → localStorage 제거
        localStorage.removeItem('sub_expiry');
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

        // SDK가 wallet_address를 안 주면 서버에서 조회
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

        if (currentUser?.wallet_address) await syncSubscription(currentUser.wallet_address);
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
          try { await serverComplete(paymentId, txid, currentUser?.wallet_address); resolve({ paymentId, txid }); } catch (err) { reject(err); }
        },
        onCancel: () => reject(new Error('cancelled')),
        onError: (err) => reject(err),
      }
    );
  });
}
