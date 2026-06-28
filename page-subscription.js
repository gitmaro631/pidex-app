import { setWalletTabVisible, showToast } from './app.js';
import { t } from './i18n.js';

const PUB_KEY_STORAGE = 'stellar_pub_key';

const FEATURES = [
  { icon: '📊', ko: '덱스 현황',       en: 'DEX Dashboard',    id: 'Ringkasan DEX',
    desc_ko: 'PiDEX 전체 풀·유동성·거래 현황을 한눈에 확인합니다.',
    desc_en: 'View pools, liquidity and trading activity at a glance.',
    desc_id: 'Lihat pool, likuiditas, dan aktivitas trading PiDEX sekilas.' },
  { icon: '🔄', ko: '차익 탐색',       en: 'Arbitrage Finder', id: 'Pencarian Arbitrase',
    desc_ko: '삼각차익 경로를 스캔하고 순 수익률을 시뮬레이션합니다. 무료 100회/일.',
    desc_en: 'Scan arbitrage paths and simulate net return. Free 100×/day.',
    desc_id: 'Pindai jalur arbitrase dan simulasikan return bersih. Gratis 100×/hari.' },
  { icon: '⇄',  ko: '스왑 시뮬레이터', en: 'Swap Simulator',   id: 'Simulator Swap',
    desc_ko: '예상 수령량·환율·수수료·가격충격을 미리 계산합니다.',
    desc_en: 'Preview receive amount, rate, fee and price impact.',
    desc_id: 'Pratinjau jumlah diterima, kurs, biaya, dan dampak harga.' },
  { icon: '💧', ko: 'LP 계산기',       en: 'LP Calculator',    id: 'Kalkulator LP',
    desc_ko: '유동성 풀 예치 비율을 사전에 계산하고 풀 통계를 비교합니다.',
    desc_en: 'Calculate deposit ratios and compare pool statistics.',
    desc_id: 'Hitung rasio deposit dan bandingkan statistik pool.' },
  { icon: '👛', ko: '지갑',            en: 'Wallet',           id: 'Dompet',
    desc_ko: '공개주소(G...)를 등록하면 Pi 잔액·토큰·LP 예치 현황을 조회할 수 있습니다.',
    desc_en: 'Register your public key to view Pi balance, tokens and LP positions.',
    desc_id: 'Daftarkan kunci publik untuk melihat saldo Pi, token, dan posisi LP.' },
  { icon: '↓',  ko: '새로고침',        en: 'Pull to Refresh',  id: 'Tarik untuk Refresh',
    desc_ko: '각 탭 최상단에서 아래로 드래그하면 데이터가 새로고침됩니다.',
    desc_en: 'Pull down from the top of any tab to refresh.',
    desc_id: 'Tarik ke bawah dari atas tab mana pun untuk memperbarui data.' },
];

export function renderSubscription(container) {
  const savedKey = localStorage.getItem(PUB_KEY_STORAGE) ?? '';
  const lang = localStorage.getItem('pidex_lang') || 'ko';

  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">${t('info_title')}</h2>

      <div class="card about-card">
        <div class="card-title">${t('info_about')}</div>
        ${FEATURES.map(f => `
          <div class="about-row">
            <span class="about-icon">${f.icon}</span>
            <div class="about-body">
              <div class="about-title">${f[lang] ?? f.ko}</div>
              <div class="about-desc">${f[`desc_${lang}`] ?? f.desc_ko}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card notice-card">
        <div class="notice-icon">🔍</div>
        <div class="notice-body">
          <div class="notice-title">${t('info_notice')}</div>
          <div class="notice-desc">${t('info_notice_desc')}</div>
        </div>
      </div>

      <div class="card pubkey-card">
        <div class="card-title">${t('info_pubkey')}</div>
        <p class="info-desc" style="margin-bottom:12px;">${t('info_pubkey_desc').replace(/\n/g, '<br>')}</p>
        ${savedKey
          ? `<div class="pubkey-registered">
               <span class="pubkey-addr">${savedKey.slice(0,10)}...${savedKey.slice(-8)}</span>
               <span class="badge badge-good">${t('info_registered')}</span>
             </div>
             <button class="btn-outline btn-sm" id="btn-remove-pubkey" style="margin-top:10px;color:var(--red);border-color:var(--red);">
               ${t('info_remove_key')}
             </button>`
          : `<div class="key-input-row">
               <input type="text" class="form-input" id="pubkey-input"
                 placeholder="${t('info_key_ph')}" style="font-size:12px;" />
               <button class="btn-primary btn-sm" id="btn-save-pubkey" style="width:auto;white-space:nowrap;">
                 ${t('info_save_key')}
               </button>
             </div>`
        }
      </div>

      <div class="contact-card">
        <div class="contact-title">${t('info_contact')}</div>
        <p class="contact-desc">${t('info_contact_desc')}</p>
        <div class="youtube-link">
          <span class="yt-icon">▶</span>
          <span class="yt-text">
            <span class="yt-label">Hidden Strokes</span>
            <span class="yt-sub">youtube.com/@hiddenstrokes-j5w</span>
          </span>
        </div>
        <div class="copy-url-row">
          <span class="copy-url-text" id="yt-url-text">youtube.com/@hiddenstrokes-j5w</span>
          <button class="btn-outline btn-sm" id="btn-copy-yt" style="width:auto;white-space:nowrap;">${t('info_copy')}</button>
        </div>
        <p class="contact-desc" style="margin-top:6px;font-size:11px;">${t('info_copy_note')}</p>
      </div>
    </div>
  `;

  container.querySelector('#btn-copy-yt').addEventListener('click', () => {
    navigator.clipboard.writeText('youtube.com/@hiddenstrokes-j5w').then(() => {
      const btn = container.querySelector('#btn-copy-yt');
      btn.textContent = t('info_copied');
      setTimeout(() => { btn.textContent = t('info_copy'); }, 2000);
    });
  });

  if (savedKey) {
    container.querySelector('#btn-remove-pubkey').addEventListener('click', () => {
      localStorage.removeItem(PUB_KEY_STORAGE);
      setWalletTabVisible(false);
      showToast(t('info_key_removed'), 'success');
      renderSubscription(container);
    });
  } else {
    container.querySelector('#btn-save-pubkey').addEventListener('click', () => {
      const val = container.querySelector('#pubkey-input').value.trim();
      if (!val.startsWith('G') || val.length !== 56) {
        showToast(t('info_key_invalid'), 'error');
        return;
      }
      localStorage.setItem(PUB_KEY_STORAGE, val);
      setWalletTabVisible(true);
      showToast(t('info_key_saved'), 'success');
      renderSubscription(container);
    });
  }
}
