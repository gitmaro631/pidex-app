import { setWalletTabVisible, showToast } from './app.js';

const PUB_KEY_STORAGE = 'stellar_pub_key';

export function renderSubscription(container) {
  const savedKey = localStorage.getItem(PUB_KEY_STORAGE) ?? '';

  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">정보 <span class="en">Info</span></h2>

      <div class="card about-card">
        <div class="card-title">앱 소개 <span class="en">About</span></div>
        ${[
          { icon: '📊', ko: '덱스 현황',    en: 'DEX Dashboard',    desc_ko: 'PiDEX 전체 풀·유동성·거래 현황을 한눈에 확인합니다.',                        desc_en: 'View pools, liquidity and trading activity at a glance.' },
          { icon: '🔄', ko: '차익 탐색',    en: 'Arbitrage Finder', desc_ko: '삼각차익 경로를 스캔하고 순 수익률을 시뮬레이션합니다. 무료 100회/일.',        desc_en: 'Scan arbitrage paths and simulate net return. Free 100×/day.' },
          { icon: '⇄',  ko: '스왑 시뮬레이터', en: 'Swap Simulator',   desc_ko: '예상 수령량·환율·수수료·가격충격을 미리 계산합니다.',                      desc_en: 'Preview receive amount, rate, fee and price impact.' },
          { icon: '💧', ko: 'LP 계산기',    en: 'LP Calculator',    desc_ko: '유동성 풀 예치 비율을 사전에 계산하고 풀 통계를 비교합니다.',                   desc_en: 'Calculate deposit ratios and compare pool statistics.' },
          { icon: '👛', ko: '지갑',         en: 'Wallet',           desc_ko: '공개주소(G...)를 등록하면 Pi 잔액·토큰·LP 예치 현황을 조회할 수 있습니다.',  desc_en: 'Register your public key to view Pi balance, tokens and LP positions.' },
          { icon: '↓',  ko: '새로고침',     en: 'Pull to Refresh',  desc_ko: '각 탭 최상단에서 아래로 드래그하면 데이터가 새로고침됩니다.',                   desc_en: 'Pull down from the top of any tab to refresh.' },
        ].map(f => `
          <div class="about-row">
            <span class="about-icon">${f.icon}</span>
            <div class="about-body">
              <div class="about-title">${f.ko} <span class="about-en">${f.en}</span></div>
              <div class="about-desc">${f.desc_ko}</div>
              <div class="about-desc about-desc-en">${f.desc_en}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card notice-card">
        <div class="notice-icon">🔍</div>
        <div class="notice-body">
          <div class="notice-title">시뮬레이션 전용 <span class="en">Simulation Only</span></div>
          <div class="notice-desc">이 앱은 분석·시뮬레이션 도구입니다. 실제 거래는 Pi Browser의 PiDEX에서 직접 진행해주세요.<br>
          <span class="en">This app is for analysis only. Execute trades on PiDEX in Pi Browser.</span></div>
        </div>
      </div>

      <div class="card pubkey-card">
        <div class="card-title">지갑 공개주소 등록 <span class="en">Register Wallet Address</span></div>
        <p class="info-desc" style="margin-bottom:12px;">
          Pi 지갑의 공개주소(G로 시작, 56자리)를 등록하면 <strong>지갑 탭</strong>이 활성화됩니다.<br>
          총 보유 Pi, 토큰 잔액, LP 예치 현황 등 세세한 지갑 정보를 확인할 수 있습니다.<br>
          공개주소는 읽기 전용으로 안전합니다.<br>
          <span class="en">Register your public key to activate the Wallet tab and view Pi balance, tokens, and LP positions. Public key is read-only and safe.</span>
        </p>
        ${savedKey
          ? `<div class="pubkey-registered">
               <span class="pubkey-addr">${savedKey.slice(0,10)}...${savedKey.slice(-8)}</span>
               <span class="badge badge-good">등록됨 Active</span>
             </div>
             <button class="btn-outline btn-sm" id="btn-remove-pubkey" style="margin-top:10px;color:var(--red);border-color:var(--red);">
               주소 삭제 Remove
             </button>`
          : `<div class="key-input-row">
               <input type="text" class="form-input" id="pubkey-input"
                 placeholder="GXXXX... (56자리 공개주소)" style="font-size:12px;" />
               <button class="btn-primary btn-sm" id="btn-save-pubkey" style="width:auto;white-space:nowrap;">
                 등록 Add
               </button>
             </div>`
        }
      </div>

      <div class="contact-card">
        <div class="contact-title">문의 및 피드백 <span class="en">Contact &amp; Feedback</span></div>
        <p class="contact-desc">
          사용 중 문의사항이나 피드백은 유튜브 채널 댓글로 남겨주세요.<br>
          <span class="en">Leave questions or feedback in the YouTube channel comments.</span>
        </p>
        <div class="youtube-link">
          <span class="yt-icon">▶</span>
          <span class="yt-text">
            <span class="yt-label">Hidden Strokes</span>
            <span class="yt-sub">youtube.com/@hiddenstrokes-j5w</span>
          </span>
        </div>
        <div class="copy-url-row">
          <span class="copy-url-text" id="yt-url-text">youtube.com/@hiddenstrokes-j5w</span>
          <button class="btn-outline btn-sm" id="btn-copy-yt" style="width:auto;white-space:nowrap;">복사 Copy</button>
        </div>
        <p class="contact-desc" style="margin-top:6px;font-size:11px;">
          위 주소를 복사 후 유튜브에서 검색해주세요.<br>
          <span class="en">Copy the URL and search in YouTube.</span>
        </p>
      </div>
    </div>
  `;


  container.querySelector('#btn-copy-yt').addEventListener('click', () => {
    navigator.clipboard.writeText('youtube.com/@hiddenstrokes-j5w').then(() => {
      const btn = container.querySelector('#btn-copy-yt');
      btn.textContent = '복사됨 Copied!';
      setTimeout(() => { btn.textContent = '복사 Copy'; }, 2000);
    });
  });

  if (savedKey) {
    container.querySelector('#btn-remove-pubkey').addEventListener('click', () => {
      localStorage.removeItem(PUB_KEY_STORAGE);
      setWalletTabVisible(false);
      showToast('공개주소가 삭제되었습니다.', 'success');
      renderSubscription(container);
    });
  } else {
    container.querySelector('#btn-save-pubkey').addEventListener('click', () => {
      const val = container.querySelector('#pubkey-input').value.trim();
      if (!val.startsWith('G') || val.length !== 56) {
        showToast('G로 시작하는 56자리 공개주소를 입력해주세요.', 'error');
        return;
      }
      localStorage.setItem(PUB_KEY_STORAGE, val);
      setWalletTabVisible(true);
      showToast('등록 완료! 지갑 탭이 활성화됩니다.', 'success');
      renderSubscription(container);
    });
  }
}
