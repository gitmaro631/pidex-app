// Pi SDK 초기화 및 래퍼

export let currentUser = null;

export function initPiSDK() {
  Pi.init({ version: '2.0', sandbox: true }); // 테스트넷: sandbox: true
}

export async function authenticate() {
  return new Promise((resolve, reject) => {
    Pi.authenticate(
      ['username', 'payments'],
      onIncompletePaymentFound
    )
      .then(auth => {
        currentUser = auth.user;
        resolve(auth);
      })
      .catch(reject);
  });
}

function onIncompletePaymentFound(payment) {
  // 미완료 결제 처리 — 서버 검증이 있으면 여기서 complete 호출
  console.warn('미완료 결제 발견:', payment.identifier);
}

export async function createSubscriptionPayment() {
  return new Promise((resolve, reject) => {
    Pi.createPayment(
      {
        amount: 1,
        memo: 'PiDEX 유틸 무제한 구독 (1개월)',
        metadata: { type: 'subscription', months: 1 },
      },
      {
        onReadyForServerApproval(paymentId) {
          // 실제 서비스에서는 서버에 paymentId 전달 후 승인 처리
          // 테스트넷에서는 클라이언트 측에서 바로 승인
          console.log('결제 승인 대기:', paymentId);
        },
        onReadyForServerCompletion(paymentId, txid) {
          // 결제 완료 — 구독 상태 저장
          resolve({ paymentId, txid });
        },
        onCancel(paymentId) {
          reject(new Error('결제 취소됨'));
        },
        onError(error, payment) {
          reject(error);
        },
      }
    );
  });
}
