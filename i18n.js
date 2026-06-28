// ═══════════════════════════════════════════
//  PiDEX i18n — LANG 변경 시 setLang() 호출
//  'ko' | 'en' | 'id'
// ═══════════════════════════════════════════

const STRINGS = {
  // ── App / login ──
  processing:        { ko:'처리 중...',                   en:'Processing...',                    id:'Memproses...' },
  connecting:        { ko:'Pi 지갑 연결 중...',            en:'Connecting Pi Wallet...',          id:'Menghubungkan Dompet Pi...' },
  login_fail:        { ko:'로그인 실패. Pi Browser에서 실행해주세요.', en:'Login failed. Please run in Pi Browser.', id:'Login gagal. Jalankan di Pi Browser.' },
  loading_pidex:     { ko:'PiDEX 데이터 로드 중...',       en:'Loading PiDEX data...',            id:'Memuat data PiDEX...' },
  sub_active:        { ko:'구독중',                        en:'Active',                           id:'Aktif' },

  // ── Nav ──
  nav_dex:           { ko:'덱스',                          en:'DEX',                              id:'DEX' },
  nav_lp:            { ko:'LP 계산',                       en:'LP Calc',                          id:'Kalk. LP' },
  nav_arb:           { ko:'차익 탐색',                     en:'Arb Finder',                       id:'Arb Finder' },
  nav_swap:          { ko:'스왑',                          en:'Swap',                             id:'Swap' },
  nav_wallet:        { ko:'지갑',                          en:'Wallet',                           id:'Dompet' },
  nav_info:          { ko:'정보',                          en:'Info',                             id:'Info' },

  // ── Pull to refresh ──
  ptr_pull:          { ko:'당겨서 새로고침',               en:'Pull to refresh',                  id:'Tarik untuk refresh' },

  // ── Dashboard ──
  dash_title:        { ko:'PiDEX 현황',                   en:'Network Overview',                 id:'Ringkasan Jaringan' },
  dash_loading:      { ko:'풀 데이터 로드 중...',           en:'Loading pool data...',             id:'Memuat data pool...' },
  dash_network:      { ko:'네트워크',                      en:'Network',                          id:'Jaringan' },
  dash_total_pools:  { ko:'총 풀 수',                      en:'Total Pools',                      id:'Total Pool' },
  dash_pi_pairs:     { ko:'Pi 포함 풀',                    en:'Pi Pairs',                         id:'Pasangan Pi' },
  dash_tokens:       { ko:'고유 토큰',                     en:'Unique Tokens',                    id:'Token Unik' },
  dash_amm_fee:      { ko:'AMM 수수료',                    en:'Avg AMM Fee',                      id:'Biaya AMM Rata-rata' },
  dash_liquidity:    { ko:'유동성',                        en:'Liquidity',                        id:'Likuiditas' },
  dash_total_liq:    { ko:'전체 유동성 합산',               en:'Total Liquidity',                  id:'Total Likuiditas' },
  dash_gas:          { ko:'권장 가스비',                   en:'Recommended Gas',                  id:'Gas Rekomendasi' },
  dash_top_pools:    { ko:'유동성 상위 풀',                 en:'Top Pools by Liquidity',           id:'Pool Teratas' },
  dash_updated:      { ko:'데이터 기준 시각',               en:'Data as of',                       id:'Data per' },
  dash_fail:         { ko:'데이터 로드 실패',               en:'Data load failed',                 id:'Gagal memuat data' },

  // ── LP Helper ──
  lp_title:          { ko:'LP 계산기',                     en:'LP Calculator',                    id:'Kalkulator LP' },
  lp_search_ph:      { ko:'코인 검색 (예: USDT)',           en:'Search token (e.g. USDT)',         id:'Cari token (mis: USDT)' },
  lp_sort_liq:       { ko:'유동성 높음',                   en:'Liquidity',                        id:'Likuiditas' },
  lp_pi_only:        { ko:'파이포함만',                    en:'Pi Pairs',                         id:'Hanya Pi' },
  lp_pi_first:       { ko:'파이우선',                      en:'Pi First',                         id:'Pi Dahulu' },
  lp_new_pool:       { ko:'새풀',                          en:'New Pool',                         id:'Pool Baru' },
  lp_loading:        { ko:'풀 목록 불러오는 중...',         en:'Loading pools...',                 id:'Memuat daftar pool...' },
  lp_load_fail:      { ko:'풀 목록 조회 실패',             en:'Pool list failed',                 id:'Gagal memuat pool' },
  lp_no_pools:       { ko:'조건에 맞는 풀 없음',            en:'No matching pools',                id:'Tidak ada pool yang cocok' },
  lp_new_title:      { ko:'아직 풀이 없는 토큰 조합',       en:'Pairs without a pool',             id:'Pasangan tanpa pool' },
  lp_no_new:         { ko:'조건에 맞는 새풀 조합 없음',     en:'No new pool pairs found',          id:'Tidak ada pasangan pool baru' },
  lp_no_pool_tag:    { ko:'풀 없음',                       en:'No pool',                          id:'Belum ada pool' },
  lp_selected:       { ko:'선택된 풀',                     en:'Selected Pool',                    id:'Pool Dipilih' },
  lp_deposit_pi:     { ko:'투입할 총 Pi',                  en:'Total Pi to Deposit',              id:'Total Pi untuk Deposit' },
  lp_no_pi_price:    { ko:'Pi 시세 정보 없음',             en:'No Pi price data',                 id:'Tidak ada data harga Pi' },
  lp_no_calc:        { ko:'두 토큰 모두 Pi 시세 정보가 없어 계산할 수 없습니다.', en:'Cannot calculate — no Pi price for either token.', id:'Tidak dapat menghitung — tidak ada harga Pi untuk kedua token.' },
  lp_initial_note:   { ko:'초기 예치 비율이 곧 시작 가격이 됩니다. 아래는 현재 Pi 시세 기준 추천 비율입니다.', en:'The initial deposit ratio becomes the starting price. Below is the recommended ratio based on current Pi prices.', id:'Rasio deposit awal menjadi harga awal. Berikut adalah rasio yang disarankan berdasarkan harga Pi saat ini.' },
  lp_new_pool_label: { ko:'새 풀',                         en:'New Pool',                         id:'Pool Baru' },
  lp_pool_label:     { ko:'풀',                            en:'Pool',                             id:'Pool' },
  lp_preview:        { ko:'예치 미리보기',                  en:'Preview',                          id:'Pratinjau Deposit' },
  lp_ratio_label:    { ko:'비율',                          en:'Ratio',                            id:'Rasio' },
  lp_token_ratio:    { ko:'수량 비율',                     en:'Token Ratio',                      id:'Rasio Token' },
  lp_pool_ratio:     { ko:'비율',                          en:'Ratio',                            id:'Rasio' },
  lp_pool_fee:       { ko:'수수료',                        en:'Fee',                              id:'Biaya' },

  // ── Swap ──
  swap_title:        { ko:'스왑 시뮬레이터',               en:'Swap Simulator',                   id:'Simulator Swap' },
  swap_send:         { ko:'보내는 토큰',                   en:'Send',                             id:'Token Dikirim' },
  swap_receive:      { ko:'받는 토큰',                     en:'Receive',                          id:'Token Diterima' },
  swap_amount:       { ko:'수량',                          en:'Amount',                           id:'Jumlah' },
  swap_dir:          { ko:'방향 전환',                     en:'Swap direction',                   id:'Balik arah' },
  swap_breakdown:    { ko:'스왑 분석',                     en:'Swap Breakdown',                   id:'Analisis Swap' },
  swap_no_pool:      { ko:'해당 쌍의 풀이 없습니다',        en:'No pool found',                    id:'Pool tidak ditemukan' },
  swap_send_lbl:     { ko:'보내는 양',                     en:'Send',                             id:'Jumlah dikirim' },
  swap_amm_fee:      { ko:'AMM 수수료',                    en:'AMM Fee',                          id:'Biaya AMM' },
  swap_gas:          { ko:'가스비',                        en:'Gas Fee',                          id:'Biaya Gas' },
  swap_impact:       { ko:'가격충격',                      en:'Price Impact',                     id:'Dampak Harga' },
  swap_net_in:       { ko:'실제 교환량',                   en:'Net Input',                        id:'Input Bersih' },
  swap_recv_lbl:     { ko:'받는 양',                       en:'Receive',                          id:'Jumlah diterima' },
  swap_rate:         { ko:'환율',                          en:'Rate',                             id:'Kurs' },
  swap_no_route:     { ko:'직접 풀 없음 (멀티홉 미지원)',   en:'No direct pool (multi-hop not supported)', id:'Pool langsung tidak ada' },
  swap_token_fail:   { ko:'토큰 목록 조회 실패',           en:'Token list failed',                id:'Gagal memuat token' },
  lpsplit_title:     { ko:'LP 예치 준비',                  en:'LP Split Calc',                    id:'Persiapan Deposit LP' },
  lpsplit_hint:      { ko:'보유 토큰의 일부를 교환해 LP 예치 비율을 맞출 때 사용하세요.', en:'Use this to split your holdings into the right ratio for LP deposit.', id:'Gunakan ini untuk membagi aset ke rasio yang tepat untuk deposit LP.' },
  lpsplit_token:     { ko:'보유 토큰 / 수량',              en:'Token / Amount',                   id:'Token / Jumlah' },
  lpsplit_target:    { ko:'교환할 상대 토큰',              en:'Target Token',                     id:'Token Tujuan' },
  lpsplit_pct:       { ko:'교환에 사용할 비율',             en:'Exchange %',                       id:'Rasio pertukaran' },
  lpsplit_result:    { ko:'예치 준비 분석',                en:'Split Breakdown',                   id:'Analisis Pembagian' },
  lpsplit_total:     { ko:'전체 보유',                     en:'Total',                            id:'Total dimiliki' },
  lpsplit_portion:   { ko:'교환 사용',                     en:'Swap portion',                     id:'Bagian swap' },
  lpsplit_ready:     { ko:'예치 준비 결과',                en:'Ready to Deposit',                 id:'Siap Deposit' },
  lpsplit_remain:    { ko:'잔여',                          en:'remaining',                        id:'tersisa' },
  lpsplit_received:  { ko:'수령',                          en:'received',                         id:'diterima' },

  // ── Arbitrage ──
  arb_title:         { ko:'차익 탐색',                     en:'Arbitrage Finder',                 id:'Pencarian Arbitrase' },
  arb_settings:      { ko:'탐색 설정',                     en:'Scan Settings',                    id:'Pengaturan Pemindaian' },
  arb_input:         { ko:'투입금액',                      en:'Input Amount',                     id:'Jumlah Input' },
  arb_target:        { ko:'기대 수익률',                   en:'Target Return',                    id:'Target Return' },
  arb_target_hint:   { ko:'이 수익률 이상인 경로만 표시',   en:'Only show paths above this return', id:'Hanya tampilkan jalur di atas return ini' },
  arb_min:           { ko:'최소 수익률',                   en:'Min Return',                       id:'Return Minimum' },
  arb_min_hint:      { ko:'이 미만은 실행 비추천으로 표시', en:'Below this is marked as not recommended', id:'Di bawah ini ditandai tidak direkomendasikan' },
  arb_liq:           { ko:'최소 유동성',                   en:'Min Liquidity',                    id:'Likuiditas Minimum' },
  arb_liq_hint:      { ko:'풀 양쪽 중 작은 쪽 기준으로 필터', en:'Filter by smaller side of pool', id:'Filter berdasarkan sisi pool terkecil' },
  arb_scan_btn:      { ko:'경로 탐색',                     en:'Find Paths',                       id:'Cari Jalur' },
  arb_subscribed:    { ko:'구독 중 — 무제한 탐색',          en:'Subscribed — Unlimited',           id:'Berlangganan — Tanpa Batas' },
  arb_remaining:     { ko:'오늘 남은 탐색 횟수',            en:'Daily remaining',                  id:'Sisa hari ini' },
  arb_resets:        { ko:'내일 초기화됩니다',              en:'Resets tomorrow',                  id:'Reset besok' },
  arb_over:          { ko:'오늘 탐색 횟수(100회)를 모두 사용했습니다. 내일 초기화됩니다.', en:'Daily limit (100) reached. Resets tomorrow.', id:'Batas harian (100) tercapai. Reset besok.' },
  arb_scanning:      { ko:'풀 스캔 중...',                  en:'Scanning pools...',                id:'Memindai pool...' },
  arb_loading_pools: { ko:'전체 풀 로드 중... (페이지네이션)', en:'Loading all pools...',           id:'Memuat semua pool...' },
  arb_no_liq:        { ko:'유동성 조건을 만족하는 풀이 없습니다.\n최소 유동성 값을 낮춰보세요.', en:'No pools meet the liquidity requirement.\nTry lowering the minimum.', id:'Tidak ada pool yang memenuhi syarat likuiditas.\nCoba turunkan minimumnya.' },
  arb_total_pools:   { ko:'전체 풀',                       en:'Total pools',                      id:'Total pool' },
  arb_liq_pass:      { ko:'유동성 통과',                   en:'passed liquidity filter',          id:'lolos filter likuiditas' },
  arb_paths:         { ko:'경로',                          en:'paths',                            id:'jalur' },
  arb_scanned:       { ko:'탐색',                          en:'scanned',                          id:'dipindai' },
  arb_no_result:     { ko:'기대 수익률 이상인 경로 없음',   en:'No paths above target return',     id:'Tidak ada jalur di atas target return' },
  arb_found:         { ko:'수익 가능 경로',                 en:'profitable paths',                 id:'jalur menguntungkan' },
  arb_lower:         { ko:'기대 수익률을 낮춰보세요',       en:'Try lowering the target return',   id:'Coba turunkan target return' },
  arb_none:          { ko:'수익 가능 경로 없음 (테스트넷 풀 유동성이 부족할 수 있습니다)', en:'No profitable paths (testnet liquidity may be low)', id:'Tidak ada jalur menguntungkan (likuiditas testnet mungkin rendah)' },
  arb_error:         { ko:'오류',                          en:'Error',                            id:'Kesalahan' },
  arb_amm_fee:       { ko:'AMM 수수료',                    en:'AMM Fee',                          id:'Biaya AMM' },
  arb_gas:           { ko:'가스비',                        en:'Gas Fee',                          id:'Biaya Gas' },
  arb_impact:        { ko:'가격충격',                      en:'Price Impact',                     id:'Dampak Harga' },
  arb_net:           { ko:'순 수익률',                     en:'Net Return',                       id:'Return Bersih' },
  arb_output:        { ko:'예상 수령량',                   en:'Expected Output',                  id:'Output Diharapkan' },
  arb_caution:       { ko:'⚠️ 실행 비추천 (최소 수익률 미달)', en:'⚠️ Not recommended (below min return)', id:'⚠️ Tidak disarankan (di bawah return minimum)' },

  // ── Wallet ──
  wallet_title:      { ko:'지갑 현황',                     en:'Wallet Overview',                  id:'Ringkasan Dompet' },
  wallet_refresh:    { ko:'새로고침',                      en:'Refresh',                          id:'Segarkan' },
  wallet_loading:    { ko:'잔액 조회 중...',               en:'Loading...',                       id:'Memuat...' },
  wallet_no_key:     { ko:'정보 탭에서 공개주소를 등록해주세요.', en:'Register your public key in the Info tab.', id:'Daftarkan kunci publik Anda di tab Info.' },
  wallet_loading2:   { ko:'지갑 데이터 로드 중...',         en:'Loading wallet data...',           id:'Memuat data dompet...' },
  wallet_pi:         { ko:'테스트 Pi',                     en:'Test Pi Balance',                  id:'Saldo Pi Uji' },
  wallet_total:      { ko:'총 보유',                       en:'Total',                            id:'Total' },
  wallet_avail:      { ko:'사용 가능',                     en:'Available',                        id:'Tersedia' },
  wallet_reserve:    { ko:'최소 예비금',                   en:'Min Reserve',                      id:'Cadangan Minimum' },
  wallet_reserve_note:{ ko:'계정 + 트러스트라인 × 0.5',   en:'account + trustlines × 0.5',       id:'akun + trustline × 0.5' },
  wallet_tokens:     { ko:'보유 토큰',                     en:'Token Balances',                   id:'Saldo Token' },
  wallet_lp:         { ko:'LP 예치 현황',                  en:'LP Positions',                     id:'Posisi LP' },
  wallet_no_lp:      { ko:'예치된 LP 없음',                en:'No LP positions',                  id:'Tidak ada posisi LP' },
  wallet_share:      { ko:'풀 점유율',                     en:'Pool share',                       id:'Bagian pool' },
  wallet_stake:      { ko:'지분',                          en:'shares',                           id:'bagian' },
  wallet_trustlines: { ko:'연결된 토큰',                   en:'Trustlines',                       id:'Trustline' },
  wallet_no_balance: { ko:'잔액 없음',                     en:'No balance',                       id:'Tidak ada saldo' },
  wallet_zero_tl:    { ko:'연결만 된 토큰 (잔액 없음)',     en:'Trustlines with zero balance',     id:'Trustline saldo nol' },
  wallet_updated:    { ko:'조회 시각',                     en:'Updated at',                       id:'Diperbarui pukul' },
  wallet_fail:       { ko:'조회 실패',                     en:'Load failed',                      id:'Gagal memuat' },
  wallet_check_key:  { ko:'정보 탭에서 공개주소를 다시 확인해주세요.', en:'Please check your public key in the Info tab.', id:'Periksa kembali kunci publik Anda di tab Info.' },

  // ── Info / Subscription ──
  info_title:        { ko:'정보',                          en:'Info',                             id:'Info' },
  info_about:        { ko:'앱 소개',                       en:'About',                            id:'Tentang Aplikasi' },
  info_notice:       { ko:'시뮬레이션 전용',               en:'Simulation Only',                  id:'Hanya Simulasi' },
  info_notice_desc:  { ko:'이 앱은 분석·시뮬레이션 도구입니다. 실제 거래는 Pi Browser의 PiDEX에서 직접 진행해주세요.', en:'This app is for analysis only. Execute trades on PiDEX in Pi Browser.', id:'Aplikasi ini hanya untuk analisis. Lakukan perdagangan nyata di PiDEX pada Pi Browser.' },
  info_pubkey:       { ko:'지갑 공개주소 등록',             en:'Register Wallet Address',          id:'Daftarkan Alamat Dompet' },
  info_pubkey_desc:  { ko:'Pi 지갑의 공개주소(G로 시작, 56자리)를 등록하면 지갑 탭이 활성화됩니다.\n총 보유 Pi, 토큰 잔액, LP 예치 현황 등을 확인할 수 있습니다. 공개주소는 읽기 전용으로 안전합니다.', en:'Register your public key (G..., 56 chars) to activate the Wallet tab and view Pi balance, tokens, and LP positions. Public key is read-only and safe.', id:'Daftarkan kunci publik Pi Anda (G..., 56 karakter) untuk mengaktifkan tab Dompet dan melihat saldo Pi, token, dan posisi LP. Kunci publik hanya untuk baca dan aman.' },
  info_registered:   { ko:'등록됨',                        en:'Active',                           id:'Terdaftar' },
  info_remove_key:   { ko:'주소 삭제',                     en:'Remove',                           id:'Hapus Alamat' },
  info_save_key:     { ko:'등록',                          en:'Add',                              id:'Daftarkan' },
  info_key_ph:       { ko:'GXXXX... (56자리 공개주소)',     en:'GXXXX... (56-char public key)',    id:'GXXXX... (56 karakter kunci publik)' },
  info_contact:      { ko:'문의 및 피드백',                en:'Contact & Feedback',               id:'Kontak & Masukan' },
  info_contact_desc: { ko:'사용 중 문의사항이나 피드백은 유튜브 채널 댓글로 남겨주세요.', en:'Leave questions or feedback in the YouTube channel comments.', id:'Tinggalkan pertanyaan atau masukan di kolom komentar YouTube.' },
  info_copy:         { ko:'복사',                          en:'Copy',                             id:'Salin' },
  info_copied:       { ko:'복사됨',                        en:'Copied!',                          id:'Tersalin!' },
  info_copy_note:    { ko:'위 주소를 복사 후 유튜브에서 검색해주세요.', en:'Copy the URL and search in YouTube.', id:'Salin URL dan cari di YouTube.' },
  info_key_removed:  { ko:'공개주소가 삭제되었습니다.',     en:'Public key removed.',              id:'Kunci publik dihapus.' },
  info_key_invalid:  { ko:'G로 시작하는 56자리 공개주소를 입력해주세요.', en:'Please enter a valid 56-char public key starting with G.', id:'Masukkan kunci publik 56 karakter yang dimulai dengan G.' },
  info_key_saved:    { ko:'등록 완료! 지갑 탭이 활성화됩니다.', en:'Saved! Wallet tab is now active.', id:'Tersimpan! Tab Dompet sekarang aktif.' },
};

let _lang = localStorage.getItem('pidex_lang') || 'ko';

export function getLang() { return _lang; }

export function setLang(lang) {
  _lang = lang;
  localStorage.setItem('pidex_lang', lang);
}

export function t(key) {
  const s = STRINGS[key];
  if (!s) return key;
  return s[_lang] ?? s.ko;
}
