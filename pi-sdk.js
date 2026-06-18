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
