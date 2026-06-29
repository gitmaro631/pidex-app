import { setWalletTabVisible, showToast } from './app.js';
import { t } from './i18n.js';

const PUB_KEY_STORAGE = 'stellar_pub_key';

const FEATURES = [
  { icon: '📊',
    ko: '덱스 현황',       en: 'DEX Dashboard',    id: 'Ringkasan DEX',      zh: 'DEX 概览',        ja: 'DEX 概況',              es: 'Panel DEX',             vi: 'Tổng quan DEX',       hi: 'DEX डैशबोर्ड',    pt: 'Painel DEX',          tl: 'DEX Dashboard',          fr: 'Tableau de bord DEX',
    desc_ko: 'PiDEX 전체 풀·유동성·거래 현황을 한눈에 확인합니다.',
    desc_en: 'View pools, liquidity and trading activity at a glance.',
    desc_id: 'Lihat pool, likuiditas, dan aktivitas trading PiDEX sekilas.',
    desc_zh: 'PiDEX 全部池、流动性及交易状况一目了然。',
    desc_ja: 'PiDEX の全プール・流動性・取引状況を一覧で確認できます。',
    desc_es: 'Visualice pools, liquidez y actividad de trading de PiDEX de un vistazo.',
    desc_vi: 'Xem tổng quan về pool, thanh khoản và hoạt động giao dịch của PiDEX.',
    desc_hi: 'PiDEX के सभी पूल, तरलता और ट्रेडिंग गतिविधि एक नज़र में देखें।',
    desc_pt: 'Visualize pools, liquidez e atividade de trading do PiDEX de relance.',
    desc_tl: 'Tingnan ang mga pool, liquidity at aktibidad ng trading ng PiDEX sa isang tingin.',
    desc_fr: 'Visualisez les pools, la liquidité et l\'activité de trading PiDEX d\'un coup d\'œil.' },
  { icon: '🔄',
    ko: '차익 탐색',       en: 'Arbitrage Finder', id: 'Pencarian Arbitrase', zh: '套利查找',        ja: 'アービトラージ探索',     es: 'Buscador de Arbitraje', vi: 'Tìm kiếm Arbitrage',  hi: 'आर्बिट्राज खोजक',pt: 'Buscador de Arbitragem', tl: 'Arbitrage Finder',       fr: "Recherche d'Arbitrage",
    desc_ko: '삼각차익 경로를 스캔하고 순 수익률을 시뮬레이션합니다. 무료 100회/일.',
    desc_en: 'Scan arbitrage paths and simulate net return. Free 100×/day.',
    desc_id: 'Pindai jalur arbitrase dan simulasikan return bersih. Gratis 100×/hari.',
    desc_zh: '扫描三角套利路径并模拟净收益率。免费 100次/天。',
    desc_ja: '三角アービトラージ経路をスキャンし純収益率をシミュレートします。無料100回/日。',
    desc_es: 'Escanea rutas de arbitraje triangular y simula el retorno neto. Gratis 100×/día.',
    desc_vi: 'Quét các đường đi arbitrage tam giác và mô phỏng lợi nhuận ròng. Miễn phí 100×/ngày.',
    desc_hi: 'त्रिकोण आर्बिट्राज रास्ते स्कैन करें और शुद्ध रिटर्न सिमुलेट करें। मुफ्त 100×/दिन।',
    desc_pt: 'Varre caminhos de arbitragem triangular e simula o retorno líquido. Grátis 100×/dia.',
    desc_tl: 'I-scan ang mga triangular arbitrage path at i-simulate ang net return. Libre 100×/araw.',
    desc_fr: 'Scanne les chemins d\'arbitrage triangulaire et simule le retour net. Gratuit 100×/jour.' },
  { icon: '⇄',
    ko: '스왑 시뮬레이터', en: 'Swap Simulator',   id: 'Simulator Swap',      zh: '兑换模拟器',      ja: 'スワップシミュレーター', es: 'Simulador de Swap',     vi: 'Trình mô phỏng Swap', hi: 'Swap सिम्युलेटर', pt: 'Simulador de Swap',   tl: 'Swap Simulator',         fr: 'Simulateur de Swap',
    desc_ko: '예상 수령량·환율·수수료·가격충격을 미리 계산합니다.',
    desc_en: 'Preview receive amount, rate, fee and price impact.',
    desc_id: 'Pratinjau jumlah diterima, kurs, biaya, dan dampak harga.',
    desc_zh: '预先计算预期收到量、汇率、手续费和价格影响。',
    desc_ja: '予想受取量・レート・手数料・価格インパクトを事前確認できます。',
    desc_es: 'Calcula previamente el monto a recibir, la tasa, la comisión y el impacto en el precio.',
    desc_vi: 'Tính trước số lượng nhận, tỷ giá, phí và tác động giá.',
    desc_hi: 'अनुमानित प्राप्त राशि, दर, शुल्क और मूल्य प्रभाव पहले से जांचें।',
    desc_pt: 'Calcule previamente o valor a receber, a taxa, os custos e o impacto no preço.',
    desc_tl: 'Kalkulahin nang maaga ang magiging receive amount, rate, bayad at price impact.',
    desc_fr: 'Calculez à l\'avance le montant reçu, le taux, les frais et l\'impact sur le prix.' },
  { icon: '💧',
    ko: 'LP 계산기',       en: 'LP Calculator',    id: 'Kalkulator LP',       zh: 'LP 计算器',       ja: 'LP計算機',              es: 'Calculadora LP',        vi: 'Máy tính LP',         hi: 'LP कैलकुलेटर',    pt: 'Calculadora LP',      tl: 'LP Calculator',          fr: 'Calculatrice LP',
    desc_ko: '유동성 풀 예치 비율을 사전에 계산하고 풀 통계를 비교합니다.',
    desc_en: 'Calculate deposit ratios and compare pool statistics.',
    desc_id: 'Hitung rasio deposit dan bandingkan statistik pool.',
    desc_zh: '预先计算流动性池存款比例并比较池统计数据。',
    desc_ja: '流動性プール預入比率を事前計算し、プール統計を比較します。',
    desc_es: 'Calcula previamente las proporciones de depósito y compara estadísticas del pool.',
    desc_vi: 'Tính trước tỷ lệ gửi thanh khoản và so sánh thống kê pool.',
    desc_hi: 'तरलता पूल जमा अनुपात पहले से गणना करें और पूल आँकड़े तुलना करें।',
    desc_pt: 'Calcule previamente as proporções de depósito e compare estatísticas do pool.',
    desc_tl: 'Kalkulahin nang maaga ang deposit ratio at ikumpara ang mga istatistika ng pool.',
    desc_fr: 'Calculez à l\'avance les ratios de dépôt et comparez les statistiques du pool.' },
  { icon: '👛',
    ko: '지갑',            en: 'Wallet',           id: 'Dompet',              zh: '钱包',            ja: 'ウォレット',            es: 'Cartera',               vi: 'Ví',                  hi: 'वॉलेट',           pt: 'Carteira',            tl: 'Wallet',                 fr: 'Portefeuille',
    desc_ko: '공개주소(G...)를 등록하면 Pi 잔액·토큰·LP 예치 현황을 조회할 수 있습니다.',
    desc_en: 'Register your public key to view Pi balance, tokens and LP positions.',
    desc_id: 'Daftarkan kunci publik untuk melihat saldo Pi, token, dan posisi LP.',
    desc_zh: '注册公开地址（G...）可查看Pi余额、代币及LP质押状况。',
    desc_ja: '公開アドレス（G...）を登録するとPi残高・トークン・LP預入状況を確認できます。',
    desc_es: 'Registre su clave pública para ver el saldo Pi, tokens y posiciones LP.',
    desc_vi: 'Đăng ký địa chỉ công khai (G...) để xem số dư Pi, token và vị thế LP.',
    desc_hi: 'सार्वजनिक पता (G...) रजिस्टर करें और Pi बैलेंस, टोकन, LP पोजीशन देखें।',
    desc_pt: 'Registre sua chave pública para ver saldo Pi, tokens e posições LP.',
    desc_tl: 'I-register ang inyong public key (G...) para makita ang Pi balance, tokens at LP positions.',
    desc_fr: 'Enregistrez votre clé publique pour voir votre solde Pi, les tokens et vos positions LP.' },
  { icon: '↓',
    ko: '새로고침',        en: 'Pull to Refresh',  id: 'Tarik untuk Refresh', zh: '下拉刷新',        ja: '引いて更新',            es: 'Tirar para Actualizar', vi: 'Kéo để làm mới',      hi: 'खींचकर ताज़ा करें', pt: 'Puxe para Atualizar', tl: 'Pull para I-refresh',    fr: 'Tirer pour Actualiser',
    desc_ko: '각 탭 최상단에서 아래로 드래그하면 데이터가 새로고침됩니다.',
    desc_en: 'Pull down from the top of any tab to refresh.',
    desc_id: 'Tarik ke bawah dari atas tab mana pun untuk memperbarui data.',
    desc_zh: '在任意标签页顶部向下拖动即可刷新数据。',
    desc_ja: '各タブの最上部から下にドラッグするとデータが更新されます。',
    desc_es: 'Desliza hacia abajo desde la parte superior de cualquier pestaña para actualizar.',
    desc_vi: 'Kéo xuống từ đầu của bất kỳ tab nào để làm mới dữ liệu.',
    desc_hi: 'किसी भी टैब के ऊपर से नीचे खींचकर डेटा रीफ्रेश करें।',
    desc_pt: 'Puxe para baixo do topo de qualquer aba para atualizar os dados.',
    desc_tl: 'I-drag pababa mula sa tuktok ng anumang tab para i-refresh ang datos.',
    desc_fr: 'Glissez vers le bas depuis le haut de n\'importe quel onglet pour actualiser les données.' },
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
