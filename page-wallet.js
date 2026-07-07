import { fetchAccount, fetchPoolById, fetchPayments } from './horizon.js';
import { formatPi, formatToken } from './util-format.js';
import { showLoading, hideLoading, showToast, rerenderPage } from './app.js';
import { setupPullToRefresh } from './page-dashboard.js';
import { t } from './i18n.js';
import { currentUser } from './pi-sdk.js';
import { backupWalletsToCloud, restoreWalletsFromCloud } from './firebase-wallet.js';

const WALLETS_KEY = 'pidex_wallets';
const ACTIVE_KEY  = 'pidex_active_wallet';
const LEGACY_KEY  = 'stellar_pub_key';

// ─── Storage helpers ────────────────────────────────────────────────────────

function getWallets() {
  try { return JSON.parse(localStorage.getItem(WALLETS_KEY)) ?? []; } catch { return []; }
}
function saveWallets(wallets) {
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
}
function getActiveId()    { return localStorage.getItem(ACTIVE_KEY); }
function setActiveId(id)  { localStorage.setItem(ACTIVE_KEY, id); }
function genId()          { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

function getActiveWallet() {
  const wallets = getWallets();
  if (!wallets.length) return null;
  return wallets.find(w => w.id === getActiveId()) ?? wallets[0];
}

function migrateLegacy() {
  if (localStorage.getItem(WALLETS_KEY) !== null) return;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;
  saveWallets([{ id: genId(), address: legacy, alias: 'Wallet 1' }]);
}

// ─── Modal factory ──────────────────────────────────────────────────────────

function openModal(innerHtml) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box" style="max-width:360px;">${innerHtml}</div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  return { overlay, close };
}

// ─── Add wallet dialog ──────────────────────────────────────────────────────

function showAddDialog(onSaved) {
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h2 style="font-size:16px;">${t('wallet_add_title')}</h2>
      <button class="modal-close" id="md-x">✕</button>
    </div>
    <div class="modal-body">
      <div style="background:rgba(255,160,0,0.12);border:1px solid rgba(255,160,0,0.4);border-radius:10px;padding:10px;margin-bottom:12px;font-size:12px;line-height:1.6;color:#f0b429;">
        ${t('wallet_change_warn').replace(/\n/g, '<br>')}
      </div>
      <label style="font-size:12px;display:block;margin-bottom:4px;">${t('wallet_alias_label')}</label>
      <input type="text" id="md-alias" class="form-input" placeholder="${t('wallet_alias_ph')}" style="font-size:12px;margin-bottom:10px;" />
      <label style="font-size:12px;display:block;margin-bottom:4px;">${t('wallet_change_ph')}</label>
      <input type="text" id="md-addr" class="form-input" placeholder="${t('wallet_change_ph')}" style="font-size:12px;" />
      <p id="md-err" style="color:var(--red);font-size:11px;margin-top:6px;display:none;"></p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn-outline btn-sm" id="md-cancel" style="flex:1;">${t('wallet_change_cancel')}</button>
        <button class="btn-primary btn-sm" id="md-save" style="flex:1;">${t('wallet_change_save')}</button>
      </div>
    </div>
  `);

  overlay.querySelector('#md-x').onclick      = close;
  overlay.querySelector('#md-cancel').onclick = close;

  overlay.querySelector('#md-save').onclick = () => {
    const alias  = overlay.querySelector('#md-alias').value.trim() || `Wallet ${getWallets().length + 1}`;
    const addr   = overlay.querySelector('#md-addr').value.trim();
    const errEl  = overlay.querySelector('#md-err');

    if (!addr.startsWith('G') || addr.length !== 56) {
      errEl.textContent  = t('info_key_invalid');
      errEl.style.display = '';
      return;
    }
    if (getWallets().some(w => w.address === addr)) {
      errEl.textContent  = t('wallet_duplicate_addr');
      errEl.style.display = '';
      return;
    }

    const wallet  = { id: genId(), address: addr, alias };
    const wallets = getWallets();
    wallets.push(wallet);
    saveWallets(wallets);
    setActiveId(wallet.id);
    close();
    onSaved();
  };
}

// ─── Edit alias dialog ──────────────────────────────────────────────────────

function showEditAliasDialog(wallet, onSaved) {
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h2 style="font-size:16px;">${t('wallet_edit_alias')}</h2>
      <button class="modal-close" id="md-x">✕</button>
    </div>
    <div class="modal-body">
      <input type="text" id="md-alias" class="form-input" value="${wallet.alias}" style="font-size:12px;" />
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn-outline btn-sm" id="md-cancel" style="flex:1;">${t('wallet_change_cancel')}</button>
        <button class="btn-primary btn-sm" id="md-save" style="flex:1;">${t('wallet_change_save')}</button>
      </div>
    </div>
  `);

  overlay.querySelector('#md-x').onclick      = close;
  overlay.querySelector('#md-cancel').onclick = close;
  overlay.querySelector('#md-alias').select();

  overlay.querySelector('#md-save').onclick = () => {
    const alias = overlay.querySelector('#md-alias').value.trim();
    if (!alias) return;
    const wallets = getWallets();
    const idx     = wallets.findIndex(w => w.id === wallet.id);
    if (idx !== -1) { wallets[idx].alias = alias; saveWallets(wallets); }
    close();
    onSaved();
  };
}

// ─── Delete confirm dialog ──────────────────────────────────────────────────

function showDeleteDialog(wallet, onConfirmed) {
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h2 style="font-size:16px;">${t('wallet_delete')}</h2>
      <button class="modal-close" id="md-x">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;margin-bottom:12px;line-height:1.5;">${t('wallet_delete_confirm')}</p>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">${wallet.alias} · ${wallet.address.slice(0, 8)}···${wallet.address.slice(-8)}</p>
      <div style="display:flex;gap:8px;">
        <button class="btn-outline btn-sm" id="md-cancel" style="flex:1;">${t('wallet_change_cancel')}</button>
        <button class="btn-primary btn-sm" id="md-del" style="flex:1;background:var(--red);">${t('wallet_delete')}</button>
      </div>
    </div>
  `);

  overlay.querySelector('#md-x').onclick      = close;
  overlay.querySelector('#md-cancel').onclick = close;
  overlay.querySelector('#md-del').onclick    = () => { close(); onConfirmed(); };
}

// ─── Restore warning dialog ─────────────────────────────────────────────────

function showRestoreDialog(onConfirmed) {
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h2 style="font-size:16px;">${t('wallet_cloud_restore')}</h2>
      <button class="modal-close" id="md-x">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12px;line-height:1.6;margin-bottom:16px;color:#f0b429;">${t('wallet_restore_warn')}</p>
      <div style="display:flex;gap:8px;">
        <button class="btn-outline btn-sm" id="md-cancel" style="flex:1;">${t('wallet_change_cancel')}</button>
        <button class="btn-primary btn-sm" id="md-ok" style="flex:1;">${t('wallet_confirm')}</button>
      </div>
    </div>
  `);

  overlay.querySelector('#md-x').onclick      = close;
  overlay.querySelector('#md-cancel').onclick = close;
  overlay.querySelector('#md-ok').onclick     = () => { close(); onConfirmed(); };
}

// ─── Cloud backup / restore ─────────────────────────────────────────────────

function attachCloudButtons(container) {
  container.querySelector('#btn-cloud-backup')?.addEventListener('click', async () => {
    if (!currentUser?.uid) { showToast(t('wallet_cloud_fail')); return; }
    try {
      showLoading(t('processing'));
      await backupWalletsToCloud(currentUser.uid, getWallets());
      hideLoading();
      showToast(t('wallet_cloud_ok'));
    } catch {
      hideLoading();
      showToast(t('wallet_cloud_fail'));
    }
  });

  container.querySelector('#btn-cloud-restore')?.addEventListener('click', () => {
    if (!currentUser?.uid) { showToast(t('wallet_cloud_fail')); return; }
    showRestoreDialog(async () => {
      try {
        showLoading(t('processing'));
        const data = await restoreWalletsFromCloud(currentUser.uid);
        hideLoading();
        if (!data?.length) { showToast(t('wallet_cloud_no_data')); return; }
        saveWallets(data);
        setActiveId(data[0].id);
        showToast(t('wallet_restore_ok'));
        rerenderPage('wallet');
      } catch {
        hideLoading();
        showToast(t('wallet_restore_fail'));
      }
    });
  });
}

function cloudButtonsHtml() {
  return `
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button class="btn-outline btn-sm" id="btn-cloud-backup"  style="flex:1;font-size:11px;">${t('wallet_cloud_backup')}</button>
      <button class="btn-outline btn-sm" id="btn-cloud-restore" style="flex:1;font-size:11px;">${t('wallet_cloud_restore')}</button>
    </div>
    <p style="font-size:11px;color:#f0b429;margin:6px 0 0;line-height:1.5;opacity:0.85;">💡 ${t('wallet_backup_tip')}</p>
  `;
}

// ─── Transaction row ────────────────────────────────────────────────────────

function txRowHtml(op, walletAlias) {
  const isIn   = op.isIncoming;
  const other  = isIn ? op.from : op.to;
  const short  = other ? `${other.slice(0, 6)}···${other.slice(-4)}` : '?';
  const asset  = op.asset_code ?? (op.asset_type === 'native' ? 'π' : (op.asset_type ?? '?'));
  const amount = parseFloat(op.amount ?? 0).toFixed(2);
  const date   = op.created_at ? new Date(op.created_at).toLocaleDateString() : '';
  const color  = isIn ? 'var(--green)' : '#f0b429';
  const dir    = isIn ? t('wallet_tx_recv') : t('wallet_tx_sent');
  const arrow  = isIn ? '↙' : '↗';

  const myChip    = `<span style="background:rgba(255,255,255,0.10);padding:2px 7px;border-radius:4px;color:var(--accent);font-weight:600;">${walletAlias}</span>`;
  const otherChip = `<span style="background:rgba(255,255,255,0.06);padding:2px 7px;border-radius:4px;color:#999;font-family:monospace;">${short}</span>`;
  const fromChip  = isIn ? otherChip : myChip;
  const toChip    = isIn ? myChip    : otherChip;

  return `
    <div style="border-left:3px solid ${color};padding:10px 12px;margin-bottom:8px;border-radius:0 8px 8px 0;background:rgba(255,255,255,0.03);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:600;color:${color};">${arrow} ${dir}</span>
        <span style="font-size:13px;font-weight:700;color:${color};">${amount} ${asset}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;font-size:11px;flex-wrap:wrap;">
        ${fromChip}
        <span style="color:#555;font-size:13px;">──→</span>
        ${toChip}
      </div>
      <div style="font-size:10px;color:#666;margin-top:4px;">${date}</div>
    </div>
  `;
}

// ─── Empty state ────────────────────────────────────────────────────────────

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">${t('wallet_title')}</h2>
      <div class="card" style="text-align:center;padding:32px 16px;">
        <p style="color:var(--text-dim);margin-bottom:20px;">${t('wallet_no_wallets')}</p>
        <button class="btn-primary" id="btn-add-first" style="width:auto;padding:0 24px;">${t('wallet_add')}</button>
      </div>
      ${cloudButtonsHtml()}
    </div>
  `;
  container.querySelector('#btn-add-first').addEventListener('click', () => {
    showAddDialog(() => rerenderPage('wallet'));
  });
  attachCloudButtons(container);
}

// ─── Wallet detail ──────────────────────────────────────────────────────────

async function loadWalletDetail(detailEl, wallet, allWallets) {
  detailEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;padding:8px 0;">${t('wallet_loading')}</p>`;

  try {
    showLoading(t('wallet_loading2'));
    const [account, payments] = await Promise.all([
      fetchAccount(wallet.address),
      fetchPayments(wallet.address, 20),
    ]);

    const lpDetails = await Promise.allSettled(
      account.lpShares.map(s => fetchPoolById(s.liquidity_pool_id))
    );

    hideLoading();

    const subentries    = account.raw.subentry_count ?? 0;
    const minReserve    = (2 + subentries) * 0.5;
    const availablePi   = Math.max(0, account.pi - minReserve);
    const tokensWithBal = account.tokens.filter(tok => parseFloat(tok.balance) > 0);
    const tokensNoBal   = account.tokens.filter(tok => parseFloat(tok.balance) === 0);

    const lpHtml = account.lpShares.length === 0
      ? `<div class="card"><p class="empty-msg">${t('wallet_no_lp')}</p></div>`
      : `<div class="card">
          ${account.lpShares.map((s, i) => {
            const res   = lpDetails[i];
            const pool  = res.status === 'fulfilled' ? res.value : null;
            const pair  = pool ? `${pool.assetA} / ${pool.assetB}` : s.liquidity_pool_id.slice(0, 12) + '...';
            const ratio = pool && pool.totalShares > 0
              ? ((parseFloat(s.balance) / pool.totalShares) * 100).toFixed(4)
              : null;
            return `
              <div class="wallet-pi-row lp-row">
                <div>
                  <div class="token-name">${pair}</div>
                  ${ratio ? `<div class="lp-share-pct">${t('wallet_share')}: ${ratio}%</div>` : ''}
                </div>
                <span>${parseFloat(s.balance).toFixed(6)} ${t('wallet_stake')}</span>
              </div>`;
          }).join('')}
        </div>`;

    const txHtml = payments.length === 0
      ? `<div class="card"><p class="empty-msg">${t('wallet_tx_none')}</p></div>`
      : `<div class="card" style="padding:12px;">
          ${payments.map(op => txRowHtml(op, wallet.alias)).join('')}
        </div>`;

    detailEl.innerHTML = `
      <!-- Address bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:10px;">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:2px;">${wallet.alias}</div>
          <div style="font-size:11px;color:#888;font-family:monospace;">${wallet.address.slice(0, 8)}···${wallet.address.slice(-8)}</div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn-outline btn-sm" id="btn-edit-alias" style="padding:0 8px;font-size:12px;">✏️</button>
          ${allWallets.length > 1 ? `<button class="btn-outline btn-sm" id="btn-del-wallet" style="padding:0 8px;font-size:12px;">🗑️</button>` : ''}
        </div>
      </div>

      <!-- Pi balance -->
      <div class="dash-section-title">${t('wallet_pi')}</div>
      <div class="card">
        <div class="wallet-pi-row main">
          <span>${t('wallet_total')}</span>
          <span class="wallet-pi-val">${formatPi(account.pi)}</span>
        </div>
        <div class="wallet-pi-row">
          <span>${t('wallet_avail')}</span>
          <span class="val-green">${formatPi(availablePi)}</span>
        </div>
        <div class="wallet-pi-row">
          <span>${t('wallet_reserve')} <span class="hint-inline">(${t('wallet_reserve_note')})</span></span>
          <span class="val-red">~${formatPi(minReserve)}</span>
        </div>
      </div>

      ${tokensWithBal.length > 0 ? `
        <div class="dash-section-title">${t('wallet_tokens')}</div>
        <div class="card">
          ${tokensWithBal.map(tok => `
            <div class="wallet-pi-row">
              <span class="token-name">${tok.asset_code ?? tok.asset_type}
                <span class="token-issuer">${(tok.asset_issuer ?? '').slice(0, 6)}...</span>
              </span>
              <span>${formatToken(tok.balance, tok.asset_code)}</span>
            </div>`).join('')}
        </div>` : ''}

      <div class="dash-section-title">${t('wallet_lp')}</div>
      ${lpHtml}

      ${account.tokens.length > 0 ? `
        <div class="dash-section-title">${t('wallet_trustlines')}</div>
        <div class="card">
          ${account.tokens.map(tok => `
            <div class="wallet-pi-row">
              <span class="token-name">${tok.asset_code ?? tok.asset_type}
                <span class="token-issuer">${(tok.asset_issuer ?? '').slice(0, 6)}...</span>
              </span>
              <span class="${parseFloat(tok.balance) > 0 ? '' : 'val-dim'}">${parseFloat(tok.balance) > 0 ? formatToken(tok.balance, tok.asset_code) : t('wallet_no_balance')}</span>
            </div>`).join('')}
          ${tokensNoBal.length > 0
            ? `<p class="hint-text">${t('wallet_zero_tl')} ${tokensNoBal.length}</p>`
            : ''}
        </div>` : ''}

      <!-- Transactions -->
      <div class="dash-section-title">${t('wallet_txs')}</div>
      ${txHtml}

      <p class="dash-updated">${t('wallet_updated')}: ${new Date().toLocaleTimeString()}</p>
    `;

    detailEl.querySelector('#btn-edit-alias')?.addEventListener('click', () => {
      showEditAliasDialog(wallet, () => rerenderPage('wallet'));
    });

    detailEl.querySelector('#btn-del-wallet')?.addEventListener('click', () => {
      showDeleteDialog(wallet, () => {
        const remaining = getWallets().filter(w => w.id !== wallet.id);
        saveWallets(remaining);
        if (remaining.length) setActiveId(remaining[0].id);
        rerenderPage('wallet');
      });
    });

  } catch (e) {
    hideLoading();
    detailEl.innerHTML = `
      <div class="card">
        <p class="empty-msg" style="color:var(--red)">${t('wallet_fail')}: ${e.message}</p>
        <p class="form-hint">${t('wallet_check_key')}</p>
      </div>
    `;
  }
}

// ─── Main render ────────────────────────────────────────────────────────────

export async function renderWallet(container) {
  migrateLegacy();

  // Auto-register Pi SDK wallet on first load if no wallets exist
  if (currentUser?.wallet_address && !getWallets().length) {
    saveWallets([{ id: genId(), address: currentUser.wallet_address, alias: 'Pi Wallet' }]);
  }

  const wallets = getWallets();

  if (!wallets.length) {
    renderEmptyState(container);
    return;
  }

  const active = getActiveWallet();
  setActiveId(active.id);

  // Selector bar HTML
  const selectorHtml = `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
      ${wallets.map(w => `
        <button class="wallet-chip${w.id === active.id ? ' active' : ''}"
          data-wid="${w.id}"
          style="padding:4px 12px;border-radius:20px;font-size:12px;border:1px solid ${w.id === active.id ? 'var(--accent)' : 'var(--border)'};background:${w.id === active.id ? 'var(--accent)' : 'transparent'};color:${w.id === active.id ? '#000' : 'var(--text)'};cursor:pointer;white-space:nowrap;">
          ${w.alias}
        </button>`).join('')}
      <button id="btn-add-wallet"
        style="padding:4px 12px;border-radius:20px;font-size:12px;border:1px dashed var(--border);background:transparent;color:var(--text-dim);cursor:pointer;">
        + ${t('wallet_add')}
      </button>
    </div>
  `;

  container.innerHTML = `
    <div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <h2 class="page-title" style="margin:0;">${t('wallet_title')}</h2>
        <button class="btn-outline btn-sm" id="btn-wallet-refresh" style="width:auto;padding:0 12px;">↻ ${t('wallet_refresh')}</button>
      </div>
      ${selectorHtml}
      ${cloudButtonsHtml()}
      <div id="wallet-detail" style="margin-top:16px;"></div>
    </div>
  `;

  setupPullToRefresh(container, () => rerenderPage('wallet'));

  container.querySelector('#btn-wallet-refresh').addEventListener('click', () => rerenderPage('wallet'));

  container.querySelector('#btn-add-wallet').addEventListener('click', () => {
    showAddDialog(() => rerenderPage('wallet'));
  });

  container.querySelectorAll('[data-wid]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveId(btn.dataset.wid);
      rerenderPage('wallet');
    });
  });

  attachCloudButtons(container);

  await loadWalletDetail(container.querySelector('#wallet-detail'), active, wallets);
}
