// 구독 페이지

import { createSubscriptionPayment } from '../pi-sdk.js';
import { isSubscribed, setSubscription, getSubscriptionExpiry, remainingFreeUses } from '../utils/storage.js';
import { showLoading, hideLoading, showToast } from '../app.js';

export function renderSubscription(container) {
  const subscribed = isSubscribed();
  const expiry     = getSubscriptionExpiry();
  const remaining  = remainingFreeUses();

  container.innerHTML = `
    <div class="card">
      <div class="card-title">구독 현황</div>
      ${subscribed
        ? `<div style="color:var(--green);font-size:16px;font-weight:600;">무제한 구독 중</div>
           <div style="color:var(--text2);font-size:13px;margin-top:4px;">만료: ${new Date(expiry).toLocaleDateString()}</div>`
        : `<div style="color:var(--yellow);font-size:15px;font-weight:600;">무료 플랜</div>
           <div style="color:var(--text2);font-size:13px;margin-top:4px;">오늘 차익거래 탐색 ${remaining}회 남음</div>`
      }
    </div>

    <!-- 플랜 비교 -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div class="sub-plan">
        <div style="font-size:13px;color:var(--text2);">무료</div>
        <div class="sub-plan-price" style="color:var(--text2);">0 Pi</div>
        <ul style="font-size:12px;color:var(--text2);text-align:left;padding-left:16px;margin-top:8px;">
          <li>차익 탐색 3회/일</li>
          <li>LP 예치 도우미</li>
          <li>스왑</li>
          <li>지갑 대시보드</li>
        </ul>
      </div>
      <div class="sub-plan ${subscribed ? 'active' : ''}">
        <div style="font-size:13px;color:var(--accent);">무제한</div>
        <div class="sub-plan-price">1 Pi<span style="font-size:14px;">/월</span></div>
        <ul style="font-size:12px;color:var(--text2);text-align:left;padding-left:16px;margin-top:8px;">
          <li>차익 탐색 <strong style="color:var(--text);">무제한</strong></li>
          <li>LP 예치 도우미</li>
          <li>스왑</li>
          <li>지갑 대시보드</li>
        </ul>
      </div>
    </div>

    ${subscribed
      ? `<button class="btn-outline" disabled>구독 중</button>`
      : `<button class="btn-primary" id="btn-subscribe">1 테스트 Pi로 구독하기</button>`
    }

    <p style="color:var(--text2);font-size:11px;margin-top:12px;text-align:center;">
      테스트넷 전용 · 실제 Pi 사용 없음
    </p>
  `;

  if (!subscribed) {
    container.querySelector('#btn-subscribe').addEventListener('click', () => handleSubscribe(container));
  }
}

async function handleSubscribe(container) {
  showLoading('Pi 결제 처리 중...');
  try {
    const { paymentId, txid } = await createSubscriptionPayment();
    setSubscription(1);
    hideLoading();
    showToast('구독 완료! 이제 무제한으로 탐색할 수 있습니다.', 'success');
    renderSubscription(container); // 페이지 갱신
  } catch (e) {
    hideLoading();
    showToast(e.message === '결제 취소됨' ? '결제가 취소되었습니다.' : '결제 실패. 다시 시도해주세요.', 'error');
  }
}
