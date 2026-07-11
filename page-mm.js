// ═══════════════════════════════════════════════════════
//  MM Backtest tab — ported from standalone "Mm backtest/app.js"
// ═══════════════════════════════════════════════════════
import { getLang } from './i18n.js';
import { isSubscribed } from './util-storage.js';
import { currentUser } from './pi-sdk.js';
import { showToast } from './app.js';
import { fetchLpPositionsServer, saveLpPositionsServer, LP_POSITION_MAX } from './firebase-wallet.js';

function getUsername() { return currentUser?.username || document.getElementById('header-username')?.textContent?.trim() || null; }

// ── i18n (11개 언어: ko/en/id/zh/ja/es/vi/hi/pt/tl/fr) ──
const S = {
  steps: [
    { ko:'네트워크', en:'Network',    id:'Jaringan',  zh:'网络',     ja:'ネットワーク', es:'Red',        vi:'Mạng',       hi:'नेटवर्क',    pt:'Rede',       tl:'Network',    fr:'Réseau' },
    { ko:'전략',     en:'Strategy',   id:'Strategi',  zh:'策略',     ja:'戦略',         es:'Estrategia', vi:'Chiến lược', hi:'रणनीति',     pt:'Estratégia', tl:'Estratehiya',fr:'Stratégie' },
    { ko:'풀 선택',  en:'Pool',       id:'Pool',      zh:'选择池',   ja:'プール選択',   es:'Pool',       vi:'Chọn Pool',  hi:'पूल',        pt:'Pool',       tl:'Pool',       fr:'Pool' },
    { ko:'파라미터', en:'Parameters', id:'Parameter', zh:'参数',     ja:'パラメータ',   es:'Parámetros', vi:'Tham số',    hi:'पैरामीटर',   pt:'Parâmetros', tl:'Parametro',  fr:'Paramètres' },
    { ko:'실행',     en:'Run',        id:'Jalankan',  zh:'执行',     ja:'実行',         es:'Ejecutar',   vi:'Chạy',       hi:'चलाएं',      pt:'Executar',   tl:'Patakbuhin', fr:'Exécuter' },
    { ko:'결과',     en:'Results',    id:'Hasil',     zh:'结果',     ja:'結果',         es:'Resultados', vi:'Kết quả',    hi:'परिणाम',     pt:'Resultados', tl:'Resulta',    fr:'Résultats' },
  ],
  btn_next:     { ko:'다음',          en:'Next',              id:'Berikutnya',      zh:'下一步',        ja:'次へ',              es:'Siguiente',        vi:'Tiếp',               hi:'अगला',           pt:'Próximo',         tl:'Susunod',           fr:'Suivant' },
  btn_prev:     { ko:'이전',          en:'Back',              id:'Kembali',         zh:'上一步',        ja:'戻る',              es:'Atrás',            vi:'Quay lại',           hi:'पिछला',          pt:'Voltar',          tl:'Bumalik',           fr:'Retour' },
  btn_run:      { ko:'백테스트 시작', en:'Start Backtest',    id:'Mulai Backtest',  zh:'开始回测',      ja:'バックテスト開始',  es:'Iniciar Backtest', vi:'Bắt đầu Backtest',   hi:'बैकटेस्ट शुरू',  pt:'Iniciar Backtest', tl:'Simulan ang Backtest', fr:'Lancer Backtest' },
  btn_retry:    { ko:'다시 시도',     en:'Retry',             id:'Coba Lagi',       zh:'重试',          ja:'再試行',            es:'Reintentar',       vi:'Thử lại',            hi:'पुनः प्रयास',    pt:'Tentar novamente', tl:'Subukan ulit',      fr:'Réessayer' },
  btn_stop:     { ko:'수신 중단',     en:'Stop',              id:'Berhenti',        zh:'停止',          ja:'中断',              es:'Detener',          vi:'Dừng',               hi:'रोकें',           pt:'Parar',            tl:'Ihinto',            fr:'Arrêter' },
  btn_new:      { ko:'새 백테스트',   en:'New Backtest',      id:'Backtest Baru',   zh:'新回测',        ja:'新バックテスト',    es:'Nuevo Backtest',   vi:'Backtest mới',       hi:'नया बैकटेस्ट',   pt:'Novo Backtest',    tl:'Bagong Backtest',   fr:'Nouveau Backtest' },
  btn_params:   { ko:'← 파라미터',   en:'← Parameters',     id:'← Parameter',     zh:'← 参数',        ja:'← パラメータ',     es:'← Parámetros',     vi:'← Tham số',          hi:'← पैरामीटर',     pt:'← Parâmetros',     tl:'← Parametro',       fr:'← Paramètres' },
  btn_net:      { ko:'← 네트워크 변경', en:'← Change Network', id:'← Ganti Jaringan', zh:'← 更换网络', ja:'← ネットワーク変更', es:'← Cambiar Red',  vi:'← Đổi mạng',         hi:'← नेटवर्क बदलें', pt:'← Mudar Rede',    tl:'← Baguhin ang Network', fr:'← Changer Réseau' },

  net_title:    { ko:'네트워크 선택',  en:'Select Network',    id:'Pilih Jaringan',  zh:'选择网络',      ja:'ネットワーク選択',  es:'Seleccionar Red',  vi:'Chọn mạng',          hi:'नेटवर्क चुनें',  pt:'Selecionar Rede',  tl:'Piliin ang Network', fr:'Choisir Réseau' },
  stellar_name: { ko:'Stellar 메인넷', en:'Stellar Mainnet',   id:'Stellar Mainnet', zh:'Stellar 主网',  ja:'Stellar メインネット', es:'Stellar Mainnet', vi:'Stellar Mainnet',    hi:'Stellar मेनेट',  pt:'Stellar Mainnet',  tl:'Stellar Mainnet',   fr:'Stellar Mainnet' },
  stellar_desc: { ko:'Stellar 공식 메인넷 · XLM/USDC 등 풍부한 유동성', en:'Official Stellar mainnet · Rich liquidity', id:'Mainnet resmi Stellar · Likuiditas tinggi', zh:'Stellar 官方主网 · XLM/USDC 流动性丰富', ja:'Stellar公式メインネット · 豊富な流動性', es:'Mainnet oficial Stellar · Alta liquidez', vi:'Mainnet Stellar · Thanh khoản cao', hi:'Stellar आधिकारिक मेनेट · उच्च तरलता', pt:'Mainnet oficial Stellar · Alta liquidez', tl:'Opisyal na Stellar mainnet · Mataas na likido', fr:'Mainnet officiel Stellar · Liquidité élevée' },
  pi_name:      { ko:'Pi DEX 테스트넷', en:'Pi DEX Testnet', id:'Pi DEX Testnet', zh:'Pi DEX 测试网', ja:'Pi DEX テストネット', es:'Pi DEX Testnet', vi:'Pi DEX Testnet', hi:'Pi DEX टेस्टनेट', pt:'Pi DEX Testnet', tl:'Pi DEX Testnet', fr:'Pi DEX Testnet' },
  pi_desc:      { ko:'Pi 네트워크 DEX · Pi 테스트넷 기반 (메인넷 거래 데이터 없음)', en:'Pi Network DEX · Pi testnet based (mainnet has no trade data yet)', id:'DEX Jaringan Pi · Berbasis testnet Pi (mainnet belum ada data transaksi)', zh:'Pi 网络 DEX · 基于 Pi 测试网（主网暂无交易数据）', ja:'Pi ネットワーク DEX · Pi テストネットベース（メインネットはまだ取引データなし）', es:'DEX de Pi Network · Basado en testnet Pi (mainnet aún sin datos de operaciones)', vi:'Pi Network DEX · Trên testnet Pi (mainnet chưa có dữ liệu giao dịch)', hi:'Pi Network DEX · Pi टेस्टनेट आधारित (मेननेट पर अभी ट्रेड डेटा नहीं)', pt:'Pi Network DEX · Baseado no testnet Pi (mainnet ainda sem dados de negociação)', tl:'Pi Network DEX · Nakabase sa Pi testnet (wala pang datos ng trade sa mainnet)', fr:"Pi Network DEX · Basé sur Pi testnet (le mainnet n'a pas encore de données de transaction)" },

  str_title:    { ko:'전략 선택',      en:'Select Strategy',   id:'Pilih Strategi',  zh:'选择策略',      ja:'戦略選択',          es:'Seleccionar Estrategia', vi:'Chọn chiến lược', hi:'रणनीति चुनें',  pt:'Selecionar Estratégia', tl:'Piliin ang Estratehiya', fr:'Choisir Stratégie' },
  ob_name:      { ko:'오더북 마켓메이킹', en:'Orderbook Market Making', id:'Market Making Orderbook', zh:'订单簿做市', ja:'オーダーブック マーケットメイキング', es:'Creación de mercado (Orderbook)', vi:'Tạo lập thị trường Orderbook', hi:'ऑर्डरबुक मार्केट मेकिंग', pt:'Market Making (Orderbook)', tl:'Orderbook Market Making', fr:"Market Making (Carnet d'ordres)" },
  ob_desc:      { ko:'Bid/Ask 주문으로 스프레드 수익 시뮬레이션', en:'Simulate spread profit via bid/ask orders', id:'Simulasi profit spread via order bid/ask', zh:'通过买卖单模拟价差收益', ja:'買い/売り注文でスプレッド収益をシミュレート', es:'Simular ganancias de spread con órdenes bid/ask', vi:'Mô phỏng lợi nhuận chênh lệch giá qua lệnh mua/bán', hi:'Bid/Ask ऑर्डर से स्प्रेड लाभ का अनुकरण', pt:'Simular lucro de spread com ordens bid/ask', tl:'I-simulate ang kita sa spread sa pamamagitan ng bid/ask orders', fr:'Simuler les profits de spread via ordres bid/ask' },
  amm_name:     { ko:'AMM 유동성 공급', en:'AMM Liquidity Provision', id:'Suplai Likuiditas AMM', zh:'AMM 流动性提供', ja:'AMM 流動性プロビジョニング', es:'Provisión de Liquidez AMM', vi:'Cung cấp thanh khoản AMM', hi:'AMM तरलता प्रावधान', pt:'Provisão de Liquidez AMM', tl:'AMM Liquidity Provision', fr:'Fourniture de Liquidité AMM' },
  amm_desc:     { ko:'풀에 예치 후 수수료 + 비영구적 손실 시뮬레이션', en:'Fee income & impermanent loss simulation', id:'Simulasi pendapatan fee & kerugian impermanent', zh:'存入池后模拟手续费收益和无常损失', ja:'プールに預けた後の手数料収益＋無常損失をシミュレート', es:'Simular ingresos por comisión y pérdida impermanente', vi:'Mô phỏng thu nhập phí & tổn thất vô thường', hi:'पूल में जमा के बाद शुल्क + अस्थायी हानि का अनुकरण', pt:'Simular renda de taxa e perda impermanente', tl:'Simulate ang kita mula sa bayad at impermanent loss', fr:'Simuler revenus de frais et perte impermanente' },
  auto_name:    { ko:'자동 최적화 🔍', en:'Auto Optimize 🔍', id:'Optimasi Otomatis 🔍', zh:'自动优化 🔍', ja:'自動最適化 🔍', es:'Auto Optimizar 🔍', vi:'Tự Động Tối Ưu 🔍', hi:'स्वतः अनुकूलन 🔍', pt:'Auto Otimizar 🔍', tl:'Auto Optimize 🔍', fr:'Auto Optimiser 🔍' },
  auto_desc:    { ko:'상위 풀을 자동 분석해 최적 파라미터 조합을 추천합니다', en:'Scans top pools to find the best parameter combination', id:'Pindai pool teratas untuk kombinasi parameter terbaik', zh:'自动扫描顶部池以找到最佳参数组合', ja:'上位プールを自動分析し最適パラメータを推薦します', es:'Escanea los mejores pools para encontrar la mejor combinación', vi:'Tự động quét các pool hàng đầu để tìm tham số tối ưu', hi:'सर्वोत्तम पैरामीटर के लिए शीर्ष पूल स्कैन करें', pt:'Verifica os melhores pools para a melhor combinação', tl:'I-scan ang mga nangungunang pool para sa pinakamahusay na parameter', fr:'Analyse les meilleurs pools pour trouver la meilleure combinaison' },

  pool_title:    { ko:'풀 선택',        en:'Select Pool',       id:'Pilih Pool',      zh:'选择池',        ja:'プール選択',        es:'Seleccionar Pool',  vi:'Chọn Pool',         hi:'पूल चुनें',      pt:'Selecionar Pool',  tl:'Piliin ang Pool',    fr:'Choisir Pool' },
  pair_title:    { ko:'페어 선택',      en:'Select Pair',       id:'Pilih Pasangan',  zh:'选择交易对',    ja:'ペア選択',          es:'Seleccionar Par',   vi:'Chọn cặp',          hi:'पेयर चुनें',     pt:'Selecionar Par',   tl:'Piliin ang Pares',   fr:'Choisir la Paire' },
  loading_pools: { ko:'풀 목록 불러오는 중', en:'Loading pools', id:'Memuat daftar pool', zh:'加载池列表中', ja:'プールリスト読込中', es:'Cargando pools',  vi:'Đang tải danh sách pool', hi:'पूल सूची लोड हो रही है', pt:'Carregando pools', tl:'Nilo-load ang mga pool', fr:'Chargement des pools' },
  loading_pairs: { ko:'거래 페어 불러오는 중', en:'Loading pairs', id:'Memuat pasangan trading', zh:'加载交易对中', ja:'取引ペア読込中', es:'Cargando pares', vi:'Đang tải cặp giao dịch', hi:'ट्रेडिंग पेयर लोड हो रहे हैं', pt:'Carregando pares', tl:'Nilo-load ang mga pares', fr:'Chargement des paires' },
  sec:           { ko:'초', en:'sec', id:'dtk', zh:'秒', ja:'秒', es:'seg', vi:'giây', hi:'सेकंड', pt:'seg', tl:'seg', fr:'sec' },
  search_ph:     { ko:'토큰 이름 검색...', en:'Search token...', id:'Cari nama token...', zh:'搜索代币...', ja:'トークン検索...', es:'Buscar token...', vi:'Tìm kiếm token...', hi:'टोकन खोजें...', pt:'Buscar token...', tl:'Hanapin ang token...', fr:'Rechercher token...' },
  sort_lp:       { ko:'XLM 전체 풀 · 7일 거래 횟수 90% + LP 수 10% 순', en:'All XLM pools · 7d trade count 90% + LP 10%', id:'Semua pool XLM · Frekuensi 7h 90% + LP 10%', zh:'XLM全部池 · 7日交易次数90% + LP数10%', ja:'XLM全プール · 7日取引回数90% + LP数10%順', es:'Todos pools XLM · Operaciones 7d 90% + LP 10%', vi:'Tất cả pool XLM · Số giao dịch 7d 90% + LP 10%', hi:'सभी XLM पूल · 7d ट्रेड 90% + LP 10%', pt:'Todos pools XLM · Negociações 7d 90% + LP 10%', tl:'Lahat ng XLM pool · 7d trade count 90% + LP 10%', fr:'Tous pools XLM · Transactions 7j 90% + LP 10%' },
  sort_tvl:      { ko:'XLM 전체 풀 · 거래량/TVL 비율 (수수료 APY) 순', en:'All XLM pools · Volume/TVL ratio (fee APY)', id:'Semua pool XLM · Rasio volume/TVL (APY biaya)', zh:'XLM全部池 · 交易量/TVL比率（手续费APY）', ja:'XLM全プール · 取引量/TVL比率（手数料APY）順', es:'Todos pools XLM · Ratio volumen/TVL (APY comisión)', vi:'Tất cả pool XLM · Tỷ lệ khối lượng/TVL (APY phí)', hi:'सभी XLM पूल · वॉल्यूम/TVL अनुपात (शुल्क APY)', pt:'Todos pools XLM · Proporção volume/TVL (APY de taxa)', tl:'Lahat ng XLM pool · Volume/TVL ratio (fee APY)', fr:'Tous pools XLM · Ratio volume/TVL (APY de frais)' },
  sort_pi_amm:   { ko:'Pi DEX 테스트넷 AMM 풀 · LP 수 순 정렬', en:'Pi DEX Testnet AMM pools · Sorted by LP count', id:'Pool AMM Testnet Pi DEX · Urut jumlah LP', zh:'Pi DEX 测试网 AMM 池 · 按 LP 数量排序', ja:'Pi DEX テストネット AMM プール · LP数順', es:'Pools AMM Testnet Pi DEX · Ordenado por LP', vi:'Pool AMM Testnet Pi DEX · Sắp xếp theo số LP', hi:'Pi DEX टेस्टनेट AMM पूल · LP संख्या के अनुसार', pt:'Pools AMM Testnet Pi DEX · Ordenado por LP', tl:'Pi DEX Testnet AMM pools · Nakaayos ayon sa LP count', fr:'Pools AMM Testnet Pi DEX · Trié par nombre de LP' },
  pi_info:       { ko:'Pi DEX 테스트넷 · 오더북 거래 데이터 · 거래량 순 정렬', en:'Pi DEX Testnet · Orderbook data · Sorted by volume', id:'Pi DEX Testnet · Data orderbook · Urut volume', zh:'Pi DEX 测试网 · 订单簿交易数据 · 按交易量排序', ja:'Pi DEX テストネット · オーダーブックデータ · 取引量順', es:'Pi DEX Testnet · Datos orderbook · Ordenado por volumen', vi:'Pi DEX Testnet · Dữ liệu orderbook · Sắp xếp theo khối lượng', hi:'Pi DEX टेस्टनेट · ऑर्डरबुक डेटा · वॉल्यूम के अनुसार', pt:'Pi DEX Testnet · Dados orderbook · Ordenado por volume', tl:'Pi DEX Testnet · Orderbook data · Nakaayos ayon sa volume', fr:'Pi DEX Testnet · Données orderbook · Trié par volume' },
  recent_trades: { ko:'최근 거래', en:'Recent trades', id:'Transaksi terkini', zh:'最近交易', ja:'最近の取引', es:'Operaciones recientes', vi:'Giao dịch gần đây', hi:'हालिया ट्रेड', pt:'Negociações recentes', tl:'Kamakailang trades', fr:'Transactions récentes' },
  no_results:    { ko:'검색 결과 없음', en:'No results', id:'Tidak ada hasil', zh:'无结果', ja:'結果なし', es:'Sin resultados', vi:'Không có kết quả', hi:'कोई परिणाम नहीं', pt:'Sem resultados', tl:'Walang resulta', fr:'Aucun résultat' },
  pool_fail:     { ko:'풀 목록 로드 실패', en:'Pool load failed', id:'Gagal memuat pool', zh:'池列表加载失败', ja:'プールリスト読み込み失敗', es:'Error al cargar pools', vi:'Lỗi tải danh sách pool', hi:'पूल सूची लोड विफल', pt:'Falha ao carregar pools', tl:'Nabigo ang pag-load ng pool', fr:'Échec chargement pools' },
  pair_fail:     { ko:'페어 로드 실패', en:'Pair load failed', id:'Gagal memuat pasangan', zh:'交易对加载失败', ja:'ペア読み込み失敗', es:'Error al cargar pares', vi:'Lỗi tải cặp giao dịch', hi:'पेयर लोड विफल', pt:'Falha ao carregar pares', tl:'Nabigo ang pag-load ng pares', fr:'Échec chargement paires' },
  no_trade_data: { ko:'거래 데이터 없음', en:'No trade data', id:'Tidak ada data trading', zh:'无交易数据', ja:'取引データなし', es:'Sin datos de trading', vi:'Không có dữ liệu giao dịch', hi:'कोई ट्रेड डेटा नहीं', pt:'Sem dados de trading', tl:'Walang datos sa trade', fr:'Pas de données de trading' },

  param_title:   { ko:'파라미터 설정', en:'Parameter Settings', id:'Pengaturan Parameter', zh:'参数设置', ja:'パラメータ設定', es:'Ajustes de Parámetros', vi:'Cài đặt tham số', hi:'पैरामीटर सेटिंग', pt:'Configurações de Parâmetros', tl:'Mga Setting ng Parametro', fr:'Réglages des Paramètres' },
  p_records:     { ko:'데이터 건수 (5,000~10,000)', en:'Data count (5,000~10,000)', id:'Jumlah data (5.000~10.000)', zh:'数据条数 (5,000~10,000)', ja:'データ件数 (5,000~10,000)', es:'Cantidad de datos (5.000~10.000)', vi:'Số bản ghi (5.000~10.000)', hi:'डेटा गणना (5,000~10,000)', pt:'Qtd dados (5.000~10.000)', tl:'Bilang ng data (5,000~10,000)', fr:'Nb de données (5 000~10 000)' },
  p_capital:     { ko:'초기 자본', en:'Initial Capital', id:'Modal Awal', zh:'初始资金', ja:'初期資本', es:'Capital inicial', vi:'Vốn ban đầu', hi:'प्रारंभिक पूंजी', pt:'Capital inicial', tl:'Panimulang kapital', fr:'Capital initial' },
  p_split:       { ko:'네이티브 초기 비율 (%)', en:'Native ratio (%)', id:'Rasio awal native (%)', zh:'原生代币初始比例 (%)', ja:'ネイティブ初期比率 (%)', es:'Ratio inicial nativo (%)', vi:'Tỷ lệ ban đầu native (%)', hi:'नेटिव प्रारंभिक अनुपात (%)', pt:'Proporção inicial nativa (%)', tl:'Native initial ratio (%)', fr:'Ratio natif initial (%)' },
  p_spread:      { ko:'스프레드 (%)', en:'Spread (%)', id:'Spread (%)', zh:'价差 (%)', ja:'スプレッド (%)', es:'Spread (%)', vi:'Chênh lệch (%)', hi:'स्प्रेड (%)', pt:'Spread (%)', tl:'Spread (%)', fr:'Écart (%)' },
  p_order_size:  { ko:'주문 크기 (총자산 %)', en:'Order size (% of total)', id:'Ukuran order (% total)', zh:'订单大小 (总资产 %)', ja:'注文サイズ（総資産 %）', es:'Tamaño de orden (% total)', vi:'Kích thước lệnh (% tổng)', hi:'ऑर्डर साइज (कुल %)', pt:'Tamanho da ordem (% total)', tl:'Laki ng order (% ng total)', fr:"Taille d'ordre (% total)" },
  p_layers:      { ko:'주문 레이어 수', en:'Order layers', id:'Jumlah layer order', zh:'订单层数', ja:'注文レイヤー数', es:'Capas de orden', vi:'Số lớp lệnh', hi:'ऑर्डर लेयर्स', pt:'Camadas de ordem', tl:'Bilang ng order layer', fr:"Couches d'ordres" },
  p_stop:        { ko:'재고 중단 (%)', en:'Inventory stop (%)', id:'Batas inventori (%)', zh:'库存中断 (%)', ja:'在庫停止 (%)', es:'Parada por inventario (%)', vi:'Dừng tồn kho (%)', hi:'इन्वेंटरी स्टॉप (%)', pt:'Parada de inventário (%)', tl:'Inventory stop (%)', fr:'Arrêt inventaire (%)' },
  p_fee:         { ko:'수수료 (%)', en:'Fee (%)', id:'Biaya (%)', zh:'手续费 (%)', ja:'手数料 (%)', es:'Comisión (%)', vi:'Phí (%)', hi:'शुल्क (%)', pt:'Taxa (%)', tl:'Bayad (%)', fr:'Frais (%)' },
  p_surge_ticks: { ko:'급변 감지 틱', en:'Surge window (ticks)', id:'Tik deteksi lonjakan', zh:'价格急变检测间隔', ja:'急変検出ティック', es:'Ticks de detección de pico', vi:'Ticks phát hiện biến động', hi:'उछाल विंडो (टिक)', pt:'Janela de surto (ticks)', tl:'Surge detection ticks', fr:'Fenêtre de pic (ticks)' },
  p_surge_pct:   { ko:'급변 감지 (%)', en:'Surge threshold (%)', id:'Ambang lonjakan (%)', zh:'价格急变检测 (%)', ja:'急変検出 (%)', es:'Umbral de pico (%)', vi:'Ngưỡng biến động (%)', hi:'उछाल सीमा (%)', pt:'Limiar de surto (%)', tl:'Surge threshold (%)', fr:'Seuil de pic (%)' },
  p_deposit:     { ko:'예치 금액', en:'Deposit amount', id:'Jumlah deposit', zh:'存款金额', ja:'預入金額', es:'Monto de depósito', vi:'Số tiền gửi', hi:'जमा राशि', pt:'Valor do depósito', tl:'Halaga ng deposit', fr:'Montant du dépôt' },
  p_max_il:      { ko:'최대 비영구적 손실 (%)', en:'Max impermanent loss (%)', id:'Maks. kerugian impermanent (%)', zh:'最大无常损失 (%)', ja:'最大無常損失 (%)', es:'Pérdida impermanente máx. (%)', vi:'Tổn thất vô thường tối đa (%)', hi:'अधिकतम अस्थायी हानि (%)', pt:'Perda impermanente máx. (%)', tl:'Max impermanent loss (%)', fr:'Perte impermanente max. (%)' },
  p_target_roi:  { ko:'목표 수익률 (%)', en:'Target ROI (%)', id:'Target ROI (%)', zh:'目标收益率 (%)', ja:'目標ROI (%)', es:'ROI objetivo (%)', vi:'ROI mục tiêu (%)', hi:'लक्ष्य ROI (%)', pt:'ROI alvo (%)', tl:'Target ROI (%)', fr:'ROI cible (%)' },
  p_rec:         { ko:'권장', en:'Rec', id:'Rekm', zh:'推荐', ja:'推奨', es:'Rec', vi:'Đề xuất', hi:'अनुशंसित', pt:'Rec', tl:'Rekm', fr:'Rec' },

  run_title:    { ko:'데이터 수집 및 백테스트', en:'Fetching Data & Backtesting', id:'Pengambilan Data & Backtest', zh:'数据采集与回测', ja:'データ収集＆バックテスト', es:'Recopilación de datos y Backtest', vi:'Thu thập dữ liệu & Backtest', hi:'डेटा संग्रह और बैकटेस्ट', pt:'Coleta de dados e Backtest', tl:'Pagkuha ng data at Backtest', fr:'Collecte de données et Backtest' },
  run_start:    { ko:'시작 중...', en:'Starting...', id:'Memulai...', zh:'启动中...', ja:'開始中...', es:'Iniciando...', vi:'Đang bắt đầu...', hi:'शुरू हो रहा है...', pt:'Iniciando...', tl:'Nagsisimula...', fr:'Démarrage...' },
  run_running:  { ko:'백테스트 실행 중...', en:'Running backtest...', id:'Menjalankan backtest...', zh:'回测运行中...', ja:'バックテスト実行中...', es:'Ejecutando backtest...', vi:'Đang chạy backtest...', hi:'बैकटेस्ट चल रहा है...', pt:'Executando backtest...', tl:'Nagpapatakbo ng backtest...', fr:'Exécution du backtest...' },
  run_done:     { ko:'완료!', en:'Done!', id:'Selesai!', zh:'完成！', ja:'完了！', es:'¡Listo!', vi:'Hoàn thành!', hi:'हो गया!', pt:'Concluído!', tl:'Tapos na!', fr:'Terminé !' },
  run_req:      { ko:'건 요청', en:'records requested', id:'data diminta', zh:'条已请求', ja:'件リクエスト', es:'registros solicitados', vi:'bản ghi đã yêu cầu', hi:'रिकॉर्ड अनुरोधित', pt:'registros solicitados', tl:'mga rekord hiniling', fr:'enregistrements demandés' },
  run_received: { ko:'건 수신', en:'records received', id:'data diterima', zh:'条已接收', ja:'件受信', es:'registros recibidos', vi:'bản ghi đã nhận', hi:'रिकॉर्ड प्राप्त', pt:'registros recebidos', tl:'mga rekord natanggap', fr:'enregistrements reçus' },
  run_valid:    { ko:'유효 거래', en:'valid trades', id:'transaksi valid', zh:'有效交易', ja:'有効取引', es:'operaciones válidas', vi:'giao dịch hợp lệ', hi:'वैध ट्रेड', pt:'negociações válidas', tl:'valid na trades', fr:'transactions valides' },
  run_complete: { ko:'완료', en:'complete', id:'selesai', zh:'完成', ja:'完了', es:'completo', vi:'hoàn thành', hi:'पूर्ण', pt:'completo', tl:'kumpleto', fr:'complet' },
  run_too_few:  { ko:'데이터가 너무 적습니다 (10건 미만)', en:'Too little data (under 10 records)', id:'Data terlalu sedikit (kurang dari 10)', zh:'数据太少（不足10条）', ja:'データが少なすぎます（10件未満）', es:'Datos insuficientes (menos de 10)', vi:'Dữ liệu quá ít (dưới 10 bản ghi)', hi:'डेटा बहुत कम है (10 से कम)', pt:'Dados insuficientes (menos de 10)', tl:'Napakaliit ng data (wala pang 10)', fr:'Données insuffisantes (moins de 10)' },
  run_error:    { ko:'오류', en:'Error', id:'Kesalahan', zh:'错误', ja:'エラー', es:'Error', vi:'Lỗi', hi:'त्रुटि', pt:'Erro', tl:'Error', fr:'Erreur' },
  fetch_timeout:{ ko:'요청 시간 초과 (네트워크 확인 후 다시 시도해주세요)', en:'Request timed out (check your connection and retry)', id:'Waktu permintaan habis (periksa koneksi dan coba lagi)', zh:'请求超时（请检查网络后重试）', ja:'リクエストがタイムアウトしました（接続を確認して再試行してください）', es:'Se agotó el tiempo de la solicitud (verifique su conexión e inténtelo de nuevo)', vi:'Yêu cầu hết thời gian chờ (kiểm tra kết nối và thử lại)', hi:'अनुरोध का समय समाप्त (कनेक्शन जांचें और पुनः प्रयास करें)', pt:'A solicitação expirou (verifique sua conexão e tente novamente)', tl:'Nag-timeout ang request (suriin ang koneksyon at subukan muli)', fr:'La requête a expiré (vérifiez votre connexion et réessayez)' },
  run_live_roi: { ko:'실시간 예상 수익률', en:'Live ROI Preview', id:'Pratinjau ROI', zh:'实时收益预览', ja:'リアルタイム損益', es:'Rentabilidad en Vivo', vi:'ROI Trực Tiếp', hi:'लाइव ROI', pt:'ROI em Tempo Real', tl:'Live ROI', fr:'ROI en Direct' },

  res_summary:   { ko:'종합 결과', en:'Summary', id:'Ringkasan', zh:'综合结果', ja:'総合結果', es:'Resumen', vi:'Tổng kết', hi:'सारांश', pt:'Resumo', tl:'Buod', fr:'Résumé' },
  res_pnl:       { ko:'총 손익', en:'Total P&L', id:'Total P&L', zh:'总盈亏', ja:'総損益', es:'P&L Total', vi:'Tổng P&L', hi:'कुल P&L', pt:'P&L Total', tl:'Kabuuang P&L', fr:'P&L Total' },
  res_spread:    { ko:'스프레드 수익', en:'Spread profit', id:'Profit spread', zh:'价差收益', ja:'スプレッド収益', es:'Ganancia de spread', vi:'Lợi nhuận spread', hi:'स्प्रेड लाभ', pt:'Lucro de spread', tl:'Kita sa spread', fr:'Profit de spread' },
  res_inv:       { ko:'재고 평가손익', en:'Inventory P&L', id:'P&L inventori', zh:'库存评估损益', ja:'在庫評価損益', es:'P&L de inventario', vi:'P&L tồn kho', hi:'इन्वेंटरी P&L', pt:'P&L de inventário', tl:'Inventory P&L', fr:"P&L d'inventaire" },
  res_fees:      { ko:'수수료 합계', en:'Total fees', id:'Total biaya', zh:'总手续费', ja:'手数料合計', es:'Total comisiones', vi:'Tổng phí', hi:'कुल शुल्क', pt:'Total de taxas', tl:'Kabuuang bayad', fr:'Total frais' },
  res_stats:     { ko:'거래 통계', en:'Trade Statistics', id:'Statistik Trading', zh:'交易统计', ja:'取引統計', es:'Estadísticas de Trading', vi:'Thống kê giao dịch', hi:'ट्रेड आँकड़े', pt:'Estatísticas de Trading', tl:'Mga Istatistika sa Trade', fr:'Statistiques de Trading' },
  res_fills:     { ko:'체결 횟수', en:'Fill count', id:'Jumlah fill', zh:'成交次数', ja:'約定回数', es:'Cantidad de fills', vi:'Số lần khớp lệnh', hi:'फिल की संख्या', pt:'Qtd de fills', tl:'Bilang ng fill', fr:'Nombre de fills' },
  res_ticks:     { ko:'분석 틱 수', en:'Ticks analyzed', id:'Tik dianalisis', zh:'分析周期数', ja:'分析ティック数', es:'Ticks analizados', vi:'Số ticks phân tích', hi:'विश्लेषित टिक्स', pt:'Ticks analisados', tl:'Mga tick na sinuri', fr:'Ticks analysés' },
  res_price_chg: { ko:'가격 변화', en:'Price change', id:'Perubahan harga', zh:'价格变化', ja:'価格変化', es:'Cambio de precio', vi:'Thay đổi giá', hi:'मूल्य परिवर्तन', pt:'Variação de preço', tl:'Pagbabago ng presyo', fr:'Variation de prix' },
  res_stop:      { ko:'중단 사유', en:'Stop reason', id:'Alasan berhenti', zh:'中断原因', ja:'停止理由', es:'Razón de parada', vi:'Lý do dừng', hi:'रोकने का कारण', pt:'Motivo de parada', tl:'Dahilan ng paghinto', fr:"Raison d'arrêt" },
  res_log:       { ko:'거래 로그 (최근 20건)', en:'Trade log (last 20)', id:'Log trading (20 terakhir)', zh:'交易日志（最近20条）', ja:'取引ログ（最近20件）', es:'Registro de operaciones (últimas 20)', vi:'Nhật ký giao dịch (20 gần nhất)', hi:'ट्रेड लॉग (अंतिम 20)', pt:'Log de negociações (últimas 20)', tl:'Trade log (huling 20)', fr:'Journal de trading (20 derniers)' },
  res_no_fills:  { ko:'체결 없음', en:'No fills', id:'Tidak ada fill', zh:'无成交', ja:'約定なし', es:'Sin fills', vi:'Không có khớp lệnh', hi:'कोई फिल नहीं', pt:'Sem fills', tl:'Walang fill', fr:'Pas de fills' },
  res_asset_chart:{ ko:'총 자산 추이 (USDC)', en:'Total Asset Trend (USDC)', id:'Tren Total Aset (USDC)', zh:'总资产趋势 (USDC)', ja:'総資産推移 (USDC)', es:'Tendencia de activos totales (USDC)', vi:'Xu hướng tổng tài sản (USDC)', hi:'कुल संपत्ति प्रवृत्ति (USDC)', pt:'Tendência de ativos totais (USDC)', tl:'Trend ng kabuuang asset (USDC)', fr:'Tendance des actifs totaux (USDC)' },
  res_lp_title:  { ko:'LP 수익 결과', en:'LP Return Summary', id:'Ringkasan Return LP', zh:'LP 收益结果', ja:'LP 収益結果', es:'Resumen de retorno LP', vi:'Kết quả lợi nhuận LP', hi:'LP रिटर्न सारांश', pt:'Resumo de retorno LP', tl:'LP Return Summary', fr:'Résumé du rendement LP' },
  res_lp_pnl:    { ko:'LP 총 손익', en:'LP Total P&L', id:'Total P&L LP', zh:'LP 总盈亏', ja:'LP 総損益', es:'P&L Total LP', vi:'Tổng P&L LP', hi:'LP कुल P&L', pt:'P&L Total LP', tl:'LP Total P&L', fr:'P&L Total LP' },
  res_fee_inc:   { ko:'수수료 수익', en:'Fee income', id:'Pendapatan biaya', zh:'手续费收益', ja:'手数料収益', es:'Ingresos por comisiones', vi:'Thu nhập phí', hi:'शुल्क आय', pt:'Renda de taxas', tl:'Kita sa bayad', fr:'Revenus de frais' },
  res_il:        { ko:'비영구적 손실', en:'Impermanent loss', id:'Kerugian impermanent', zh:'无常损失', ja:'無常損失', es:'Pérdida impermanente', vi:'Tổn thất vô thường', hi:'अस्थायी हानि', pt:'Perda impermanente', tl:'Impermanent loss', fr:'Perte impermanente' },
  res_vs_hodl:   { ko:'HODL 대비', en:'vs HODL', id:'vs HODL', zh:'相比 HODL', ja:'HODL 対比', es:'vs HODL', vi:'so với HODL', hi:'HODL की तुलना में', pt:'vs HODL', tl:'kumpara sa HODL', fr:'vs HODL' },
  res_lp_share:  { ko:'내 LP 지분', en:'My LP share', id:'Bagian LP saya', zh:'我的 LP 份额', ja:'私のLP持分', es:'Mi parte LP', vi:'Phần LP của tôi', hi:'मेरा LP हिस्सा', pt:'Minha cota LP', tl:'Aking LP share', fr:'Ma part LP' },
  res_exit:      { ko:'종료 사유', en:'Exit reason', id:'Alasan keluar', zh:'退出原因', ja:'終了理由', es:'Razón de salida', vi:'Lý do thoát', hi:'बाहर निकलने का कारण', pt:'Motivo de saída', tl:'Dahilan ng paglabas', fr:'Raison de sortie' },
  res_lp_chart:  { ko:'LP vs HODL 자산 추이 (USDC)', en:'LP vs HODL Trend (USDC)', id:'Tren LP vs HODL (USDC)', zh:'LP vs HODL 资产趋势 (USDC)', ja:'LP vs HODL 資産推移 (USDC)', es:'Tendencia LP vs HODL (USDC)', vi:'Xu hướng LP vs HODL (USDC)', hi:'LP vs HODL संपत्ति प्रवृत्ति (USDC)', pt:'Tendência LP vs HODL (USDC)', tl:'LP vs HODL trend (USDC)', fr:'Tendance LP vs HODL (USDC)' },
  res_none:      { ko:'결과 없음', en:'No result', id:'Tidak ada hasil', zh:'无结果', ja:'結果なし', es:'Sin resultado', vi:'Không có kết quả', hi:'कोई परिणाम नहीं', pt:'Sem resultado', tl:'Walang resulta', fr:'Aucun résultat' },

  ana_no_fills: { ko:'⚠️ 체결 0회 — 스프레드를 줄이거나 레이어를 늘려보세요', en:'⚠️ 0 fills — Try reducing spread or adding layers', id:'⚠️ 0 fill — Kurangi spread atau tambah layer', zh:'⚠️ 成交0次 — 请缩小价差或增加层数', ja:'⚠️ 約定0回 — スプレッドを縮めるかレイヤーを増やしてください', es:'⚠️ 0 fills — Reduzca el spread o añada capas', vi:'⚠️ 0 lần khớp — Giảm spread hoặc thêm lớp lệnh', hi:'⚠️ 0 फिल — स्प्रेड कम करें या लेयर बढ़ाएं', pt:'⚠️ 0 fills — Reduza o spread ou adicione camadas', tl:'⚠️ 0 fill — Bawasan ang spread o dagdagan ang layer', fr:'⚠️ 0 fills — Réduisez le spread ou ajoutez des couches' },
  ana_good:     { ko:'✅ 스프레드 수익과 전체 손익 모두 플러스', en:'✅ Both spread profit and total P&L are positive', id:'✅ Profit spread dan total P&L keduanya positif', zh:'✅ 价差收益和总盈亏均为正', ja:'✅ スプレッド収益と総損益がともにプラス', es:'✅ Ganancia de spread y P&L total ambos positivos', vi:'✅ Lợi nhuận spread và tổng P&L đều dương', hi:'✅ स्प्रेड लाभ और कुल P&L दोनों सकारात्मक', pt:'✅ Lucro de spread e P&L total ambos positivos', tl:'✅ Parehong positibo ang spread profit at kabuuang P&L', fr:'✅ Profit de spread et P&L total tous deux positifs' },
  ana_inv_loss: { ko:'⚠️ 스프레드 수익은 났지만 가격 변동으로 재고 손실이 더 큼', en:'⚠️ Spread profit positive but inventory loss exceeded it', id:'⚠️ Profit spread ada tapi kerugian inventori lebih besar', zh:'⚠️ 价差收益为正但价格波动导致库存损失更大', ja:'⚠️ スプレッド収益はプラスだが価格変動で在庫損失が大きい', es:'⚠️ Spread positivo pero pérdida de inventario superó las ganancias', vi:'⚠️ Lợi nhuận spread dương nhưng tổn thất tồn kho lớn hơn', hi:'⚠️ स्प्रेड लाभ था लेकिन इन्वेंटरी हानि अधिक', pt:'⚠️ Spread positivo mas perda de inventário foi maior', tl:'⚠️ Positibo ang spread profit ngunit mas malaki ang inventory loss', fr:"⚠️ Spread positif mais la perte d'inventaire l'a dépassé" },
  ana_bad:      { ko:'❌ 체결 부족 또는 수수료가 수익 초과', en:'❌ Too few fills or fees exceeded profit', id:'❌ Fill kurang atau biaya melebihi profit', zh:'❌ 成交不足或手续费超过收益', ja:'❌ 約定不足または手数料が収益超え', es:'❌ Fills insuficientes o comisiones superaron ganancias', vi:'❌ Quá ít khớp lệnh hoặc phí vượt lợi nhuận', hi:'❌ बहुत कम फिल या शुल्क लाभ से अधिक', pt:'❌ Poucos fills ou taxas superaram o lucro', tl:'❌ Kulang ang fill o mas mataas ang bayad kaysa kita', fr:'❌ Trop peu de fills ou frais ont dépassé les profits' },
  ana_amm_good: { ko:'✅ 수수료 수익이 비영구적 손실을 상쇄', en:'✅ Fee income offsets impermanent loss', id:'✅ Pendapatan biaya mengimbangi kerugian impermanent', zh:'✅ 手续费收益抵消了无常损失', ja:'✅ 手数料収益が無常損失を相殺', es:'✅ Los ingresos por comisiones compensaron la pérdida impermanente', vi:'✅ Thu nhập phí bù đắp tổn thất vô thường', hi:'✅ शुल्क आय ने अस्थायी हानि की भरपाई की', pt:'✅ Renda de taxas compensou a perda impermanente', tl:'✅ Nayosi ng kita sa bayad ang impermanent loss', fr:'✅ Les revenus de frais ont compensé la perte impermanente' },
  ana_amm_bad:  { ko:'⚠️ 비영구적 손실이 수수료 수익보다 큼', en:'⚠️ Impermanent loss exceeds fee income', id:'⚠️ Kerugian impermanent melebihi pendapatan biaya', zh:'⚠️ 无常损失超过手续费收益', ja:'⚠️ 無常損失が手数料収益を超えた', es:'⚠️ La pérdida impermanente superó los ingresos por comisiones', vi:'⚠️ Tổn thất vô thường vượt thu nhập phí', hi:'⚠️ अस्थायी हानि शुल्क आय से अधिक', pt:'⚠️ Perda impermanente superou renda de taxas', tl:'⚠️ Mas mataas ang impermanent loss kaysa kita sa bayad', fr:'⚠️ La perte impermanente a dépassé les revenus de frais' },

  chart_total:  { ko:'총 자산', en:'Total Asset', id:'Total Aset', zh:'总资产', ja:'総資産', es:'Activos Totales', vi:'Tổng tài sản', hi:'कुल संपत्ति', pt:'Ativos Totais', tl:'Kabuuang asset', fr:'Actifs Totaux' },
  chart_lp:     { ko:'LP 자산', en:'LP Asset', id:'Aset LP', zh:'LP 资产', ja:'LP資産', es:'Activos LP', vi:'Tài sản LP', hi:'LP संपत्ति', pt:'Ativos LP', tl:'LP asset', fr:'Actifs LP' },
  chart_hodl:   { ko:'HODL', en:'HODL', id:'HODL', zh:'HODL', ja:'HODL', es:'HODL', vi:'HODL', hi:'HODL', pt:'HODL', tl:'HODL', fr:'HODL' },

  auto_pool_title: { ko:'분석할 풀 선택', en:'Select Pools to Scan', id:'Pilih Pool untuk Dipindai', zh:'选择要扫描的池', ja:'スキャンするプールを選択', es:'Seleccionar Pools a Escanear', vi:'Chọn Pool để Quét', hi:'स्कैन के लिए पूल चुनें', pt:'Selecionar Pools para Escanear', tl:'Piliin ang Pools na I-scan', fr:'Sélectionner les Pools à Scanner' },
  auto_sel_all:    { ko:'이 페이지 전체 선택', en:'Select This Page', id:'Pilih Halaman Ini', zh:'选择本页', ja:'このページを全選択', es:'Seleccionar Esta Página', vi:'Chọn trang này', hi:'यह पेज चुनें', pt:'Selecionar Esta Página', tl:'Piliin ang Page na Ito', fr:'Sélectionner Cette Page' },
  auto_desel_all:  { ko:'이 페이지 전체 해제', en:'Deselect This Page', id:'Hapus Halaman Ini', zh:'取消本页', ja:'このページを全解除', es:'Deseleccionar Esta Página', vi:'Bỏ chọn trang này', hi:'यह पेज हटाएं', pt:'Desmarcar Esta Página', tl:'I-deselect ang Page na Ito', fr:'Désélectionner Cette Page' },
  auto_selected:   { ko:'개 선택됨', en:'selected', id:'dipilih', zh:'已选', ja:'個選択中', es:'seleccionados', vi:'đã chọn', hi:'चुने गए', pt:'selecionados', tl:'napili', fr:'sélectionnés' },
  scan_title:      { ko:'스캔 설정', en:'Scan Settings', id:'Pengaturan Scan', zh:'扫描设置', ja:'スキャン設定', es:'Configuración de Escaneo', vi:'Cài đặt Quét', hi:'स्कैन सेटिंग्स', pt:'Configurações de Varredura', tl:'Mga Setting ng Scan', fr:'Paramètres de Scan' },
  scan_simulating: { ko:'시뮬 중...', en:'Simulating...', id:'Menyimulasikan...', zh:'模拟中...', ja:'シミュレーション中...', es:'Simulando...', vi:'Đang mô phỏng...', hi:'सिमुलेशन चल रहा है...', pt:'Simulando...', tl:'Nagsisimulate...', fr:'Simulation en cours...' },
  scan_sub_strat:  { ko:'분석 전략', en:'Strategy to Test', id:'Strategi', zh:'分析策略', ja:'分析戦略', es:'Estrategia', vi:'Chiến lược', hi:'रणनीति', pt:'Estratégia', tl:'Estratehiya', fr:'Stratégie' },
  scan_records:    { ko:'풀당 거래 건수', en:'Records per Pool', id:'Rekaman per Pool', zh:'每池交易数', ja:'プールあたりの件数', es:'Registros por Pool', vi:'Số giao dịch mỗi pool', hi:'प्रति पूल रिकॉर्ड', pt:'Registros por Pool', tl:'Mga Record bawat Pool', fr:'Enregistrements par Pool' },
  scan_spreads:    { ko:'스프레드 옵션 (%)', en:'Spread Options (%)', id:'Opsi Spread (%)', zh:'价差选项 (%)', ja:'スプレッドオプション (%)', es:'Opciones de Spread (%)', vi:'Tùy chọn Spread (%)', hi:'स्प्रेड विकल्प (%)', pt:'Opções de Spread (%)', tl:'Mga Opsyon ng Spread (%)', fr:'Options de Spread (%)' },
  scan_running:    { ko:'분석 중', en:'Scanning', id:'Memindai', zh:'扫描中', ja:'スキャン中', es:'Escaneando', vi:'Đang quét', hi:'स्कैन हो रहा है', pt:'Varrendo', tl:'Nag-sca-scan', fr:'En cours de scan' },
  scan_done:       { ko:'스캔 완료', en:'Scan Complete', id:'Scan Selesai', zh:'扫描完成', ja:'スキャン完了', es:'Escaneo Completo', vi:'Quét xong', hi:'स्कैन पूर्ण', pt:'Varredura Completa', tl:'Tapos na ang Scan', fr:'Scan Terminé' },
  res_scan_title:  { ko:'최적화 결과', en:'Optimization Results', id:'Hasil Optimasi', zh:'优化结果', ja:'最適化結果', es:'Resultados de Optimización', vi:'Kết quả Tối ưu hóa', hi:'अनुकूलन परिणाम', pt:'Resultados de Otimização', tl:'Mga Resulta ng Optimization', fr:"Résultats d'Optimisation" },
  res_scan_use:    { ko:'이 설정으로 백테스트', en:'Backtest this setup', id:'Backtest pengaturan ini', zh:'用此设置回测', ja:'この設定でバックテスト', es:'Backtest con esta configuración', vi:'Backtest với cài đặt này', hi:'इस सेटअप से बैकटेस्ट', pt:'Backtest com esta configuração', tl:'I-backtest ang setup na ito', fr:'Backtest avec cette configuration' },
  res_scan_empty:  { ko:'결과 없음 — 다시 시도해주세요', en:'No results — please retry', id:'Tidak ada hasil — coba lagi', zh:'无结果 — 请重试', ja:'結果なし — 再試行してください', es:'Sin resultados — intente de nuevo', vi:'Không có kết quả — thử lại', hi:'कोई परिणाम नहीं — पुनः प्रयास करें', pt:'Sem resultados — tente novamente', tl:'Walang resulta — subukan muli', fr:'Aucun résultat — réessayez' },
  scan_data_short: { ko:'데이터 부족', en:'Insufficient data', id:'Data tidak cukup', zh:'数据不足', ja:'データ不足', es:'Datos insuficientes', vi:'Thiếu dữ liệu', hi:'अपर्याप्त डेटा', pt:'Dados insuficientes', tl:'Kulang ang data', fr:'Données insuffisantes' },
  scan_interrupted:{ ko:'중단됨', en:'interrupted', id:'dihentikan', zh:'已中断', ja:'中断', es:'interrumpido', vi:'bị gián đoạn', hi:'बाधित', pt:'interrompido', tl:'naputol', fr:'interrompu' },

  auto_quota:      { ko:'자동최적화 남은 횟수', en:'Auto-optimize remaining', id:'Sisa optimize otomatis', zh:'自动优化剩余次数', ja:'自動最適化残り回数', es:'Auto-optimización restante', vi:'Còn lại tự động tối ưu', hi:'ऑटो-ऑप्टिमाइज शेष', pt:'Otimização automática restante', tl:'Natitira sa auto-optimize', fr:'Auto-optimisation restante' },
  auto_quota_over: { ko:'오늘 자동최적화 횟수를 모두 사용했습니다. 이용권 구매 시 더 이용 가능합니다.', en:'Daily auto-optimize limit reached. Subscribe for more.', id:'Batas optimize otomatis hari ini tercapai. Beli paket untuk lebih banyak.', zh:'今日自动优化次数已用完。订阅后可获更多次数。', ja:'本日の自動最適化回数を使い切りました。購読でさらに利用できます。', es:'Límite diario de auto-optimización alcanzado. Suscríbete para más.', vi:'Đã hết lần tối ưu hôm nay. Đăng ký để có thêm.', hi:'आज का ऑटो-ऑप्टिमाइज सीमा पहुंच गई। अधिक के लिए सदस्यता लें।', pt:'Limite diário de otimização atingido. Assine para mais.', tl:'Naabot na ang limitasyon ngayon. Mag-subscribe para sa mas marami.', fr:'Limite journalière atteinte. Abonnez-vous pour plus.' },
  auto_sub_info:   { ko:'정보 탭에서 이용권 구매 →', en:'Buy Pass in Info panel →', id:'Beli paket di panel Info →', zh:'在信息面板购买使用权 →', ja:'情報パネルで利用券を購入 →', es:'Comprar pase en panel Info →', vi:'Mua gói ở bảng Thông tin →', hi:'जानकारी पैनल में पास खरीदें →', pt:'Comprar passe no painel Info →', tl:'Bilhin ang pass sa Info panel →', fr:"Acheter pass dans Info →" },
  sub_active_s:    { ko:'⭐ 이용권 활성', en:'⭐ Pass Active', id:'⭐ Paket Aktif', zh:'⭐ 使用权有效', ja:'⭐ 利用券有効', es:'⭐ Pase Activo', vi:'⭐ Gói Hiệu Lực', hi:'⭐ पास सक्रिय', pt:'⭐ Passe Ativo', tl:'⭐ Pass Aktibo', fr:'⭐ Pass Actif' },

  stop_surge:     { ko:'급변 감지', en:'Surge detected', id:'Lonjakan terdeteksi', zh:'急变检测', ja:'急変検出', es:'Pico detectado', vi:'Phát hiện biến động', hi:'उछाल पकड़ा', pt:'Pico detectado', tl:'Surge detected', fr:'Pic détecté' },
  stop_inv_hi:    { ko:'네이티브 재고', en:'Native inventory', id:'Inventori native', zh:'原生资产库存', ja:'ネイティブ在庫', es:'Inventario nativo', vi:'Tồn kho native', hi:'नेटिव इन्वेंटरी', pt:'Inventário nativo', tl:'Native inventory', fr:'Inventaire natif' },
  stop_inv_lo:    { ko:'USDC 재고', en:'USDC inventory', id:'Inventori USDC', zh:'USDC 库存', ja:'USDC在庫', es:'Inventario USDC', vi:'Tồn kho USDC', hi:'USDC इन्वेंटरी', pt:'Inventário USDC', tl:'USDC inventory', fr:'Inventaire USDC' },
  stop_exceeded:  { ko:'초과', en:'exceeded', id:'terlampaui', zh:'超出', ja:'超過', es:'excedido', vi:'vượt', hi:'अधिक', pt:'excedido', tl:'nalampasan', fr:'dépassé' },
  log_buy:        { ko:'매수', en:'Buy', id:'Beli', zh:'买入', ja:'買い', es:'Compra', vi:'Mua', hi:'खरीद', pt:'Compra', tl:'Bili', fr:'Achat' },
  log_sell:       { ko:'매도', en:'Sell', id:'Jual', zh:'卖出', ja:'売り', es:'Venta', vi:'Bán', hi:'बेची', pt:'Venda', tl:'Ibenta', fr:'Vente' },
  amm_reached:    { ko:'도달', en:'reached', id:'tercapai', zh:'触发', ja:'到達', es:'alcanzado', vi:'đạt', hi:'पहुंचा', pt:'atingido', tl:'naabot', fr:'atteint' },
  amm_achieved:   { ko:'달성', en:'achieved', id:'dicapai', zh:'达成', ja:'達成', es:'logrado', vi:'đạt được', hi:'प्राप्त', pt:'atingido', tl:'nakamit', fr:'atteint' },
  amm_target_roi: { ko:'목표 수익률', en:'Target ROI', id:'Target ROI', zh:'目标收益率', ja:'目標収益率', es:'ROI objetivo', vi:'ROI mục tiêu', hi:'लक्ष्य ROI', pt:'ROI alvo', tl:'Target ROI', fr:'ROI cible' },

  pool_7d_trades: { ko:'7d거래', en:'7d trades', id:'Transaksi 7h', zh:'7天交易', ja:'7日取引', es:'Ops 7d', vi:'GD 7 ngày', hi:'7d ट्रेड', pt:'Negoc. 7d', tl:'7d trades', fr:'Opér. 7j' },
  pool_count_unit:{ ko:'건', en:'', id:'', zh:'笔', ja:'件', es:'', vi:'', hi:'', pt:'', tl:'', fr:'' },
  pool_est_apy:   { ko:'예상APY', en:'Est.APY', id:'APY Est.', zh:'预计APY', ja:'予想APY', es:'APY Est.', vi:'APY ước', hi:'अनु. APY', pt:'APY est.', tl:'Est.APY', fr:'APY est.' },

  opt_spread: { ko:'스프레드', en:'Spread', id:'Spread', zh:'价差', ja:'スプレッド', es:'Spread', vi:'Chênh lệch', hi:'स्प्रेड', pt:'Spread', tl:'Spread', fr:'Écart' },
  opt_ratio:  { ko:'비율', en:'Ratio', id:'Rasio', zh:'比率', ja:'比率', es:'Ratio', vi:'Tỷ lệ', hi:'अनुपात', pt:'Razão', tl:'Ratio', fr:'Ratio' },
  opt_fills:  { ko:'체결', en:'fills', id:'fill', zh:'成交', ja:'約定', es:'fills', vi:'khớp', hi:'फिल', pt:'fills', tl:'fills', fr:'fills' },

  sec_backtest: { ko:'백테스트', en:'Backtest', id:'Backtest', zh:'回测', ja:'バックテスト', es:'Backtest', vi:'Backtest', hi:'बैकटेस्ट', pt:'Backtest', tl:'Backtest', fr:'Backtest' },
  sec_tracking: { ko:'내 LP 추적', en:'My LP Tracking', id:'Pelacakan LP Saya', zh:'我的LP追踪', ja:'マイLP追跡', es:'Seguimiento de mi LP', vi:'Theo dõi LP của tôi', hi:'मेरी LP ट्रैकिंग', pt:'Rastreamento da minha LP', tl:'Aking LP Tracking', fr:'Suivi de mon LP' },
  track_title:  { ko:'내 LP 포지션', en:'My LP Positions', id:'Posisi LP Saya', zh:'我的LP仓位', ja:'マイLPポジション', es:'Mis posiciones LP', vi:'Vị thế LP của tôi', hi:'मेरी LP पोजीशन', pt:'Minhas posições LP', tl:'Aking mga LP Position', fr:'Mes positions LP' },
  track_empty:  { ko:'등록된 포지션이 없습니다. AMM 백테스트 결과 화면에서 등록할 수 있어요.', en:'No positions registered. You can register one from the AMM backtest result screen.', id:'Belum ada posisi. Anda bisa mendaftar dari layar hasil backtest AMM.', zh:'尚未注册仓位。可在AMM回测结果页面注册。', ja:'登録されたポジションがありません。AMMバックテスト結果画面から登録できます。', es:'No hay posiciones registradas. Puede registrar una desde la pantalla de resultados del backtest AMM.', vi:'Chưa có vị thế nào. Bạn có thể đăng ký từ màn hình kết quả backtest AMM.', hi:'कोई पोजीशन पंजीकृत नहीं। AMM बैकटेस्ट परिणाम स्क्रीन से पंजीकृत करें।', pt:'Nenhuma posição registrada. Você pode registrar na tela de resultados do backtest AMM.', tl:'Walang nakarehistrong position. Maaari kang magrehistro mula sa AMM backtest result screen.', fr:"Aucune position enregistrée. Vous pouvez en enregistrer une depuis l'écran de résultats du backtest AMM." },
  track_goto_backtest: { ko:'백테스트로 이동', en:'Go to Backtest', id:'Ke Backtest', zh:'前往回测', ja:'バックテストへ', es:'Ir al Backtest', vi:'Đến Backtest', hi:'बैकटेस्ट पर जाएं', pt:'Ir para o Backtest', tl:'Pumunta sa Backtest', fr:'Aller au Backtest' },
  track_add_title: { ko:'포지션 등록', en:'Register Position', id:'Daftarkan Posisi', zh:'注册仓位', ja:'ポジション登録', es:'Registrar Posición', vi:'Đăng ký vị thế', hi:'पोजीशन पंजीकृत करें', pt:'Registrar Posição', tl:'Irehistro ang Position', fr:'Enregistrer la Position' },
  track_alias_ph:  { ko:'별칭 (예: XLM/USDC 메인)', en:'Alias (e.g. XLM/USDC Main)', id:'Alias (mis. XLM/USDC Utama)', zh:'别名（例：XLM/USDC主）', ja:'エイリアス（例：XLM/USDCメイン）', es:'Alias (ej. XLM/USDC Principal)', vi:'Biệt danh (vd: XLM/USDC Chính)', hi:'उपनाम (जैसे XLM/USDC मुख्य)', pt:'Apelido (ex. XLM/USDC Principal)', tl:'Alias (hal. XLM/USDC Main)', fr:'Alias (ex. XLM/USDC Principal)' },
  track_deposit_ph:{ ko:'예치 가치 (USDC)', en:'Deposit value (USDC)', id:'Nilai deposit (USDC)', zh:'存款价值（USDC）', ja:'預入価値（USDC）', es:'Valor del depósito (USDC)', vi:'Giá trị gửi (USDC)', hi:'जमा मूल्य (USDC)', pt:'Valor do depósito (USDC)', tl:'Halaga ng deposit (USDC)', fr:'Valeur du dépôt (USDC)' },
  track_wallet_ph: { ko:'지갑 주소 (선택, G...)', en:'Wallet address (optional, G...)', id:'Alamat dompet (opsional, G...)', zh:'钱包地址（可选，G...）', ja:'ウォレットアドレス（任意、G...）', es:'Dirección de cartera (opcional, G...)', vi:'Địa chỉ ví (tùy chọn, G...)', hi:'वॉलेट पता (वैकल्पिक, G...)', pt:'Endereço da carteira (opcional, G...)', tl:'Wallet address (opsyonal, G...)', fr:'Adresse du portefeuille (facultatif, G...)' },
  track_wallet_hint: { ko:'지갑을 등록하면 실제 보유 지분으로 정확히 계산됩니다', en:'If you add a wallet, we use its real LP share balance for exact tracking', id:'Jika menambahkan dompet, kami gunakan saldo LP nyata untuk pelacakan akurat', zh:'添加钱包后将使用真实LP份额进行精确计算', ja:'ウォレットを登録すると実際の保有持分で正確に計算されます', es:'Si añade una cartera, usamos su saldo real de LP para un seguimiento exacto', vi:'Nếu thêm ví, chúng tôi dùng số dư LP thực để theo dõi chính xác', hi:'वॉलेट जोड़ने पर वास्तविक LP शेयर बैलेंस से सटीक ट्रैकिंग होगी', pt:'Se adicionar uma carteira, usamos o saldo real de LP para rastreamento exato', tl:'Kung magdagdag ka ng wallet, gagamitin namin ang tunay na LP share balance', fr:'Si vous ajoutez un portefeuille, nous utilisons son solde LP réel pour un suivi exact' },
  track_delete_confirm: { ko:'이 포지션을 삭제할까요?', en:'Delete this position?', id:'Hapus posisi ini?', zh:'删除此仓位？', ja:'このポジションを削除しますか？', es:'¿Eliminar esta posición?', vi:'Xóa vị thế này?', hi:'इस पोजीशन को हटाएं?', pt:'Excluir esta posição?', tl:'Tanggalin ang position na ito?', fr:'Supprimer cette position ?' },
  track_no_shares: { ko:'⚠️ 이 지갑은 현재 지분이 없습니다 (인출된 것으로 보임)', en:'⚠️ This wallet currently holds no shares (likely withdrawn)', id:'⚠️ Dompet ini tidak memiliki saham (kemungkinan sudah ditarik)', zh:'⚠️ 该钱包目前没有份额（可能已提取）', ja:'⚠️ このウォレットは現在持分がありません（引き出し済みの可能性）', es:'⚠️ Esta cartera actualmente no tiene participaciones (probablemente retiradas)', vi:'⚠️ Ví này hiện không có cổ phần (có thể đã rút)', hi:'⚠️ इस वॉलेट में फिलहाल कोई हिस्सा नहीं (शायद निकाला गया)', pt:'⚠️ Esta carteira atualmente não possui cotas (provavelmente retiradas)', tl:'⚠️ Walang shares ang wallet na ito ngayon (posibleng na-withdraw na)', fr:"⚠️ Ce portefeuille ne détient actuellement aucune part (probablement retirée)" },
  track_approx: { ko:'근사치 (수수료 미포함)', en:'Approximate (fees not included)', id:'Perkiraan (biaya tidak termasuk)', zh:'近似值（不含手续费）', ja:'概算（手数料含まず）', es:'Aproximado (sin comisiones)', vi:'Gần đúng (chưa gồm phí)', hi:'अनुमानित (शुल्क शामिल नहीं)', pt:'Aproximado (sem taxas)', tl:'Approximate (hindi kasama ang bayad)', fr:'Approximatif (frais non inclus)' },
  track_exact:  { ko:'실계좌 기준 (정확)', en:'Based on real wallet (exact)', id:'Berdasarkan dompet nyata (akurat)', zh:'基于真实钱包（精确）', ja:'実ウォレット基準（正確）', es:'Basado en cartera real (exacto)', vi:'Dựa trên ví thực (chính xác)', hi:'वास्तविक वॉलेट आधारित (सटीक)', pt:'Baseado na carteira real (exato)', tl:'Batay sa tunay na wallet (eksakto)', fr:'Basé sur le portefeuille réel (exact)' },
  track_register_btn: { ko:'오늘 예치 등록', en:'Register Today’s Deposit', id:'Daftarkan Deposit Hari Ini', zh:'注册今日存款', ja:'本日の預入を登録', es:'Registrar depósito de hoy', vi:'Đăng ký gửi hôm nay', hi:'आज का जमा पंजीकृत करें', pt:'Registrar depósito de hoje', tl:'Irehistro ang Deposit Ngayon', fr:"Enregistrer le dépôt d'aujourd'hui" },
  track_registered_toast: { ko:'등록 완료', en:'Registered', id:'Terdaftar', zh:'已注册', ja:'登録完了', es:'Registrado', vi:'Đã đăng ký', hi:'पंजीकृत', pt:'Registrado', tl:'Nairehistro', fr:'Enregistré' },
  track_load_fail: { ko:'불러오기 실패 (로그인이 필요할 수 있어요)', en:'Failed to load (login may be required)', id:'Gagal memuat (mungkin perlu login)', zh:'加载失败（可能需要登录）', ja:'読み込み失敗（ログインが必要な場合があります）', es:'Error al cargar (puede requerir inicio de sesión)', vi:'Tải thất bại (có thể cần đăng nhập)', hi:'लोड विफल (लॉगिन आवश्यक हो सकता है)', pt:'Falha ao carregar (login pode ser necessário)', tl:'Nabigo ang pag-load (maaaring kailangan mag-login)', fr:'Échec du chargement (connexion peut-être requise)' },
  track_fail: { ko:'오류가 발생했습니다', en:'An error occurred', id:'Terjadi kesalahan', zh:'发生错误', ja:'エラーが発生しました', es:'Ocurrió un error', vi:'Đã xảy ra lỗi', hi:'एक त्रुटि हुई', pt:'Ocorreu um erro', tl:'May naganap na error', fr:'Une erreur est survenue' },
  track_date: { ko:'등록일', en:'Registered', id:'Terdaftar', zh:'注册日期', ja:'登録日', es:'Registrado', vi:'Ngày đăng ký', hi:'पंजीकरण तिथि', pt:'Registrado em', tl:'Petsa ng Rehistro', fr:"Date d'enregistrement" },
  track_current_value: { ko:'현재 가치', en:'Current Value', id:'Nilai Saat Ini', zh:'当前价值', ja:'現在価値', es:'Valor Actual', vi:'Giá trị hiện tại', hi:'वर्तमान मूल्य', pt:'Valor Atual', tl:'Kasalukuyang Halaga', fr:'Valeur Actuelle' },
  track_entry_value: { ko:'예치 시 가치', en:'Value at Entry', id:'Nilai saat Masuk', zh:'存入时价值', ja:'預入時価値', es:'Valor al Ingresar', vi:'Giá trị lúc gửi', hi:'प्रवेश पर मूल्य', pt:'Valor na Entrada', tl:'Halaga sa Entry', fr:"Valeur à l'Entrée" },
  track_save: { ko:'등록', en:'Register', id:'Daftar', zh:'注册', ja:'登録', es:'Registrar', vi:'Đăng ký', hi:'पंजीकृत करें', pt:'Registrar', tl:'Irehistro', fr:'Enregistrer' },
  track_no_login: { ko:'Pi 로그인이 필요합니다.', en:'Pi login required.', id:'Login Pi diperlukan.', zh:'需要 Pi 登录。', ja:'Piログインが必要です。', es:'Se requiere inicio de sesión de Pi.', vi:'Cần đăng nhập Pi.', hi:'Pi लॉगिन आवश्यक।', pt:'Login Pi necessário.', tl:'Kailangan ng Pi login.', fr:'Connexion Pi requise.' },
  track_deposit_required: { ko:'예치 가치를 입력해주세요', en:'Please enter a deposit value', id:'Silakan masukkan nilai deposit', zh:'请输入存款价值', ja:'預入価値を入力してください', es:'Ingrese un valor de depósito', vi:'Vui lòng nhập giá trị gửi', hi:'कृपया जमा मूल्य दर्ज करें', pt:'Insira um valor de depósito', tl:'Maglagay ng halaga ng deposit', fr:'Veuillez entrer une valeur de dépôt' },
};

function tr(s) {
  const lang = getLang();
  return s?.[lang] ?? s?.en ?? s?.ko ?? '';
}

// ── Networks (Pi DEX = testnet for now — mainnet has zero trade activity) ──
const NETWORKS = {
  stellar: { name: 'Stellar Mainnet', horizon: 'https://horizon.stellar.org', native: 'XLM' },
  pi:      { name: 'Pi DEX Testnet',  horizon: 'https://api.testnet.minepi.com', native: 'PI' },
};

// ── Auto-optimize quota (own keys, not shared with arbitrage) ──
const MM_KEYS = { AUTO_COUNT: 'mm_auto_count', AUTO_DATE: 'mm_auto_date' };
const MM_FREE_LIMIT = 30;
const MM_SUB_LIMIT  = 100;

function mmGetAutoCount() {
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(MM_KEYS.AUTO_DATE) !== today) {
    localStorage.setItem(MM_KEYS.AUTO_DATE, today);
    localStorage.setItem(MM_KEYS.AUTO_COUNT, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(MM_KEYS.AUTO_COUNT) ?? '0', 10);
}
function mmIncrementAutoCount() {
  const count = mmGetAutoCount() + 1;
  localStorage.setItem(MM_KEYS.AUTO_COUNT, String(count));
  return count;
}
function mmCanUseAuto() {
  const count = mmGetAutoCount();
  return isSubscribed() ? count < MM_FREE_LIMIT + MM_SUB_LIMIT : count < MM_FREE_LIMIT;
}
function mmRemainingAuto() {
  const count = mmGetAutoCount();
  return isSubscribed() ? Math.max(0, MM_FREE_LIMIT + MM_SUB_LIMIT - count) : Math.max(0, MM_FREE_LIMIT - count);
}

// ── CSS injection ──────────────────────────────────────
function ensureStyles() {
  if (document.getElementById('mm-styles')) return;
  const style = document.createElement('style');
  style.id = 'mm-styles';
  style.textContent = `
.mm-container .mm-section-toggle { display:flex; gap:4px; background:var(--bg2); border-radius:var(--radius-sm); padding:4px; margin-bottom:14px; }
.mm-container .mm-sec-btn { flex:1; border:none; background:transparent; color:var(--text2); font-size:12px; font-weight:600; padding:8px 4px; border-radius:6px; cursor:pointer; }
.mm-container .mm-sec-btn.active { background:var(--accent); color:#fff; }
.mm-container .step-dots { display:flex; gap:6px; margin-bottom:6px; }
.mm-container .step-dot { flex:1; height:4px; border-radius:2px; background:var(--bg3); }
.mm-container .step-dot.active { background:var(--accent); }
.mm-container .step-dot.done { background:var(--accent2); }
.mm-container .step-label { font-size:11px; color:var(--text2); margin-bottom:14px; }
.mm-container .mm-alert { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px 12px; font-size:12px; color:var(--text2); margin-bottom:10px; }
.mm-container .mm-alert.info { border-color:var(--accent2); color:var(--text); }
.mm-container .mm-alert.error { border-color:var(--red); color:var(--red); }
.mm-container .status-text { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text2); padding:10px 0; }
.mm-container .mm-progress-bar { width:100%; height:6px; background:var(--bg3); border-radius:3px; overflow:hidden; margin:8px 0; }
.mm-container .mm-progress-fill { height:100%; background:var(--accent); width:0%; transition:width .2s ease; }
.mm-container .mm-log-list { max-height:220px; overflow-y:auto; font-size:11px; color:var(--text2); font-family:monospace; line-height:1.6; }
.mm-container .mm-log-list .log-buy  { color:var(--green); }
.mm-container .mm-log-list .log-sell { color:var(--red); }
.mm-container .mm-log-list .log-stop { color:var(--yellow); }
.mm-container .mm-chart-container { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:14px; margin-bottom:12px; }
.mm-container .mm-chart-title { font-size:12px; color:var(--text2); margin-bottom:8px; }
.mm-container .mm-chart-container canvas { max-width:100%; }
.mm-container .mm-pager { display:flex; align-items:center; justify-content:center; gap:10px; margin-top:8px; }
.mm-container .mm-pager-info { font-size:12px; color:var(--text2); }
.mm-container .param-hint { font-size:11px; color:var(--text2); margin-left:6px; font-weight:400; }
.mm-container .mm-live-roi-box { text-align:center; background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:14px 10px; margin-bottom:10px; }
.mm-container .mm-live-roi-val { font-size:1.7rem; font-weight:700; color:var(--text2); transition:color .4s; }
.mm-container .mm-live-roi-lbl { font-size:0.72rem; color:var(--text2); margin-top:3px; }
.mm-container .mm-strategy-tag { color:#fff; font-size:0.78rem; font-weight:700; padding:3px 12px; border-radius:12px; }
.mm-container .mm-form-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.mm-container .mm-nav-row { display:flex; gap:8px; margin-top:12px; }
.mm-container .mm-nav-row .btn-primary, .mm-container .mm-nav-row .btn-outline { width:auto; flex:1; }
.mm-container .mm-radio-row { display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.92rem; margin-bottom:8px; }
.mm-container .mm-radio-row input { accent-color:var(--accent); width:16px; height:16px; flex-shrink:0; }
.mm-container .mm-check-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px; }
.mm-container .mm-scan-result-row { display:flex; flex-direction:column; gap:5px; padding:12px 0; border-bottom:1px solid var(--border); }
.mm-container .mm-scan-result-row:last-child { border-bottom:none; }
.mm-container .mm-scan-result-head { display:flex; justify-content:space-between; width:100%; align-items:center; }
.mm-container .mm-scan-result-meta { font-size:0.78rem; color:var(--text2); }
`;
  document.head.appendChild(style);
}

// ── Chart.js lazy loader ───────────────────────────────
let _chartLoadPromise = null;
function loadChartJs() {
  if (window.Chart) return Promise.resolve();
  if (_chartLoadPromise) return _chartLoadPromise;
  _chartLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Chart.js load failed'));
    document.head.appendChild(s);
  });
  return _chartLoadPromise;
}

// ── Module state ───────────────────────────────────────
let rootContainer = null;
let state = null;
let poolSearchQuery = '';
let poolPage = 0;
const POOL_PAGE_SIZE = 10;
let activeChart = null;
let _fetchStop = false;
let scanSelectedIds = new Set();
let scanSelectionSet = false;
let piTotalFetched = 0;

function freshState() {
  return {
    step: 1, network: null, strategy: null, pool: null,
    params: {}, result: null, pools: [], scanParams: {}, scanResults: [],
  };
}

// ═══════════════════════════════════════════════════════
//  HORIZON API
// ═══════════════════════════════════════════════════════

function horizonBase() { return NETWORKS[state.network].horizon; }

const FETCH_TIMEOUT_MS = 15000;
let _currentAbort = null;

async function apiFetch(url) {
  const controller = new AbortController();
  _currentAbort = controller;
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(_fetchStop ? 'stopped' : tr(S.fetch_timeout));
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function strKeyToHex(strKey) {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = [];
  let buf = 0, bufLen = 0;
  for (const c of strKey) {
    const idx = ALPHA.indexOf(c);
    if (idx < 0) continue;
    buf = (buf << 5) | idx;
    bufLen += 5;
    if (bufLen >= 8) {
      bufLen -= 8;
      bytes.push((buf >> bufLen) & 0xff);
      buf &= (1 << bufLen) - 1;
    }
  }
  return bytes.slice(1, 33).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchPools() {
  const expertResp = await apiFetch('https://api.stellar.expert/explorer/public/liquidity-pool?sort=volume&order=desc&limit=200');
  if (!expertResp.ok) throw new Error(`Stellar Expert API ${expertResp.status}`);
  const expertJson = await expertResp.json();
  const expertPools = expertJson._embedded?.records || [];
  if (!expertPools.length) throw new Error('Stellar Expert empty result');

  const xlmPools = expertPools.filter(p => p.assets?.some(a => a.asset === 'XLM'));
  if (!xlmPools.length) throw new Error('No XLM pools');

  if (state.strategy === 'orderbook' || state.strategy === 'auto') {
    const active = xlmPools.filter(p => (p.trades?.['7d'] || 0) >= 100);
    const candidates = active.length >= 10 ? active : xlmPools;
    const maxTrades = Math.max(...candidates.map(p => p.trades?.['7d'] || 0)) || 1;
    const maxAcc    = Math.max(...candidates.map(p => p.accounts || 0)) || 1;
    candidates.sort((a, b) => {
      const score = p => 0.9 * ((p.trades?.['7d'] || 0) / maxTrades) + 0.1 * ((p.accounts || 0) / maxAcc);
      return score(b) - score(a);
    });
    xlmPools.length = 0;
    xlmPools.push(...candidates);
  } else {
    xlmPools.sort((a, b) => {
      const ratio = p => (p.volume_value?.['7d'] || 0) / Math.max(p.total_value_locked || 1, 1);
      return ratio(b) - ratio(a);
    });
  }

  const top50 = xlmPools.slice(0, 50);
  const expertMap = new Map(top50.map((p, i) => [strKeyToHex(p.id), { ex: p, rank: i }]));
  const base = horizonBase();
  const details = await Promise.all(
    top50.map(p => {
      const hexId = strKeyToHex(p.id);
      return apiFetch(`${base}/liquidity_pools/${hexId}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);
    })
  );

  return details.filter(p => p && hasNative(p))
    .map(p => {
      const info = expertMap.get(p.id);
      if (info) {
        p._rank     = info.rank;
        p._vol7d    = info.ex.volume_value?.['7d'] || 0;
        p._tvl      = info.ex.total_value_locked || 0;
        p._trades7d = info.ex.trades?.['7d'] || 0;
        p._accounts = info.ex.accounts || 0;
      }
      return p;
    })
    .sort((a, b) => (a._rank ?? 999) - (b._rank ?? 999));
}

function hasNative(pool) {
  return pool.reserves?.some(r => r.asset === 'native');
}

async function fetchTradesForPair(pool, total, onProgress) {
  const r0 = pool.reserves[0];
  const r1 = pool.reserves[1];
  const isNative0 = r0.asset === 'native';
  const other = isNative0 ? r1 : r0;
  const [code, issuer] = other.asset.split(':');

  const params = new URLSearchParams({
    base_asset_type:      'native',
    counter_asset_type:   code.length <= 4 ? 'credit_alphanum4' : 'credit_alphanum12',
    counter_asset_code:   code,
    counter_asset_issuer: issuer || '',
    limit: '200', order: 'desc',
  });
  return paginate(`${horizonBase()}/trades`, params, total, onProgress);
}

async function fetchTradesForPool(pool, total, onProgress) {
  const params = new URLSearchParams({ limit: '200', order: 'desc' });
  return paginate(`${horizonBase()}/liquidity_pools/${pool.id}/trades`, params, total, onProgress);
}

async function fetchWithRetry(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const r = await apiFetch(url);
    if (r.ok) return r;
    if (r.status === 503 || r.status === 429) {
      await sleep(2000 * (i + 1));
      continue;
    }
    throw new Error(`HTTP ${r.status}`);
  }
  throw new Error('HTTP 503 (retry failed)');
}

async function paginate(url, params, total, onProgress) {
  const pages = Math.ceil(total / 200);
  const all = [];
  let cursor = null;

  for (let i = 0; i < pages; i++) {
    if (_fetchStop) break;
    if (cursor) params.set('cursor', cursor);
    let r;
    try {
      r = await fetchWithRetry(`${url}?${params}`);
    } catch (e) {
      if (_fetchStop) break;
      throw e;
    }
    const records = (await r.json())._embedded?.records || [];
    if (!records.length) break;
    all.push(...records);
    cursor = records.at(-1).paging_token;
    onProgress(all.length, total, all);
    await sleep(150);
  }
  return all.reverse();
}

function parseTrades(records) {
  return records.map(r => {
    try {
      const price = parseFloat(r.price.n) / parseFloat(r.price.d);
      return { ts: r.ledger_close_time, price, baseAmt: parseFloat(r.base_amount), counterAmt: parseFloat(r.counter_amount) };
    } catch { return null; }
  }).filter(Boolean);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPiPairs() {
  const allRecords = [];
  let cursor = null;
  for (let i = 0; i < 25; i++) {
    const url = `${horizonBase()}/trades?limit=200&order=desc${cursor ? `&cursor=${cursor}` : ''}`;
    const r = await apiFetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const records = (await r.json())._embedded?.records || [];
    if (!records.length) break;
    allRecords.push(...records);
    cursor = records.at(-1).paging_token;
    await sleep(150);
  }

  const counts = {};
  const pairMap = {};
  const records = allRecords;

  for (const rec of records) {
    const baseAsset = rec.base_asset_type === 'native' ? 'native' : `${rec.base_asset_code}:${rec.base_asset_issuer}`;
    const counterAsset = rec.counter_asset_type === 'native' ? 'native' : `${rec.counter_asset_code}:${rec.counter_asset_issuer}`;
    const id = [baseAsset, counterAsset].sort().join('|');
    counts[id] = (counts[id] || 0) + 1;
    if (!pairMap[id]) {
      pairMap[id] = { id, reserves: [{ asset: baseAsset }, { asset: counterAsset }], tradeCount: 0 };
    }
    pairMap[id].tradeCount = counts[id];
  }

  piTotalFetched = allRecords.length;
  return Object.values(pairMap).sort((a, b) => b.tradeCount - a.tradeCount);
}

async function fetchPiPools() {
  const base = horizonBase();
  const resp = await apiFetch(`${base}/liquidity_pools?limit=200&order=desc`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  const pools = (json._embedded?.records || []).filter(p => {
    if (!hasNative(p)) return false;
    const nativeAmt = parseFloat(p.reserves?.find(r => r.asset === 'native')?.amount || '0');
    return nativeAmt > 0;
  });
  if (!pools.length) throw new Error(tr(S.no_results));
  pools.sort((a, b) => {
    const nativeAmt = p => parseFloat(p.reserves?.find(r => r.asset === 'native')?.amount || '0');
    const lpDiff = (parseInt(b.total_trustlines) || 0) - (parseInt(a.total_trustlines) || 0);
    const amtDiff = nativeAmt(b) - nativeAmt(a);
    return lpDiff !== 0 ? lpDiff : amtDiff;
  });
  return pools;
}

// ═══════════════════════════════════════════════════════
//  BACKTEST: Orderbook Market Making (ported verbatim)
// ═══════════════════════════════════════════════════════

function runOrderbookBacktest(trades, p) {
  const halfSpread = p.spreadPct / 100 / 2;
  const fee        = p.feePct / 100;
  const mid0       = trades[0].price;

  let usdc   = p.totalUsdc * (p.splitRatio / 100);
  let native = (p.totalUsdc * (1 - p.splitRatio / 100)) / mid0;
  let profit = 0, fees = 0, fills = 0;
  let stopped = false, stopReason = '';
  const log = [], snapshots = [], priceWin = [];
  let stopIdx = trades.length - 1;

  for (let i = 0; i < trades.length; i++) {
    if (stopped) break;
    const mid = trades[i].price;
    priceWin.push(mid);
    if (priceWin.length > p.surgeTicks) priceWin.shift();

    if (priceWin.length >= 2) {
      const chg = Math.abs(priceWin.at(-1) - priceWin[0]) / priceWin[0] * 100;
      if (chg >= p.surgePct) {
        stopped = true; stopReason = `${tr(S.stop_surge)} (${chg.toFixed(2)}%)`;
        stopIdx = i;
        log.push({ type: 'stop', msg: stopReason }); break;
      }
    }

    const total = usdc + native * mid;
    const nativeRatio = (native * mid) / total * 100;

    if (nativeRatio > p.stopRatio) {
      stopped = true; stopReason = `${tr(S.stop_inv_hi)} ${nativeRatio.toFixed(1)}% ${tr(S.stop_exceeded)}`;
      stopIdx = i;
      log.push({ type: 'stop', msg: stopReason }); break;
    }
    if (nativeRatio < (100 - p.stopRatio)) {
      stopped = true; stopReason = `${tr(S.stop_inv_lo)} ${(100 - nativeRatio).toFixed(1)}% ${tr(S.stop_exceeded)}`;
      stopIdx = i;
      log.push({ type: 'stop', msg: stopReason }); break;
    }

    stopIdx = i;

    if (i > 0) {
      const prevMid  = trades[i - 1].price;
      const priceUp  = mid >= prevMid;
      const orderAmt = total * (p.orderSizePct / 100);
      // 그 틱에 실제로 체결된 네이티브 자산 수량 — 내 주문이 그 이상은 체결될 수 없다는 유동성 한도 근사치
      const availNative = trades[i].baseAmt || 0;

      for (let layer = 1; layer <= p.layers; layer++) {
        const bid      = prevMid * (1 - halfSpread * layer);
        const ask      = prevMid * (1 + halfSpread * layer);
        const layerAmt = orderAmt / p.layers;

        if (!priceUp && mid <= bid && usdc >= layerAmt) {
          const wanted = layerAmt / bid;
          const bought = Math.min(wanted, availNative);
          if (bought > 0) {
            const cost = bought * bid;
            const f    = cost * fee;
            usdc -= (cost + f); native += bought; fees += f; fills++;
            log.push({ type: 'buy', msg: `↓ ${tr(S.log_buy)} ${bought.toFixed(2)} @ ${bid.toFixed(5)} (L${layer})` });
          }
        }

        if (priceUp && mid >= ask && native * mid >= layerAmt) {
          const wanted = layerAmt / ask;
          const sold   = Math.min(wanted, availNative);
          if (sold > 0) {
            const proceeds = sold * ask;
            const f        = proceeds * fee;
            usdc += (proceeds - f); native -= sold; fees += f; fills++;
            profit += proceeds * (p.spreadPct / 100 / p.layers) - f;
            log.push({ type: 'sell', msg: `↑ ${tr(S.log_sell)} ${sold.toFixed(2)} @ ${ask.toFixed(5)} (L${layer})` });
          }
        }
      }
    }

    const tv = usdc + native * mid;
    snapshots.push({ i, price: mid, totalVal: tv, profit });
  }

  const finalPx  = trades[stopIdx].price;
  const totalNow = usdc + native * finalPx;
  const pnl      = totalNow - p.totalUsdc;

  return {
    type: 'orderbook',
    ticks: stopIdx + 1, fills,
    priceStart: trades[0].price, priceEnd: finalPx,
    priceChg: (finalPx - trades[0].price) / trades[0].price * 100,
    totalStart: p.totalUsdc, totalNow,
    pnl, roi: pnl / p.totalUsdc * 100,
    spreadProfit: profit, fees,
    inventoryPnl: pnl - profit,
    stopped, stopReason, log, snapshots,
  };
}

// ═══════════════════════════════════════════════════════
//  BACKTEST: AMM Liquidity Provision (ported verbatim)
// ═══════════════════════════════════════════════════════

function runAMMBacktest(pool, trades, p) {
  const r0 = pool.reserves[0], r1 = pool.reserves[1];
  const isNative0 = r0.asset === 'native';
  const nativeAmt = parseFloat(isNative0 ? r0.amount : r1.amount);
  const usdcAmt   = parseFloat(isNative0 ? r1.amount : r0.amount);

  const p0      = trades[0].price;
  const poolVal = usdcAmt + nativeAmt * p0;
  const lpShare = p.depositUsdc / poolVal;

  let totalFees = 0, exitReason = null, exitTick = trades.length - 1;
  const snapshots = [];

  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    totalFees += t.counterAmt * 0.003 * lpShare;

    const k  = t.price / p0;
    const il = (2 * Math.sqrt(k) / (1 + k) - 1) * 100;

    if (!exitReason) {
      if (Math.abs(il) >= p.maxILPct) {
        exitReason = `IL ${il.toFixed(2)}% ${tr(S.amm_reached)}`; exitTick = i; break;
      }
      const curRoi = (totalFees / p.depositUsdc * 100) + il;
      if (curRoi >= p.targetRoiPct) {
        exitReason = `${tr(S.amm_target_roi)} ${curRoi.toFixed(2)}% ${tr(S.amm_achieved)}`; exitTick = i; break;
      }
    }

    if (i % Math.max(1, Math.floor(trades.length / 100)) === 0) {
      const k2    = t.price / p0;
      const il2   = (2 * Math.sqrt(k2) / (1 + k2) - 1) * 100;
      const lpVal = p.depositUsdc * (2 * Math.sqrt(k2) / (1 + k2)) + totalFees;
      const hodl  = p.depositUsdc * (0.5 + 0.5 * k2);
      snapshots.push({ i, price: t.price, il: il2, lpVal, hodlVal: hodl });
    }
  }

  const finalPx   = trades[exitTick].price;
  const k         = finalPx / p0;
  const il        = (2 * Math.sqrt(k) / (1 + k) - 1) * 100;
  const lpFinal   = p.depositUsdc * (2 * Math.sqrt(k) / (1 + k)) + totalFees;
  const hodlFinal = p.depositUsdc * (0.5 + 0.5 * k);
  const pnl       = lpFinal - p.depositUsdc;

  return {
    type: 'amm',
    ticks: exitTick + 1,
    priceStart: p0, priceEnd: finalPx,
    priceChg: (finalPx - p0) / p0 * 100,
    totalStart: p.depositUsdc, lpFinal, hodlFinal,
    pnl, roi: pnl / p.depositUsdc * 100,
    feeIncome: totalFees, il,
    lpShare: lpShare * 100,
    exitReason, snapshots,
  };
}

// ═══════════════════════════════════════════════════════
//  MY LP TRACKING — real (not backtested) position tracking
// ═══════════════════════════════════════════════════════

let mmSection   = 'backtest';
let lpPositions = [];

async function fetchPoolState(network, poolId) {
  const base = NETWORKS[network].horizon;
  const r = await fetch(`${base}/liquidity_pools/${poolId}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function fetchAccountLpShares(network, wallet, poolId) {
  const base = NETWORKS[network].horizon;
  const r = await fetch(`${base}/accounts/${wallet}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const acc = await r.json();
  const bal = (acc.balances || []).find(b => b.asset_type === 'liquidity_pool_shares' && b.liquidity_pool_id === poolId);
  return bal ? parseFloat(bal.balance) : 0;
}

function poolPriceAndValue(pool) {
  const r0 = pool.reserves[0], r1 = pool.reserves[1];
  const isNative0 = r0.asset === 'native';
  const nativeAmt = parseFloat(isNative0 ? r0.amount : r1.amount);
  const usdcAmt   = parseFloat(isNative0 ? r1.amount : r0.amount);
  const price     = nativeAmt > 0 ? usdcAmt / nativeAmt : 0;
  const totalShares = parseFloat(pool.total_shares || '0');
  const poolVal   = usdcAmt + nativeAmt * price;
  return { price, totalShares, poolVal };
}

// walletAddress가 있으면 실제 보유 지분으로 정확히 계산, 없으면 등록 시점 가격 대비 IL 공식으로 근사 계산(수수료 미포함)
async function computePositionPnl(pos) {
  const pool = await fetchPoolState(pos.network, pos.poolId);
  const { price, totalShares, poolVal } = poolPriceAndValue(pool);

  if (pos.walletAddress) {
    const myShares = await fetchAccountLpShares(pos.network, pos.walletAddress, pos.poolId);
    const ratio = totalShares > 0 ? myShares / totalShares : 0;
    const currentValue = ratio * poolVal;
    return {
      currentValue, pnl: currentValue - pos.entryUsdc,
      roi: pos.entryUsdc > 0 ? (currentValue - pos.entryUsdc) / pos.entryUsdc * 100 : 0,
      exact: true, hasShares: myShares > 0,
    };
  }

  const k = pos.entryPrice > 0 ? price / pos.entryPrice : 1;
  const currentValue = pos.entryUsdc * (2 * Math.sqrt(k) / (1 + k));
  return {
    currentValue, pnl: currentValue - pos.entryUsdc,
    roi: pos.entryUsdc > 0 ? (currentValue - pos.entryUsdc) / pos.entryUsdc * 100 : 0,
    exact: false,
  };
}

function setSection(sec) {
  mmSection = sec;
  rootContainer.querySelectorAll('.mm-sec-btn').forEach(b => b.classList.toggle('active', b.dataset.sec === sec));
  rootContainer.querySelector('#mm-backtest-wrap').classList.toggle('hidden', sec !== 'backtest');
  rootContainer.querySelector('#mm-tracking-wrap').classList.toggle('hidden', sec !== 'tracking');
  if (sec === 'tracking') renderTrackingSection();
}

async function renderTrackingSection() {
  const wrap = rootContainer.querySelector('#mm-tracking-wrap');
  wrap.innerHTML = `<div class="status-text"><span class="spinner"></span> ${tr(S.run_start)}</div>`;

  const username = getUsername();
  if (!username) {
    wrap.innerHTML = `<div class="mm-alert error">${tr(S.track_no_login)}</div>`;
    return;
  }

  try {
    lpPositions = await fetchLpPositionsServer(username);
  } catch {
    wrap.innerHTML = `<div class="mm-alert error">${tr(S.track_load_fail)}</div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="page-title" style="margin-bottom:10px;">${tr(S.track_title)} <span class="param-hint">(${lpPositions.length}/${LP_POSITION_MAX})</span></div>
    <div id="mm-track-list">
      ${lpPositions.length === 0
        ? `<div class="mm-alert">${tr(S.track_empty)}</div><button class="btn-outline" style="width:100%;margin-top:10px;" onclick="window.mm_setSection('backtest')">${tr(S.track_goto_backtest)}</button>`
        : lpPositions.map(p => trackCardHtml(p)).join('')}
    </div>
  `;

  lpPositions.forEach(p => loadPositionPnl(p.id));
}

function trackCardHtml(p) {
  return `
    <div class="card" id="mm-track-card-${p.id}">
      <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
        <span>${p.alias || p.poolLabel}</span>
        <button class="btn-outline" style="width:auto;padding:2px 8px;font-size:11px;" onclick="window.mm_deletePosition('${p.id}')">✕</button>
      </div>
      <div class="stat-row"><span class="stat-label">${p.poolLabel} · ${NETWORKS[p.network].name}</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.track_date)}</span><span class="stat-value">${p.entryDate}</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.track_entry_value)}</span><span class="stat-value">${fmt(p.entryUsdc)} USDC</span></div>
      <div id="mm-track-pnl-${p.id}"><div class="status-text"><span class="spinner"></span></div></div>
    </div>`;
}

async function loadPositionPnl(id) {
  const pos = lpPositions.find(p => p.id === id);
  const el  = rootContainer?.querySelector(`#mm-track-pnl-${id}`);
  if (!pos || !el) return;
  try {
    const r = await computePositionPnl(pos);
    const tag       = r.exact ? tr(S.track_exact) : tr(S.track_approx);
    const shareWarn = r.exact && !r.hasShares ? `<div class="mm-alert error">${tr(S.track_no_shares)}</div>` : '';
    el.innerHTML = `
      ${shareWarn}
      <div class="stat-row"><span class="stat-label">${tr(S.track_current_value)}</span><span class="stat-value">${fmt(r.currentValue)} USDC</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_lp_pnl)}</span><div>${fmtPct(r.roi)} &nbsp; ${fmtUsdc(r.pnl)}</div></div>
      <div class="param-hint">${tag}</div>
    `;
  } catch {
    el.innerHTML = `<div class="mm-alert error">${tr(S.track_fail)}</div>`;
  }
}

async function deletePosition(id) {
  const username = getUsername();
  if (!username) return;
  try {
    const updated = lpPositions.filter(p => p.id !== id);
    await saveLpPositionsServer(username, updated);
    lpPositions = updated;
    renderTrackingSection();
  } catch { showToast(tr(S.track_fail)); }
}

function openAddPositionDialog(prefill) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:340px;">
      <div class="modal-header"><h2 style="font-size:16px;">${tr(S.track_add_title)}</h2><button class="modal-close" id="tp-x">✕</button></div>
      <div class="modal-body">
        <div class="mm-alert info">📊 ${prefill.poolLabel} · ${NETWORKS[prefill.network].name}</div>
        <input class="form-input" id="tp-alias" placeholder="${tr(S.track_alias_ph)}" style="margin-bottom:8px;">
        <input class="form-input" id="tp-deposit" type="number" placeholder="${tr(S.track_deposit_ph)}" value="${prefill.depositUsdc || ''}" style="margin-bottom:8px;">
        <input class="form-input" id="tp-wallet" placeholder="${tr(S.track_wallet_ph)}" style="margin-bottom:4px;">
        <p class="param-hint" style="margin:0 0 8px;">${tr(S.track_wallet_hint)}</p>
        <p id="tp-err" style="color:var(--red);font-size:11px;display:none;"></p>
        <div class="mm-nav-row">
          <button class="btn-outline" id="tp-cancel">${tr(S.btn_prev)}</button>
          <button class="btn-primary" id="tp-save">${tr(S.track_save)}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#tp-x').onclick = close;
  overlay.querySelector('#tp-cancel').onclick = close;

  overlay.querySelector('#tp-save').onclick = async () => {
    const alias   = overlay.querySelector('#tp-alias').value.trim();
    const deposit = parseFloat(overlay.querySelector('#tp-deposit').value);
    const wallet  = overlay.querySelector('#tp-wallet').value.trim();
    const errEl   = overlay.querySelector('#tp-err');
    const saveBtn = overlay.querySelector('#tp-save');

    if (!deposit || deposit <= 0) { errEl.textContent = tr(S.track_deposit_required); errEl.style.display = ''; return; }
    const username = getUsername();
    if (!username) { errEl.textContent = tr(S.track_no_login); errEl.style.display = ''; return; }

    saveBtn.disabled = true;
    try {
      const pool = await fetchPoolState(prefill.network, prefill.poolId);
      const { price } = poolPriceAndValue(pool);
      const newPos = {
        id: `lp${Date.now()}`, alias, network: prefill.network,
        poolId: prefill.poolId, poolLabel: prefill.poolLabel,
        walletAddress: wallet, entryDate: new Date().toISOString().slice(0, 10),
        entryPrice: price, entryUsdc: deposit,
      };
      const current = await fetchLpPositionsServer(username);
      if (current.length >= LP_POSITION_MAX) { errEl.textContent = tr(S.track_fail); errEl.style.display = ''; saveBtn.disabled = false; return; }
      const updated = [...current, newPos];
      await saveLpPositionsServer(username, updated);
      lpPositions = updated;
      close();
      showToast(tr(S.track_registered_toast));
      setSection('tracking');
    } catch {
      errEl.textContent = tr(S.track_fail);
      errEl.style.display = '';
      saveBtn.disabled = false;
    }
  };
}

// ── Helpers ────────────────────────────────────────────
function assetLabel(a) {
  return a === 'native' ? (NETWORKS[state.network]?.native || 'XLM') : a.split(':')[0];
}
function poolLabel(pool) {
  if (!pool?.reserves?.length) return pool?.id || '';
  return pool.reserves.map(r => assetLabel(r.asset)).join(' / ');
}
function fmt(n, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function valClass(n) { return n > 0 ? 'val-green' : n < 0 ? 'val-red' : ''; }
function fmtPct(n) {
  const sign = n > 0 ? '+' : '';
  return `<span class="${valClass(n)}">${sign}${fmt(n)}%</span>`;
}
function fmtUsdc(n) {
  const sign = n > 0 ? '+' : '';
  return `<span class="${valClass(n)}">${sign}${fmt(n)} USDC</span>`;
}

// ═══════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════

function renderApp() {
  if (!rootContainer) return;
  const el  = rootContainer.querySelector('#mm-content');
  const nav = rootContainer.querySelector('#mm-nav-buttons');
  renderStepIndicator();
  el.innerHTML = '';
  nav.innerHTML = '';
  if (activeChart) { activeChart.destroy(); activeChart = null; }

  const steps = [null, renderNetworkStep, renderStrategyStep, renderPoolStep,
                       renderParamsStep,  renderRunStep,      renderResultStep];
  steps[state.step]?.(el, nav);
}

function renderStepIndicator() {
  const cur = S.steps[state.step - 1];
  rootContainer.querySelector('#mm-step-indicator').innerHTML = `
    <div class="step-dots">
      ${S.steps.map((_, i) => `<div class="step-dot ${i + 1 < state.step ? 'done' : i + 1 === state.step ? 'active' : ''}"></div>`).join('')}
    </div>
    <div class="step-label">${state.step} / ${S.steps.length} — ${tr(cur)}</div>
  `;
}

function navBtns(nav, back, nextFn, nextLabel = null, disabled = false) {
  const label = nextLabel ?? `${tr(S.btn_next)} →`;
  nav.innerHTML = `
    <div class="mm-nav-row">
      ${back ? `<button class="btn-outline" onclick="window.mm_prevStep()">← ${tr(S.btn_prev)}</button>` : ''}
      ${nextFn ? `<button class="btn-primary" onclick="window.${nextFn}()" ${disabled ? 'disabled' : ''}>${label}</button>` : ''}
    </div>
  `;
}

// ── Step 1: Network ───────────────────────────────────

function renderNetworkStep(el, nav) {
  el.innerHTML = `
    <div class="page-title">${tr(S.net_title)}</div>
    <div class="pool-card ${state.network === 'stellar' ? 'selected' : ''}" onclick="window.mm_selectNetwork('stellar')">
      <div class="pool-name">${tr(S.stellar_name)}</div>
      <div class="pool-stat">${tr(S.stellar_desc)}</div>
    </div>
    <div class="pool-card ${state.network === 'pi' ? 'selected' : ''}" onclick="window.mm_selectNetwork('pi')">
      <div class="pool-name">${tr(S.pi_name)}</div>
      <div class="pool-stat">${tr(S.pi_desc)}</div>
    </div>
  `;
  navBtns(nav, false, 'mm_nextStep', null, !state.network);
}

function selectNetwork(k) {
  state.network = k; state.pool = null; state.pools = []; poolPage = 0; poolSearchQuery = '';
  renderApp();
}

// ── Step 2: Strategy ───────────────────────────────────

function renderStrategyStep(el, nav) {
  el.innerHTML = `
    <div class="page-title">${tr(S.str_title)}</div>
    <div class="pool-card ${state.strategy === 'orderbook' ? 'selected' : ''}" onclick="window.mm_selectStrategy('orderbook')">
      <div class="pool-name">${tr(S.ob_name)}</div>
      <div class="pool-stat">${tr(S.ob_desc)}</div>
    </div>
    <div class="pool-card ${state.strategy === 'amm' ? 'selected' : ''}" onclick="window.mm_selectStrategy('amm')">
      <div class="pool-name">${tr(S.amm_name)}</div>
      <div class="pool-stat">${tr(S.amm_desc)}</div>
    </div>
    <div class="pool-card ${state.strategy === 'auto' ? 'selected' : ''}" onclick="window.mm_selectStrategy('auto')">
      <div class="pool-name">${tr(S.auto_name)}</div>
      <div class="pool-stat">${tr(S.auto_desc)}</div>
    </div>
  `;
  navBtns(nav, true, 'mm_nextStep', null, !state.strategy);
}

function selectStrategy(k) {
  state.strategy = k; state.pool = null; state.pools = []; poolPage = 0;
  scanSelectedIds.clear(); scanSelectionSet = false;
  renderApp();
}

// ── Step 3: Pool / Pair selection ─────────────────────

function renderPoolStep(el, nav) {
  if (state.strategy === 'auto') { renderAutoPoolSelectStep(el, nav); return; }
  const isPi = state.network === 'pi';

  if (isPi && state.strategy === 'amm') {
    if (state.pools.length === 0) {
      el.innerHTML = `
        <div class="page-title">${tr(S.pool_title)}</div>
        <div class="status-text"><span class="spinner"></span> ${tr(S.loading_pools)}... <span id="mm-load-timer">0</span>${tr(S.sec)}</div>
      `;
      navBtns(nav, true, null);
      loadPiPools();
      return;
    }
    el.innerHTML = `
      <div class="page-title">${tr(S.pool_title)}</div>
      <div class="mm-alert info">${tr(S.sort_pi_amm)}</div>
      <input class="form-input" id="mm-pool-search" placeholder="${tr(S.search_ph)}" oninput="window.mm_filterPools()" value="${poolSearchQuery}">
      <div id="mm-pool-list" style="margin-top:10px">${poolListHtml()}</div>
    `;
    navBtns(nav, true, 'mm_nextStep', null, !state.pool);
    return;
  }

  if (isPi) {
    if (state.pools.length === 0) {
      el.innerHTML = `
        <div class="page-title">${tr(S.pair_title)}</div>
        <div class="status-text"><span class="spinner"></span> ${tr(S.loading_pairs)}... <span id="mm-load-timer">0</span>${tr(S.sec)}</div>
      `;
      navBtns(nav, true, null);
      loadPiPairs();
      return;
    }
    el.innerHTML = `
      <div class="page-title">${tr(S.pair_title)}</div>
      <div class="mm-alert info">${tr(S.pi_info)}</div>
      <div id="mm-pool-list">${piPairsHtml()}</div>
    `;
    navBtns(nav, true, 'mm_nextStep', null, !state.pool);
    return;
  }

  const sortDesc = state.strategy === 'orderbook' ? tr(S.sort_lp) : tr(S.sort_tvl);

  el.innerHTML = state.pools.length === 0
    ? `<div class="page-title">${tr(S.pool_title)}</div><div class="status-text"><span class="spinner"></span> ${tr(S.loading_pools)}... <span id="mm-load-timer">0</span>${tr(S.sec)}</div>`
    : `
      <div class="page-title">${tr(S.pool_title)}</div>
      <div class="mm-alert info">${sortDesc}</div>
      <input class="form-input" id="mm-pool-search" placeholder="${tr(S.search_ph)}" oninput="window.mm_filterPools()" value="${poolSearchQuery}">
      <div id="mm-pool-list" style="margin-top:10px">${poolListHtml()}</div>
    `;
  navBtns(nav, true, 'mm_nextStep', null, !state.pool);
  if (state.pools.length === 0) loadPools();
}

function startLoadTimer() {
  let sec = 0;
  return setInterval(() => {
    sec++;
    const elTimer = rootContainer.querySelector('#mm-load-timer');
    if (elTimer) elTimer.textContent = sec;
  }, 1000);
}

async function loadPiPairs() {
  const timer = startLoadTimer();
  try {
    const pairs = await fetchPiPairs();
    clearInterval(timer);
    if (!pairs.length) throw new Error(tr(S.no_trade_data));
    state.pools = pairs;
    renderApp();
  } catch (e) {
    clearInterval(timer);
    rootContainer.querySelector('#mm-content').innerHTML = `
      <div class="page-title">${tr(S.pair_title)}</div>
      <div class="mm-alert error">${tr(S.pair_fail)}: ${e.message}</div>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_goToStep(3)">${tr(S.btn_retry)}</button>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_goToStep(1)">${tr(S.btn_net)}</button>
    `;
  }
}

async function loadPiPools() {
  const timer = startLoadTimer();
  try {
    const pools = await fetchPiPools();
    clearInterval(timer);
    state.pools = pools;
    renderApp();
  } catch (e) {
    clearInterval(timer);
    rootContainer.querySelector('#mm-content').innerHTML = `
      <div class="page-title">${tr(S.pool_title)}</div>
      <div class="mm-alert error">${tr(S.pool_fail)}: ${e.message}</div>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_loadPiPools()">${tr(S.btn_retry)}</button>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_goToStep(1)">${tr(S.btn_net)}</button>
    `;
  }
}

async function loadPools() {
  const timer = startLoadTimer();
  try {
    const pools = await fetchPools();
    clearInterval(timer);
    if (!pools.length) throw new Error(`${tr(S.pool_fail)} (0 pools)`);
    state.pools = pools;
    renderApp();
  } catch (e) {
    clearInterval(timer);
    rootContainer.querySelector('#mm-content').innerHTML = `
      <div class="page-title">${tr(S.pool_title)}</div>
      <div class="mm-alert error">${tr(S.pool_fail)}: ${e.message}</div>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_loadPools()">${tr(S.btn_retry)}</button>
      <button class="btn-outline" style="margin-top:10px" onclick="window.mm_goToStep(1)">${tr(S.btn_net)}</button>
    `;
  }
}

function selectPool(id) {
  state.pool = state.pools.find(p => p.id === id);
  renderApp();
}
function selectPiPair(encodedId) {
  const id = decodeURIComponent(encodedId);
  state.pool = state.pools.find(p => p.id === id);
  renderApp();
}

function filterPools() {
  poolSearchQuery = rootContainer.querySelector('#mm-pool-search')?.value?.toLowerCase() || '';
  poolPage = 0;
  rootContainer.querySelector('#mm-pool-list').innerHTML = poolListHtml();
}

function pagerHtml(totalItems) {
  const totalPages = Math.ceil(totalItems / POOL_PAGE_SIZE);
  if (totalPages <= 1) return '';
  return `
    <div class="mm-pager">
      <button class="page-btn" onclick="window.mm_changePage(-1)" ${poolPage === 0 ? 'disabled' : ''}>◀</button>
      <span class="mm-pager-info">${poolPage + 1} / ${totalPages}</span>
      <button class="page-btn" onclick="window.mm_changePage(1)" ${poolPage >= totalPages - 1 ? 'disabled' : ''}>▶</button>
    </div>`;
}

function changePage(dir) {
  const isPiOrderbook = state.network === 'pi' && state.strategy !== 'amm' && state.strategy !== 'auto';
  const filtered = isPiOrderbook
    ? state.pools
    : state.pools.filter(p => !poolSearchQuery || poolLabel(p).toLowerCase().includes(poolSearchQuery));
  const totalPages = Math.ceil(filtered.length / POOL_PAGE_SIZE);
  poolPage = Math.max(0, Math.min(poolPage + dir, totalPages - 1));
  if (state.strategy === 'auto') {
    rootContainer.querySelector('#mm-auto-pool-list').innerHTML = autoPoolListHtml();
  } else if (isPiOrderbook) {
    rootContainer.querySelector('#mm-pool-list').innerHTML = piPairsHtml();
  } else {
    rootContainer.querySelector('#mm-pool-list').innerHTML = poolListHtml();
  }
}

function piPairsHtml() {
  const items = state.pools;
  const start = poolPage * POOL_PAGE_SIZE;
  const page  = items.slice(start, start + POOL_PAGE_SIZE);
  return page.map(p => `
      <div class="pool-card ${state.pool?.id === p.id ? 'selected' : ''}" onclick="window.mm_selectPiPair('${encodeURIComponent(p.id)}')">
        <div class="pool-name">${poolLabel(p)}</div>
        <div class="pool-stat">${tr(S.recent_trades)}: <span style="color:var(--text)">${p.tradeCount}</span> / ${piTotalFetched.toLocaleString()}</div>
      </div>`).join('') + pagerHtml(items.length);
}

function poolListHtml() {
  const filtered = state.pools.filter(p => !poolSearchQuery || poolLabel(p).toLowerCase().includes(poolSearchQuery));
  if (!filtered.length) return `<div class="status-text">${tr(S.no_results)}</div>`;
  const start = poolPage * POOL_PAGE_SIZE;
  const page  = filtered.slice(start, start + POOL_PAGE_SIZE);
  return page.map(p => {
    const lp  = p._accounts || p.total_trustlines || '?';
    const fee = ((parseFloat(p.fee_bp || 30)) / 100).toFixed(1);
    let meta;
    if (state.network === 'pi') {
      const nativeAmt = parseFloat(p.reserves?.find(r => r.asset === 'native')?.amount || '0');
      meta = `PI ${nativeAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })} · LP <span style="color:var(--text)">${lp}</span> · ${fee}%`;
    } else if (state.strategy === 'orderbook') {
      meta = `${tr(S.pool_7d_trades)} <span style="color:var(--text)">${(p._trades7d || 0).toLocaleString()}</span>${tr(S.pool_count_unit)} · LP <span style="color:var(--text)">${lp}</span> · ${fee}%`;
    } else {
      const apy = p._tvl > 0 ? (p._vol7d / p._tvl * 0.003 * 52 * 100).toFixed(1) : '?';
      meta = `${tr(S.pool_est_apy)} <span class="val-green">${apy}%</span> · LP <span style="color:var(--text)">${lp}</span> · ${tr(S.pool_7d_trades)} ${(p._trades7d || 0).toLocaleString()}${tr(S.pool_count_unit)}`;
    }
    return `
      <div class="pool-card ${state.pool?.id === p.id ? 'selected' : ''}" onclick="window.mm_selectPool('${p.id}')">
        <div class="pool-name">${poolLabel(p)}</div>
        <div class="pool-stat">${meta}</div>
      </div>`;
  }).join('') + pagerHtml(filtered.length);
}

// ── Step 4: Parameters ─────────────────────────────────

function renderParamsStep(el, nav) {
  if (state.strategy === 'auto') { renderScanParamsStep(el, nav); return; }
  const isOB = state.strategy === 'orderbook';
  const p    = state.params;
  el.innerHTML = `
    <div class="page-title">${tr(S.param_title)}</div>
    <div class="mm-alert info">📊 ${poolLabel(state.pool)} · ${NETWORKS[state.network].name}</div>

    <div class="form-group">
      <label class="form-label">${tr(S.p_records)} <span class="param-hint">${tr(S.p_rec)}: 5,000</span></label>
      <input class="form-input" type="number" id="mm-p-records" value="${p.records || 5000}" min="200" max="10000" step="100">
    </div>

    ${isOB ? `
    <div class="form-group">
      <label class="form-label">${tr(S.p_capital)} (USDC) <span class="param-hint">${tr(S.p_rec)}: 500</span></label>
      <input class="form-input" type="number" id="mm-p-totalUsdc" value="${p.totalUsdc || 500}" min="10">
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_split)} <span class="param-hint">${tr(S.p_rec)}: 50</span></label>
        <input class="form-input" type="number" id="mm-p-splitRatio" value="${p.splitRatio || 50}" min="10" max="90">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_spread)} <span class="param-hint">${tr(S.p_rec)}: 0.3~0.5</span></label>
        <input class="form-input" type="number" id="mm-p-spreadPct" value="${p.spreadPct || 0.5}" step="0.1" min="0.1">
      </div>
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_order_size)} <span class="param-hint">${tr(S.p_rec)}: 3~5</span></label>
        <input class="form-input" type="number" id="mm-p-orderSizePct" value="${p.orderSizePct || 3}" step="0.5" min="0.5">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_layers)} <span class="param-hint">${tr(S.p_rec)}: 1~3</span></label>
        <input class="form-input" type="number" id="mm-p-layers" value="${p.layers || 1}" min="1" max="5">
      </div>
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_stop)} <span class="param-hint">${tr(S.p_rec)}: 70</span></label>
        <input class="form-input" type="number" id="mm-p-stopRatio" value="${p.stopRatio || 70}" min="51" max="99">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_fee)} <span class="param-hint">${tr(S.p_rec)}: 0 (Stellar)</span></label>
        <input class="form-input" type="number" id="mm-p-feePct" value="${p.feePct !== undefined ? p.feePct : 0}" step="0.05" min="0">
      </div>
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_surge_ticks)} <span class="param-hint">${tr(S.p_rec)}: 3~5</span></label>
        <input class="form-input" type="number" id="mm-p-surgeTicks" value="${p.surgeTicks || 3}" min="2" max="20">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_surge_pct)} <span class="param-hint">${tr(S.p_rec)}: 1~2</span></label>
        <input class="form-input" type="number" id="mm-p-surgePct" value="${p.surgePct || 1.5}" step="0.1" min="0.1">
      </div>
    </div>
    ` : `
    <div class="form-group">
      <label class="form-label">${tr(S.p_deposit)} (USDC) <span class="param-hint">${tr(S.p_rec)}: 500</span></label>
      <input class="form-input" type="number" id="mm-p-depositUsdc" value="${p.depositUsdc || 500}" min="10">
    </div>
    <div class="mm-form-row">
      <div class="form-group">
        <label class="form-label">${tr(S.p_max_il)} <span class="param-hint">${tr(S.p_rec)}: 5~10</span></label>
        <input class="form-input" type="number" id="mm-p-maxILPct" value="${p.maxILPct || 10}" min="1" max="50">
      </div>
      <div class="form-group">
        <label class="form-label">${tr(S.p_target_roi)} <span class="param-hint">${tr(S.p_rec)}: 3~5</span></label>
        <input class="form-input" type="number" id="mm-p-targetRoiPct" value="${p.targetRoiPct || 5}" min="0.1">
      </div>
    </div>
    `}
  `;
  navBtns(nav, true, 'mm_goToRun', `▶ ${tr(S.btn_run)}`);
}

function goToRun() {
  const isOB  = state.strategy === 'orderbook';
  const n     = id => parseFloat(rootContainer.querySelector(`#${id}`)?.value || '0');
  const ni    = id => parseInt(rootContainer.querySelector(`#${id}`)?.value || '0', 10);
  const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

  state.params = isOB ? {
    records:      clamp(ni('mm-p-records'), 200, 10000),
    totalUsdc:    n('mm-p-totalUsdc'),
    splitRatio:   n('mm-p-splitRatio'),
    spreadPct:    n('mm-p-spreadPct'),
    orderSizePct: n('mm-p-orderSizePct'),
    layers:       ni('mm-p-layers'),
    stopRatio:    n('mm-p-stopRatio'),
    feePct:       n('mm-p-feePct'),
    surgeTicks:   ni('mm-p-surgeTicks'),
    surgePct:     n('mm-p-surgePct'),
  } : {
    records:      clamp(ni('mm-p-records'), 200, 10000),
    depositUsdc:  n('mm-p-depositUsdc'),
    maxILPct:     n('mm-p-maxILPct'),
    targetRoiPct: n('mm-p-targetRoiPct'),
  };
  nextStep();
}

// ── Step 5: Run ────────────────────────────────────────

function renderRunStep(el, nav) {
  _fetchStop = false;
  if (state.strategy === 'auto') { renderAutoRunStep(el, nav); return; }
  const isOB       = state.strategy === 'orderbook';
  const stratLabel = isOB ? tr(S.ob_name) : tr(S.amm_name);
  const stratColor = isOB ? 'var(--green)' : 'var(--accent)';
  el.innerHTML = `
    <div class="page-title">${tr(S.run_title)}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <span class="mm-strategy-tag" style="background:${stratColor}">${stratLabel}</span>
      <span style="font-size:0.97rem;font-weight:600">${poolLabel(state.pool)}</span>
    </div>
    <div class="mm-live-roi-box">
      <div id="mm-live-roi" class="mm-live-roi-val">—</div>
      <div class="mm-live-roi-lbl">${tr(S.run_live_roi)}</div>
    </div>
    <div id="mm-run-status" class="status-text"><span class="spinner"></span> ${tr(S.run_start)}</div>
    <div class="mm-progress-bar"><div class="mm-progress-fill" id="mm-run-prog"></div></div>
    <div class="card" style="margin-top:12px">
      <div class="mm-log-list" id="mm-run-log"></div>
    </div>
  `;
  nav.innerHTML = `<button class="btn-outline" id="mm-btn-stop-fetch" onclick="window.mm_stopFetch()">${tr(S.btn_stop)}</button>`;
  runBacktest();
}

function stopFetch() {
  _fetchStop = true;
  _currentAbort?.abort();
  const btn = rootContainer.querySelector('#mm-btn-stop-fetch');
  if (btn) btn.disabled = true;
}

async function runBacktest() {
  const log = msg => {
    const elLog = rootContainer.querySelector('#mm-run-log');
    if (elLog) elLog.innerHTML += `<div>${msg}</div>`;
  };
  const status = msg => {
    const elStatus = rootContainer.querySelector('#mm-run-status');
    if (elStatus) elStatus.innerHTML = msg;
  };
  const progress = (cur, tot, currentAll) => {
    const elProg = rootContainer.querySelector('#mm-run-prog');
    if (elProg) elProg.style.width = `${Math.min(100, cur / tot * 100)}%`;
    status(`<span class="spinner"></span> ${cur} / ${tot} ${tr(S.run_received)}`);
    if (currentAll && cur >= 100) {
      try {
        const pt = parseTrades([...currentAll].reverse());
        if (pt.length >= 10) {
          const pv = state.strategy === 'orderbook'
            ? runOrderbookBacktest(pt, state.params)
            : runAMMBacktest(state.pool, pt, state.params);
          const roi = pv.roi;
          const color = roi >= 0 ? 'var(--green)' : 'var(--red)';
          const lv = rootContainer.querySelector('#mm-live-roi');
          if (lv) lv.innerHTML = `<span style="color:${color}">${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%</span>`;
        }
      } catch (_) {}
    }
  };

  try {
    const total = state.params.records;
    log(`→ ${poolLabel(state.pool)} · ${total} ${tr(S.run_req)}`);

    const fetchFn = state.strategy === 'amm' ? fetchTradesForPool : fetchTradesForPair;
    const records = await fetchFn(state.pool, total, progress);

    rootContainer.querySelector('#mm-nav-buttons').innerHTML = '';

    if (_fetchStop) {
      log(`⚠ ${records.length} ${tr(S.run_received)} (${tr(S.scan_interrupted)})`);
    } else {
      log(`✓ ${records.length} ${tr(S.run_received)}`);
    }

    const trades = parseTrades(records);
    log(`✓ ${tr(S.run_valid)} ${trades.length}`);

    if (trades.length < 10) throw new Error(tr(S.run_too_few));

    status(`<span class="spinner"></span> ${tr(S.run_running)}`);
    await sleep(30);

    state.result = state.strategy === 'orderbook'
      ? runOrderbookBacktest(trades, state.params)
      : runAMMBacktest(state.pool, trades, state.params);

    log(`✓ ${tr(S.run_complete)}`);
    rootContainer.querySelector('#mm-run-prog').style.width = '100%';
    status(tr(S.run_done));
    await sleep(400);
    nextStep();

  } catch (e) {
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = '';
    status(`<div class="mm-alert error">${tr(S.run_error)}: ${e.message}</div>`);
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = `
      <div class="mm-nav-row">
        <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
        <button class="btn-primary" onclick="window.mm_goToStep(5)">${tr(S.btn_retry)}</button>
      </div>
    `;
  }
}

// ── Step 6: Results ────────────────────────────────────

function renderResultStep(el, nav) {
  if (state.strategy === 'auto') { renderScanResultStep(el, nav); return; }
  const r = state.result;
  if (!r) { el.innerHTML = `<div class="mm-alert error">${tr(S.res_none)}</div>`; return; }

  el.innerHTML = r.type === 'orderbook' ? obResultHtml(r) : ammResultHtml(r);
  nav.innerHTML = `
    <div class="mm-nav-row">
      <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
      <button class="btn-primary" onclick="window.mm_goToStep(1)">${tr(S.btn_new)}</button>
    </div>
  `;

  requestAnimationFrame(() => drawChart(r));
}

function obResultHtml(r) {
  return `
    <div class="mm-alert info">📊 ${poolLabel(state.pool)} · ${NETWORKS[state.network].name}</div>
    <div class="card">
      <div class="card-title">${tr(S.res_summary)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_pnl)}</span><div>${fmtPct(r.roi)} &nbsp; ${fmtUsdc(r.pnl)}</div></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_spread)}</span>${fmtUsdc(r.spreadProfit)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_inv)}</span>${fmtUsdc(r.inventoryPnl)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_fees)}</span><span class="${r.fees >= 0.005 ? 'val-red' : ''}">${r.fees >= 0.005 ? '-' : ''}${fmt(r.fees)} USDC</span></div>
    </div>
    <div class="card">
      <div class="card-title">${tr(S.res_stats)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_fills)}</span><span class="stat-value">${r.fills}</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_ticks)}</span><span class="stat-value">${r.ticks}</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_price_chg)}</span>${fmtPct(r.priceChg)}</div>
      ${r.stopped ? `<div class="stat-row"><span class="stat-label">${tr(S.res_stop)}</span><span class="val-red">${r.stopReason}</span></div>` : ''}
    </div>
    <div class="mm-chart-container">
      <div class="mm-chart-title">${tr(S.res_asset_chart)}</div>
      <canvas id="mm-result-chart"></canvas>
    </div>
    <div class="card">
      <div class="card-title">${tr(S.res_log)}</div>
      <div class="mm-log-list">
        ${r.log.slice(-20).map(l => `<div class="log-${l.type}">${l.msg}</div>`).join('') || `<div>${tr(S.res_no_fills)}</div>`}
      </div>
    </div>
    ${analysisHtml(r)}
  `;
}

function ammResultHtml(r) {
  const hodlRoi = (r.hodlFinal - r.totalStart) / r.totalStart * 100;
  return `
    <div class="mm-alert info">📊 ${poolLabel(state.pool)} · ${NETWORKS[state.network].name}</div>
    <div class="card">
      <div class="card-title">${tr(S.res_lp_title)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_lp_pnl)}</span><div>${fmtPct(r.roi)} &nbsp; ${fmtUsdc(r.pnl)}</div></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_fee_inc)}</span><span class="val-green">+${fmt(r.feeIncome)} USDC</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_il)}</span><span class="${r.il < 0 ? 'val-red' : ''}">${fmt(r.il)}%</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_vs_hodl)}</span>${fmtPct(r.roi - hodlRoi)}</div>
    </div>
    <div class="card">
      <div class="card-title">${tr(S.res_stats)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_ticks)}</span><span class="stat-value">${r.ticks}</span></div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_price_chg)}</span>${fmtPct(r.priceChg)}</div>
      <div class="stat-row"><span class="stat-label">${tr(S.res_lp_share)}</span><span class="stat-value">${fmt(r.lpShare, 4)}%</span></div>
      ${r.exitReason ? `<div class="stat-row"><span class="stat-label">${tr(S.res_exit)}</span><span class="stat-value">${r.exitReason}</span></div>` : ''}
    </div>
    <div class="mm-chart-container">
      <div class="mm-chart-title">${tr(S.res_lp_chart)}</div>
      <canvas id="mm-result-chart"></canvas>
    </div>
    ${analysisHtml(r)}
    <button class="btn-outline" style="width:100%;margin-top:10px;" onclick="window.mm_registerPosition()">${tr(S.track_register_btn)}</button>
  `;
}

function registerPositionFromResult() {
  openAddPositionDialog({
    network: state.network,
    poolId: state.pool.id,
    poolLabel: poolLabel(state.pool),
    depositUsdc: state.params.depositUsdc,
  });
}

function analysisHtml(r) {
  let s;
  if (r.type === 'orderbook') {
    if (r.fills === 0) s = S.ana_no_fills;
    else if (r.roi > 0 && r.spreadProfit > 0) s = S.ana_good;
    else if (r.spreadProfit > 0 && r.roi < 0) s = S.ana_inv_loss;
    else s = S.ana_bad;
  } else {
    s = r.feeIncome > Math.abs(r.il / 100 * r.totalStart) ? S.ana_amm_good : S.ana_amm_bad;
  }
  return `<div class="mm-alert info">${tr(s)}</div>`;
}

async function drawChart(r) {
  const canvas = rootContainer?.querySelector('#mm-result-chart');
  if (!canvas || !r.snapshots?.length) return;
  try { await loadChartJs(); } catch { return; }
  if (!window.Chart) return;

  const raw  = r.snapshots;
  const step = Math.max(1, Math.floor(raw.length / 200));
  const snaps = raw.filter((_, i) => i % step === 0);

  const labels = snaps.map(s => s.i);
  const datasets = r.type === 'orderbook'
    ? [{ label: tr(S.chart_total), data: snaps.map(s => s.totalVal), borderColor: '#7c6af7', tension: 0.3, pointRadius: 0 }]
    : [
        { label: tr(S.chart_lp),   data: snaps.map(s => s.lpVal),   borderColor: '#7c6af7', tension: 0.3, pointRadius: 0 },
        { label: tr(S.chart_hodl), data: snaps.map(s => s.hodlVal), borderColor: '#f5c542', tension: 0.3, pointRadius: 0, borderDash: [5, 5] },
      ];

  if (activeChart) activeChart.destroy();
  activeChart = new window.Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#8b90a8', font: { size: 11 } } } },
      scales: {
        x: { display: false },
        y: { ticks: { color: '#8b90a8', font: { size: 10 } }, grid: { color: '#2e3248' } },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════
//  AUTO OPTIMIZE
// ═══════════════════════════════════════════════════════

function renderAutoPoolSelectStep(el, nav) {
  if (state.pools.length === 0) {
    el.innerHTML = `
      <div class="page-title">${tr(S.auto_pool_title)}</div>
      <div class="status-text"><span class="spinner"></span> ${tr(S.loading_pools)}... <span id="mm-load-timer">0</span>${tr(S.sec)}</div>
    `;
    navBtns(nav, true, null);
    if (state.network === 'pi') loadPiPairs(); else loadPools();
    return;
  }
  if (!scanSelectionSet) {
    state.pools.slice(0, 10).forEach(p => scanSelectedIds.add(p.id));
    scanSelectionSet = true;
  }
  const selCount = scanSelectedIds.size;
  el.innerHTML = `
    <div class="page-title">${tr(S.auto_pool_title)}</div>
    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
      <button class="btn-outline" style="width:auto;padding:5px 12px;font-size:0.8rem" onclick="window.mm_scanSelectAll()">${tr(S.auto_sel_all)}</button>
      <button class="btn-outline" style="width:auto;padding:5px 12px;font-size:0.8rem" onclick="window.mm_scanDeselectAll()">${tr(S.auto_desel_all)}</button>
      <span id="mm-scan-sel-badge" style="font-size:0.82rem;color:var(--accent2)"><strong>${selCount}</strong> ${tr(S.auto_selected)}</span>
    </div>
    <input class="form-input" id="mm-pool-search" placeholder="${tr(S.search_ph)}" oninput="window.mm_filterAutoPool()" value="${poolSearchQuery}">
    <div id="mm-auto-pool-list" style="margin-top:10px">${autoPoolListHtml()}</div>
  `;
  navBtns(nav, true, 'mm_nextStep', null, selCount === 0);
}

function autoPoolListHtml() {
  const filtered = state.pools.filter(p => !poolSearchQuery || poolLabel(p).toLowerCase().includes(poolSearchQuery));
  if (!filtered.length) return `<div class="status-text">${tr(S.no_results)}</div>`;
  const start = poolPage * POOL_PAGE_SIZE;
  const page  = filtered.slice(start, start + POOL_PAGE_SIZE);
  return page.map(p => `
    <div class="pool-card ${scanSelectedIds.has(p.id) ? 'selected' : ''}" onclick="window.mm_toggleScanPool('${p.id}')">
      <div style="display:flex;align-items:center;gap:10px">
        <input type="checkbox" ${scanSelectedIds.has(p.id) ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent);flex-shrink:0;pointer-events:none">
        <div>
          <div class="pool-name">${poolLabel(p)}</div>
          <div class="pool-stat">${state.network === 'pi'
            ? `${tr(S.recent_trades)}: <span style="color:var(--text)">${p.tradeCount}</span> / ${piTotalFetched.toLocaleString()}`
            : `${tr(S.pool_7d_trades)} <span style="color:var(--text)">${(p._trades7d || 0).toLocaleString()}</span>${tr(S.pool_count_unit)} · LP <span style="color:var(--text)">${p._accounts || '?'}</span>`
          }</div>
        </div>
      </div>
    </div>`).join('') + pagerHtml(filtered.length);
}

function filterAutoPool() {
  poolSearchQuery = rootContainer.querySelector('#mm-pool-search')?.value?.toLowerCase() || '';
  poolPage = 0;
  rootContainer.querySelector('#mm-auto-pool-list').innerHTML = autoPoolListHtml();
  const badge = rootContainer.querySelector('#mm-scan-sel-badge');
  if (badge) badge.innerHTML = `<strong>${scanSelectedIds.size}</strong> ${tr(S.auto_selected)}`;
  navBtns(rootContainer.querySelector('#mm-nav-buttons'), true, 'mm_nextStep', null, scanSelectedIds.size === 0);
}

function toggleScanPool(id) {
  if (scanSelectedIds.has(id)) scanSelectedIds.delete(id);
  else scanSelectedIds.add(id);
  rootContainer.querySelector('#mm-auto-pool-list').innerHTML = autoPoolListHtml();
  const badge = rootContainer.querySelector('#mm-scan-sel-badge');
  if (badge) badge.innerHTML = `<strong>${scanSelectedIds.size}</strong> ${tr(S.auto_selected)}`;
  navBtns(rootContainer.querySelector('#mm-nav-buttons'), true, 'mm_nextStep', null, scanSelectedIds.size === 0);
}

function currentPagePools() {
  const filtered = state.pools.filter(p => !poolSearchQuery || poolLabel(p).toLowerCase().includes(poolSearchQuery));
  return filtered.slice(poolPage * POOL_PAGE_SIZE, (poolPage + 1) * POOL_PAGE_SIZE);
}
function scanSelectAll() {
  currentPagePools().forEach(p => scanSelectedIds.add(p.id));
  scanSelectionSet = true;
  renderApp();
}
function scanDeselectAll() {
  currentPagePools().forEach(p => scanSelectedIds.delete(p.id));
  scanSelectionSet = true;
  renderApp();
}

// ── Step 4 (auto): Scan settings ──────────────────────

function quotaBarHtml() {
  const subbed = isSubscribed();
  const remaining = mmRemainingAuto();
  const total = subbed ? MM_FREE_LIMIT + MM_SUB_LIMIT : MM_FREE_LIMIT;
  const cls = subbed ? 'info' : remaining > 0 ? 'info' : 'error';
  const text = subbed
    ? `${tr(S.sub_active_s)}: ${remaining} / ${total}`
    : remaining > 0
      ? `${tr(S.auto_quota)}: ${remaining} / ${total}`
      : `${tr(S.auto_quota_over)}<br><button onclick="window._toggleInfo && window._toggleInfo()" style="margin-top:6px;background:none;border:none;color:var(--accent2);cursor:pointer;font-size:0.8rem;padding:0;">${tr(S.auto_sub_info)}</button>`;
  return `<div id="mm-auto-quota-bar" class="mm-alert ${cls}" style="margin-top:12px">${text}</div>`;
}

function renderScanParamsStep(el, nav) {
  const isPi = state.network === 'pi';
  const p    = state.scanParams;
  const sub  = p.subStrategy || 'orderbook';
  el.innerHTML = `
    <div class="page-title" id="mm-scan-section-title">${sub === 'amm' ? 'AMM' : 'MM'} ${tr(S.scan_title)}</div>
    <div class="mm-alert info">📊 ${scanSelectedIds.size} ${tr(S.auto_selected)} · ${NETWORKS[state.network].name}</div>

    <div class="form-group">
      <label class="form-label">${tr(S.scan_sub_strat)}</label>
      <label class="mm-radio-row">
        <input type="radio" name="mm-scan-strat" value="orderbook" ${sub === 'orderbook' ? 'checked' : ''} onchange="window.mm_updateScanSpreadOpts(this.value)">
        <span>${tr(S.ob_name)}</span>
      </label>
      ${!isPi ? `<label class="mm-radio-row">
        <input type="radio" name="mm-scan-strat" value="amm" ${sub === 'amm' ? 'checked' : ''} onchange="window.mm_updateScanSpreadOpts(this.value)">
        <span>${tr(S.amm_name)}</span>
      </label>` : ''}
    </div>

    <div class="form-group">
      <label class="form-label">${tr(S.scan_records)} <span class="param-hint">${tr(S.p_rec)}: 2,000</span></label>
      <input class="form-input" type="number" id="mm-scan-records" value="${p.records || 2000}" min="200" max="5000" step="100">
    </div>

    <div id="mm-scan-spread-opts">${sub === 'orderbook' ? scanSpreadOptsHtml(p.spreadOptions) : ''}</div>

    ${quotaBarHtml()}
  `;
  navBtns(nav, true, 'mm_goToScanRun', `▶ ${tr(S.btn_run)}`, !mmCanUseAuto());
}

function scanSpreadOptsHtml(selected) {
  const opts = [0.3, 0.5, 1.0, 1.5, 2.0];
  const sel  = selected || opts;
  return `<div class="form-group">
    <label class="form-label">${tr(S.scan_spreads)}</label>
    <div class="mm-check-grid">
      ${opts.map(v => {
        const id = `mm-spread-${String(v).replace('.', '_')}`;
        return `<label class="mm-radio-row" style="margin-bottom:0">
          <input type="checkbox" id="${id}" ${sel.includes(v) ? 'checked' : ''}>
          <span>${v}%</span>
        </label>`;
      }).join('')}
    </div>
  </div>`;
}

function updateScanSpreadOpts(val) {
  const elOpts = rootContainer.querySelector('#mm-scan-spread-opts');
  if (elOpts) elOpts.innerHTML = val === 'orderbook' ? scanSpreadOptsHtml(null) : '';
  const titleEl = rootContainer.querySelector('#mm-scan-section-title');
  if (titleEl) titleEl.textContent = `${val === 'amm' ? 'AMM' : 'MM'} ${tr(S.scan_title)}`;
}

function goToScanRun() {
  const subStrat = rootContainer.querySelector('input[name="mm-scan-strat"]:checked')?.value || 'orderbook';
  const records  = Math.max(200, Math.min(2000, parseInt(rootContainer.querySelector('#mm-scan-records')?.value || '500', 10)));
  const spreadOptions = subStrat === 'orderbook'
    ? [0.3, 0.5, 1.0, 1.5, 2.0].filter(v => rootContainer.querySelector(`#mm-spread-${String(v).replace('.', '_')}`)?.checked)
    : null;
  state.scanParams = { subStrategy: subStrat, records, capital: 500, spreadOptions: spreadOptions?.length ? spreadOptions : [0.5] };
  nextStep();
}

// ── Step 5 (auto): Scan run ────────────────────────────

function renderAutoRunStep(el, nav) {
  const sub = state.scanParams?.subStrategy || 'orderbook';
  el.innerHTML = `
    <div class="page-title">${sub === 'amm' ? 'AMM' : 'MM'} ${tr(S.scan_simulating)}</div>
    <div id="mm-run-status" class="status-text"><span class="spinner"></span> ${tr(S.scan_running)}...</div>
    <div class="mm-progress-bar"><div class="mm-progress-fill" id="mm-run-prog"></div></div>
    <div class="card" style="margin-top:12px">
      <div class="mm-log-list" id="mm-run-log"></div>
    </div>
  `;
  nav.innerHTML = `<button class="btn-outline" id="mm-btn-stop-fetch" onclick="window.mm_stopFetch()">${tr(S.btn_stop)}</button>`;
  runAutoScan();
}

async function runAutoScan() {
  if (!mmCanUseAuto()) {
    rootContainer.querySelector('#mm-run-status').innerHTML = `<div class="mm-alert error">${tr(S.auto_quota_over)}</div>`;
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = `
      <div class="mm-nav-row">
        <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
        <button class="btn-primary" onclick="window._toggleInfo && window._toggleInfo()">${tr(S.auto_sub_info)}</button>
      </div>
    `;
    return;
  }

  const { subStrategy, records, capital, spreadOptions } = state.scanParams;
  const log     = msg => { const elLog = rootContainer.querySelector('#mm-run-log'); if (elLog) elLog.innerHTML += `<div>${msg}</div>`; };
  const status  = msg => { const elStatus = rootContainer.querySelector('#mm-run-status'); if (elStatus) elStatus.innerHTML = msg; };
  const setProg = (cur, tot) => {
    const elProg = rootContainer.querySelector('#mm-run-prog');
    if (elProg) elProg.style.width = `${Math.min(100, cur / tot * 100)}%`;
  };

  mmIncrementAutoCount();
  const selected = state.pools.filter(p => scanSelectedIds.has(p.id));
  state.scanResults = [];

  try {
    for (let i = 0; i < selected.length; i++) {
      if (_fetchStop) break;
      const pool  = selected[i];
      const label = poolLabel(pool);
      status(`<span class="spinner"></span> [${i + 1}/${selected.length}] ${label} — ${tr(S.scan_running)}...`);
      setProg(i, selected.length);

      let tradeRecords;
      try {
        const fetchFn = subStrategy === 'amm' ? fetchTradesForPool : fetchTradesForPair;
        tradeRecords  = await fetchFn(pool, records, (cur, tot) => {
          status(`<span class="spinner"></span> [${i + 1}/${selected.length}] ${label} — ${cur} / ${tot} ${tr(S.run_received)}`);
        });
      } catch (e) {
        log(`✗ ${label}: ${e.message}`);
        continue;
      }

      const trades = parseTrades(tradeRecords);
      if (trades.length < 10) { log(`✗ ${label}: ${tr(S.scan_data_short)} (${trades.length}${tr(S.pool_count_unit)})`); continue; }

      let bestRoi = -Infinity, bestResult = null, bestParams = null;

      if (subStrategy === 'orderbook') {
        for (const spread of spreadOptions) {
          for (const split of [40, 50, 60]) {
            const p = {
              records, totalUsdc: capital, splitRatio: split, spreadPct: spread,
              orderSizePct: 3, layers: 1, stopRatio: 70, feePct: 0, surgeTicks: 3, surgePct: 1.5,
            };
            const r = runOrderbookBacktest(trades, p);
            if (r.roi > bestRoi) { bestRoi = r.roi; bestResult = r; bestParams = p; }
          }
        }
      } else {
        for (const maxIL of [5, 10, 20]) {
          for (const targetRoi of [3, 5, 10]) {
            const p = { records, depositUsdc: capital, maxILPct: maxIL, targetRoiPct: targetRoi };
            const r = runAMMBacktest(pool, trades, p);
            if (r.roi > bestRoi) { bestRoi = r.roi; bestResult = r; bestParams = p; }
          }
        }
      }

      if (bestResult) {
        state.scanResults.push({ pool, params: bestParams, result: bestResult, roi: bestRoi, label });
        const roiStr = bestRoi.toFixed(1);
        const hint   = subStrategy === 'orderbook'
          ? `${tr(S.opt_spread)} ${bestParams.spreadPct}% · ${tr(S.opt_ratio)} ${bestParams.splitRatio}:${100 - bestParams.splitRatio}`
          : `IL ${bestParams.maxILPct}% · ${tr(S.amm_target_roi)} ${bestParams.targetRoiPct}%`;
        log(`✓ ${label}: ROI <strong style="color:${bestRoi >= 0 ? 'var(--green)' : 'var(--red)'}">${roiStr}%</strong> (${hint})`);
      }

      if (i < selected.length - 1) await sleep(800);
    }

    state.scanResults.sort((a, b) => b.roi - a.roi);
    setProg(selected.length, selected.length);
    status(tr(S.scan_done));
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = '';
    await sleep(400);
    nextStep();

  } catch (e) {
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = '';
    status(`<div class="mm-alert error">${tr(S.run_error)}: ${e.message}</div>`);
    rootContainer.querySelector('#mm-nav-buttons').innerHTML = `
      <div class="mm-nav-row">
        <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
        <button class="btn-primary" onclick="window.mm_goToStep(5)">${tr(S.btn_retry)}</button>
      </div>
    `;
  }
}

// ── Step 6 (auto): Results ─────────────────────────────

function renderScanResultStep(el, nav) {
  const results     = state.scanResults;
  const subStrategy = state.scanParams.subStrategy;

  if (!results.length) {
    el.innerHTML = `<div class="page-title">${tr(S.res_scan_title)}</div><div class="mm-alert error">${tr(S.res_scan_empty)}</div>`;
    nav.innerHTML = `<button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>`;
    return;
  }

  el.innerHTML = `
    <div class="page-title">${tr(S.res_scan_title)}</div>
    <div class="card">
      ${results.map((r, idx) => {
        const roi       = r.roi.toFixed(1);
        const roiClass  = r.roi >= 0 ? 'val-green' : 'val-red';
        const paramLine = subStrategy === 'orderbook'
          ? `${tr(S.opt_spread)} ${r.params.spreadPct}% · ${tr(S.opt_ratio)} ${r.params.splitRatio}:${100 - r.params.splitRatio}`
          : `IL ${r.params.maxILPct}% · ${tr(S.amm_target_roi)} ${r.params.targetRoiPct}%`;
        const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : `#${idx + 1} `;
        return `
          <div class="mm-scan-result-row">
            <div class="mm-scan-result-head">
              <span style="font-weight:600">${medal}${r.label}</span>
              <span class="${roiClass}">${roi}%</span>
            </div>
            <div class="mm-scan-result-meta">${paramLine} · ${r.result.fills ?? ''} ${subStrategy === 'orderbook' ? tr(S.opt_fills) : ''}</div>
            <button class="btn-primary" style="width:auto;padding:5px 12px;font-size:0.8rem;margin-top:3px" onclick="window.mm_useScanResult(${idx})">${tr(S.res_scan_use)}</button>
          </div>`;
      }).join('')}
    </div>
  `;
  nav.innerHTML = `
    <div class="mm-nav-row">
      <button class="btn-outline" onclick="window.mm_goToStep(4)">${tr(S.btn_params)}</button>
      <button class="btn-primary" onclick="window.mm_goToStep(1)">${tr(S.btn_new)}</button>
    </div>
  `;
}

function useScanResult(idx) {
  const r = state.scanResults[idx];
  state.strategy = state.scanParams.subStrategy;
  state.pool     = r.pool;
  state.params   = { ...r.params, records: state.scanParams.records };
  goToStep(4);
}

// ═══════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════

function nextStep() { state.step = Math.min(6, state.step + 1); renderApp(); }
function prevStep() { state.step = Math.max(1, state.step - 1); renderApp(); }
function goToStep(n) { state.step = n; renderApp(); }

// ═══════════════════════════════════════════════════════
//  ENTRY POINT
// ═══════════════════════════════════════════════════════

export function renderMM(container) {
  ensureStyles();
  rootContainer = container;
  state = freshState();
  poolSearchQuery = '';
  poolPage = 0;
  activeChart = null;
  _fetchStop = false;
  scanSelectedIds = new Set();
  scanSelectionSet = false;
  piTotalFetched = 0;
  mmSection = 'backtest';

  container.innerHTML = `
    <div class="mm-container">
      <div class="mm-section-toggle">
        <button class="mm-sec-btn active" data-sec="backtest" onclick="window.mm_setSection('backtest')">${tr(S.sec_backtest)}</button>
        <button class="mm-sec-btn" data-sec="tracking" onclick="window.mm_setSection('tracking')">${tr(S.sec_tracking)}</button>
      </div>
      <div id="mm-backtest-wrap">
        <div id="mm-step-indicator"></div>
        <div id="mm-content"></div>
        <div id="mm-nav-buttons"></div>
      </div>
      <div id="mm-tracking-wrap" class="hidden"></div>
    </div>
  `;

  window.mm_setSection         = setSection;
  window.mm_deletePosition     = (id) => { if (confirm(tr(S.track_delete_confirm))) deletePosition(id); };
  window.mm_registerPosition   = registerPositionFromResult;
  window.mm_selectNetwork      = selectNetwork;
  window.mm_selectStrategy     = selectStrategy;
  window.mm_nextStep           = nextStep;
  window.mm_prevStep           = prevStep;
  window.mm_goToStep           = goToStep;
  window.mm_filterPools        = filterPools;
  window.mm_changePage         = changePage;
  window.mm_selectPool         = selectPool;
  window.mm_selectPiPair       = selectPiPair;
  window.mm_loadPiPools        = loadPiPools;
  window.mm_loadPools          = loadPools;
  window.mm_goToRun            = goToRun;
  window.mm_stopFetch          = stopFetch;
  window.mm_scanSelectAll      = scanSelectAll;
  window.mm_scanDeselectAll    = scanDeselectAll;
  window.mm_toggleScanPool     = toggleScanPool;
  window.mm_filterAutoPool     = filterAutoPool;
  window.mm_updateScanSpreadOpts = updateScanSpreadOpts;
  window.mm_goToScanRun        = goToScanRun;
  window.mm_useScanResult      = useScanResult;

  renderApp();
}
