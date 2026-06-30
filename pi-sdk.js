export let currentUser = null;

export function initPiSDK() {
  Pi.init({ version: '2.0', sandbox: true });
}

export async function authenticate() {
  return new Promise((resolve, reject) => {
    Pi.authenticate(['username', 'payments'], onIncompletePaymentFound)
      .then(auth => { currentUser = auth.user; resolve(auth); })
      .catch(reject);
  });
}

function onIncompletePaymentFound(payment) {
  console.warn('미완료 결제 발견:', payment.identifier);
}

export function createDonation(amount) {
  if (typeof Pi === 'undefined') {
    return Promise.reject(new Error('Pi SDK를 찾을 수 없어요. Pi Browser에서 실행해주세요.'));
  }
  return new Promise((resolve, reject) => {
    Pi.createPayment(
      { amount, memo: `pidex 유틸 후원 ${amount}π`, metadata: { app: 'pidex_util', type: 'donation' } },
      {
        onReadyForServerApproval: (paymentId) => { console.log('[Donation] approval:', paymentId); },
        onReadyForServerCompletion: (paymentId, txid) => { resolve({ paymentId, txid }); },
        onCancel: () => reject(new Error('cancelled')),
        onError: (err) => reject(err),
      }
    );
  });
}

export async function createSubscriptionPayment() {
  return new Promise((resolve, reject) => {
    Pi.createPayment(
      { amount: 1, memo: 'PiDEX 유틸 무제한 구독 (1개월)', metadata: { type: 'subscription' } },
      {
        onReadyForServerApproval(paymentId) { console.log('결제 승인 대기:', paymentId); },
        onReadyForServerCompletion(paymentId, txid) { resolve({ paymentId, txid }); },
        onCancel() { reject(new Error('결제 취소됨')); },
        onError(error) { reject(error); },
      }
    );
  });
}
