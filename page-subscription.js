import { showToast } from './app.js';
import { t } from './i18n.js';
import { createDonation, createSubscriptionPayment } from './pi-sdk.js';
import { isSubscribed, setSubscription, getSubscriptionExpiry } from './util-storage.js';
import { currentUser } from './pi-sdk.js';

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
    desc_ko: '삼각차익 경로를 스캔하고 순 수익률을 시뮬레이션합니다. 무료 30회/일, 이용권 구매 시 무료 30 + 이용권 100 = 총 130회/일.',
    desc_en: 'Scan arbitrage paths and simulate net return. Free 30×/day; with pass: 30 (free) + 100 (pass) = 130×/day.',
    desc_id: 'Pindai jalur arbitrase dan simulasikan return bersih. Gratis 30×/hari; dengan paket: 30+100 = 130×/hari.',
    desc_zh: '扫描三角套利路径并模拟净收益率。免费30次/天；购买使用权后：30（免费）+100（使用权）= 共130次/天。',
    desc_ja: '三角アービトラージ経路をスキャンし純収益率をシミュレートします。無料30回/日；利用券購入で：30（無料）+100（利用券）= 計130回/日。',
    desc_es: 'Escanea rutas de arbitraje triangular y simula el retorno neto. Gratis 30×/día; con pase: 30+100 = 130×/día.',
    desc_vi: 'Quét các đường đi arbitrage tam giác và mô phỏng lợi nhuận ròng. Miễn phí 30×/ngày; có gói: 30+100 = 130×/ngày.',
    desc_hi: 'त्रिकोण आर्बिट्राज रास्ते स्कैन करें और शुद्ध रिटर्न सिमुलेट करें। मुफ्त 30×/दिन; पास के साथ: 30+100 = 130×/दिन।',
    desc_pt: 'Varre caminhos de arbitragem triangular e simula o retorno líquido. Grátis 30×/dia; com passe: 30+100 = 130×/dia.',
    desc_tl: 'I-scan ang mga triangular arbitrage path at i-simulate ang net return. Libre 30×/araw; may pass: 30+100 = 130×/araw.',
    desc_fr: 'Scanne les chemins d\'arbitrage triangulaire et simule le retour net. Gratuit 30×/jour ; avec pass : 30+100 = 130×/jour.' },
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
  { icon: '📈',
    ko: 'MM 백테스터',     en: 'MM Backtester',    id: 'Backtester MM',       zh: 'MM 回测器',       ja: 'MMバックテスター',      es: 'Backtester MM',         vi: 'Backtest MM',         hi: 'MM बैकटेस्टर',    pt: 'Backtester MM',       tl: 'MM Backtester',          fr: 'Backtester MM',
    desc_ko: '유동성 공급(LP) 전략을 과거 데이터로 백테스트하고 수익률을 시뮬레이션합니다. 여러 풀을 한 번에 스캔해 최적의 설정을 찾을 수도 있습니다.',
    desc_en: 'Backtest liquidity provider (LP) strategies against historical data and simulate returns. Scan multiple pools at once to find the optimal setup.',
    desc_id: 'Backtest strategi penyedia likuiditas (LP) dengan data historis dan simulasikan return. Pindai banyak pool sekaligus untuk menemukan pengaturan optimal.',
    desc_zh: '用历史数据回测流动性提供（LP）策略并模拟收益率。可一次扫描多个池以寻找最优设置。',
    desc_ja: '流動性提供（LP）戦略を過去データでバックテストし、収益率をシミュレートします。複数のプールを一度にスキャンして最適な設定を見つけることもできます。',
    desc_es: 'Realiza backtesting de estrategias de proveedor de liquidez (LP) con datos históricos y simula rendimientos. Escanea varios pools a la vez para encontrar la configuración óptima.',
    desc_vi: 'Backtest chiến lược cung cấp thanh khoản (LP) với dữ liệu lịch sử và mô phỏng lợi nhuận. Quét nhiều pool cùng lúc để tìm cài đặt tối ưu.',
    desc_hi: 'ऐतिहासिक डेटा के साथ तरलता प्रदाता (LP) रणनीतियों का बैकटेस्ट करें और रिटर्न सिमुलेट करें। सर्वोत्तम सेटअप खोजने के लिए एक साथ कई पूल स्कैन करें।',
    desc_pt: 'Faça backtest de estratégias de provedor de liquidez (LP) com dados históricos e simule retornos. Escaneie vários pools de uma vez para encontrar a configuração ideal.',
    desc_tl: 'I-backtest ang mga estratehiya ng liquidity provider (LP) gamit ang historical data at i-simulate ang mga return. I-scan ang maraming pool nang sabay para mahanap ang pinakamainam na setup.',
    desc_fr: "Effectuez un backtest des stratégies de fournisseur de liquidité (LP) avec des données historiques et simulez les rendements. Scannez plusieurs pools à la fois pour trouver la configuration optimale." },
  { icon: '👛',
    ko: '지갑',            en: 'Wallet',           id: 'Dompet',              zh: '钱包',            ja: 'ウォレット',            es: 'Cartera',               vi: 'Ví',                  hi: 'वॉलेट',           pt: 'Carteira',            tl: 'Wallet',                 fr: 'Portefeuille',
    desc_ko: '여러 개의 지갑을 별칭과 함께 등록할 수 있습니다. Pi 로그인 시 Pi SDK 지갑을 자동 등록하며, 추가로 G로 시작하는 공개주소를 직접 입력해 등록할 수 있습니다. 개인키나 비밀구절은 절대 입력하지 마세요. 등록된 지갑의 Pi 잔액·토큰·LP 현황을 조회하고, 지갑 목록을 서버에 백업/복원할 수 있습니다.',
    desc_en: 'Register multiple wallets with custom nicknames. Your Pi SDK wallet is auto-registered on login. Add more by entering a public address starting with G — never enter a private key or seed phrase. View Pi balance, tokens and LP positions for each wallet. Back up and restore your wallet list via cloud.',
    desc_id: 'Daftarkan beberapa dompet dengan nama panggilan. Dompet Pi SDK otomatis terdaftar saat login. Tambah lagi dengan memasukkan alamat publik berawalan G — jangan pernah masukkan kunci privat atau frasa rahasia. Lihat saldo, token, dan posisi LP tiap dompet. Cadangkan dan pulihkan daftar dompet via cloud.',
    desc_zh: '可注册多个钱包并设置别名。Pi登录时自动注册Pi SDK钱包，还可手动输入G开头的公开地址添加更多钱包。切勿输入私钥或助记词。可查看各钱包的Pi余额、代币及LP状况，并支持云端备份/恢复钱包列表。',
    desc_ja: '複数のウォレットをニックネーム付きで登録できます。PiログインでPi SDKウォレットが自動登録され、Gから始まる公開アドレスを手動入力して追加できます。秘密鍵やシードフレーズは絶対に入力しないでください。各ウォレットのPi残高・トークン・LP状況を確認でき、ウォレットリストのクラウドバックアップ/復元も可能です。',
    desc_es: 'Registra varias carteras con alias personalizados. La cartera Pi SDK se registra automáticamente al iniciar sesión. Añade más ingresando una dirección pública que empiece con G — nunca ingreses clave privada ni frase semilla. Consulta saldo, tokens y posiciones LP de cada cartera. Haz copia de seguridad y restaura tu lista de carteras en la nube.',
    desc_vi: 'Đăng ký nhiều ví với biệt danh tùy chỉnh. Ví Pi SDK được tự động đăng ký khi đăng nhập. Thêm ví bằng cách nhập địa chỉ công khai bắt đầu bằng G — tuyệt đối không nhập khóa riêng tư hay cụm từ bí mật. Xem số dư Pi, token và vị thế LP của từng ví. Sao lưu và khôi phục danh sách ví qua cloud.',
    desc_hi: 'कई वॉलेट को कस्टम उपनाम के साथ पंजीकृत करें। Pi लॉगिन पर Pi SDK वॉलेट स्वतः पंजीकृत होता है। G से शुरू होने वाला सार्वजनिक पता दर्ज करके और जोड़ें — निजी कुंजी या बीज वाक्यांश कभी न डालें। प्रत्येक वॉलेट का Pi बैलेंस, टोकन और LP स्थिति देखें। क्लाउड के माध्यम से वॉलेट सूची का बैकअप और पुनर्स्थापना करें।',
    desc_pt: 'Registre várias carteiras com apelidos personalizados. A carteira Pi SDK é registrada automaticamente no login. Adicione mais inserindo um endereço público começando com G — nunca insira chave privada ou frase semente. Veja saldo Pi, tokens e posições LP de cada carteira. Faça backup e restaure sua lista de carteiras via cloud.',
    desc_tl: 'Magrehistro ng maraming wallet na may custom na palayaw. Ang Pi SDK wallet ay awtomatikong nirehistro sa login. Magdagdag pa sa pamamagitan ng paglalagay ng public address na nagsisimula sa G — huwag ilagay ang private key o seed phrase. Tingnan ang Pi balance, tokens at LP positions ng bawat wallet. I-backup at i-restore ang listahan ng wallet sa cloud.',
    desc_fr: 'Enregistrez plusieurs portefeuilles avec des surnoms personnalisés. Le portefeuille Pi SDK est enregistré automatiquement à la connexion. Ajoutez-en d\'autres en saisissant une adresse publique commençant par G — ne saisissez jamais de clé privée ni de phrase secrète. Consultez le solde Pi, les tokens et les positions LP de chaque portefeuille. Sauvegardez et restaurez votre liste de portefeuilles via le cloud.' },
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

      <div class="card subscription-card" style="margin-bottom:12px;">
        <div class="card-title">${t('sub_title')}</div>
        <p class="info-desc" style="margin-bottom:8px;">
          ${isSubscribed() ? t('sub_active_status') : t('sub_free_status')}
        </p>
        ${!isSubscribed() ? `
          <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:13px;line-height:1.9;color:var(--text-secondary);">
            ${t('sub_b1')}<br>
            ${t('sub_b2')}<br>
            ${t('sub_b3')}
          </div>
          <button class="btn-primary" id="btn-subscribe" style="margin-top:2px;">${t('sub_btn')}</button>
        ` : `<p class="form-hint" style="margin-bottom:4px;">${t('sub_expiry')}: ${new Date(getSubscriptionExpiry()).toLocaleDateString()}</p>`}
        <button class="btn-outline" id="btn-restore" style="margin-top:6px;width:100%;font-size:0.85rem;">${t('sub_restore_btn')}</button>
        <div class="donation-result" id="sub-result"></div>
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

      <div class="card donation-card">
        <div class="card-title">${t('donation_title')}</div>
        <p class="info-desc" style="margin-bottom:4px;">${t('donation_desc')}</p>
        <div class="donation-btns">
          <button class="donation-btn" data-amount="1">1π</button>
          <button class="donation-btn" data-amount="5">5π</button>
          <button class="donation-btn" data-amount="10">10π</button>
        </div>
        <div class="donation-result" id="donation-result"></div>
      </div>

    </div>
  `;

  const subBtn = container.querySelector('#btn-subscribe');
  if (subBtn) {
    subBtn.addEventListener('click', async () => {
      const resultEl = container.querySelector('#sub-result');
      subBtn.disabled = true;
      resultEl.textContent = '';
      resultEl.className = 'donation-result';
      try {
        await createSubscriptionPayment();
        setSubscription(1);
        // complete.js Redis 저장 실패 보완 — 로컬 만료일로 Redis 명시적 동기화
        const _uid = currentUser?.uid;
        const _exp = getSubscriptionExpiry();
        if (_uid && _exp) {
          fetch('/api/subscription/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: _uid, expiry: _exp }),
          }).catch(() => {});
        }
        resultEl.textContent = t('sub_ok');
        resultEl.classList.add('donation-success');
        const badge = document.getElementById('header-sub-badge');
        if (badge) { badge.textContent = t('sub_active'); badge.classList.remove('hidden'); }
        window._refreshArbQuota?.();
        setTimeout(() => renderSubscription(container), 2000);
      } catch (err) {
        if (err.message === 'cancelled') {
          resultEl.textContent = '';
        } else {
          resultEl.textContent = t('sub_err');
          resultEl.classList.add('donation-error');
        }
        subBtn.disabled = false;
      }
    });
  }

  const restoreBtn = container.querySelector('#btn-restore');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      const resultEl = container.querySelector('#sub-result');
      restoreBtn.disabled = true;
      resultEl.textContent = '';
      resultEl.className = 'donation-result';
      try {
        const uid = currentUser?.uid;
        if (!uid) throw new Error('no uid');

        // 1단계: Redis 확인
        let status = await fetch(`/api/subscription/status?uid=${encodeURIComponent(uid)}`).then(r => r.json());

        // 2단계: Redis에 없고 localStorage에 유효한 이용권이 있으면 → Redis에 업로드
        if (!status.active) {
          const localExpiry = localStorage.getItem('sub_expiry');
          if (localExpiry && new Date(localExpiry) > new Date()) {
            const restoreRes = await fetch('/api/subscription/restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid, expiry: localExpiry }),
            });
            if (!restoreRes.ok) throw new Error('restore_failed');
            // 3단계: Redis 재확인
            status = await fetch(`/api/subscription/status?uid=${encodeURIComponent(uid)}`).then(r => r.json());
          }
        }

        if (status.active && status.expiry) {
          localStorage.setItem('sub_expiry', status.expiry);
          resultEl.textContent = t('sub_restore_ok');
          resultEl.classList.add('donation-success');
          window._refreshArbQuota?.();
          setTimeout(() => renderSubscription(container), 1500);
        } else {
          resultEl.textContent = t('sub_restore_none');
          resultEl.classList.add('donation-error');
          restoreBtn.disabled = false;
        }
      } catch {
        resultEl.textContent = t('sub_restore_none');
        resultEl.classList.add('donation-error');
        restoreBtn.disabled = false;
      }
    });
  }

  container.querySelector('#btn-copy-yt').addEventListener('click', () => {
    navigator.clipboard.writeText('youtube.com/@hiddenstrokes-j5w').then(() => {
      const btn = container.querySelector('#btn-copy-yt');
      btn.textContent = t('info_copied');
      setTimeout(() => { btn.textContent = t('info_copy'); }, 2000);
    });
  });

  container.querySelectorAll('.donation-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const amount = Number(btn.dataset.amount);
      const resultEl = container.querySelector('#donation-result');
      const allBtns = container.querySelectorAll('.donation-btn');
      allBtns.forEach(b => { b.disabled = true; });
      resultEl.textContent = '';
      resultEl.className = 'donation-result';
      try {
        await createDonation(amount);
        resultEl.textContent = `✓ ${amount}π`;
        resultEl.classList.add('donation-success');
      } catch (err) {
        if (err.message === 'cancelled') {
          resultEl.textContent = '';
        } else {
          resultEl.textContent = t('donation_error');
          resultEl.classList.add('donation-error');
        }
      } finally {
        allBtns.forEach(b => { b.disabled = false; });
      }
    });
  });


}
