import { fetchAccount, fetchPoolById, fetchPayments, isAccountActive } from './horizon.js';
import { formatPi, formatToken } from './util-format.js';
import { showLoading, hideLoading, showToast, rerenderPage } from './app.js';
import { setupPullToRefresh } from './page-dashboard.js';
import { t } from './i18n.js';
import { currentUser, currentAccessToken } from './pi-sdk.js';
import {
  fetchWalletsServer, saveWalletsServer, PIDEX_WALLET_MAX,
  registerInHackWatch, registerInHackWallet, fetchAddressAliases, setAddressAlias,
  migrateAddressAliasesIfNeeded,
} from './firebase-wallet.js';

const ACTIVE_KEY = 'pidex_active_wallet'; // UI 선택 상태만 로컬 — 목록 자체는 서버가 원본

function getActiveId()   { return localStorage.getItem(ACTIVE_KEY); }
function setActiveId(id) { localStorage.setItem(ACTIVE_KEY, id); }
function genId()         { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function getUsername()   { return currentUser?.username || document.getElementById('header-username')?.textContent?.trim() || null; }
function esc(str)        { return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ─── 공용 주소 별칭 사전 (pidex_address_aliases, 두 앱 공유 — 등록/조회 전부 여기로 통일) ──
let addressAliases = {};
function aliasFor(addr) { return addr ? addressAliases[addr] : undefined; }
export async function loadAddressAliases() {
  const username = getUsername();
  addressAliases = username
    ? await migrateAddressAliasesIfNeeded(username) // 로그인 후엔 1회성 정리까지 겸함(멱등)
    : await fetchAddressAliases(username);
}
loadAddressAliases();

// ─── 주소 컨텍스트 메뉴 ─────────────────────────────────────

let walletMenuAddr = '';
let walletMenuBound = false;
let walletMenuDismissing = false;

function showWalletAddrMenu(addr, anchorEl) {
  walletMenuAddr = addr;
  const menu  = document.getElementById('wallet-addr-menu');
  document.getElementById('wamenu-watch').textContent       = `👁 ${t('wallet_ctx_watch')}`;
  document.getElementById('wamenu-hack-wallet').textContent = `💼 ${t('wallet_ctx_hack_wallet')}`;
  document.getElementById('wamenu-copy').textContent        = `📋 ${t('wallet_ctx_copy')}`;

  const menuW = 240;
  const rect  = anchorEl.getBoundingClientRect();
  let left = Math.min(rect.left, window.innerWidth - menuW - 8);
  let top  = rect.bottom + 6;
  if (top + 110 > window.innerHeight) top = rect.top - 114;
  menu.style.left = `${Math.max(8, left)}px`;
  menu.style.top  = `${top}px`;
  menu.classList.remove('hidden');
}

function hideWalletAddrMenu() {
  document.getElementById('wallet-addr-menu')?.classList.add('hidden');
  walletMenuAddr = '';
}

function initWalletAddrMenu() {
  if (walletMenuBound) return;
  walletMenuBound = true;

  document.getElementById('wamenu-watch').addEventListener('click', async () => {
    const addr = walletMenuAddr;
    hideWalletAddrMenu();
    if (!addr) return;
    const username = getUsername();
    if (!username) { showToast(t('wallet_ctx_fail')); return; }
    const alias = aliasFor(addr) || `W·${addr.slice(0, 6)}···${addr.slice(-4)}`;

    const doAdd = () => {
      registerInHackWatch(username, addr, alias)
        .then(result => {
          if (result === 'added')     showToast(t('wallet_ctx_watch_sent'));
          else if (result === 'duplicate') showToast(t('wallet_ctx_watch_dup'));
          else if (result === 'full') showToast(t('wallet_ctx_watch_full'));
        })
        .catch(() => showToast(t('wallet_ctx_fail')));
    };

    const active = await isAccountActive(addr);
    if (active) doAdd();
    else showConfirmDialog(t('wallet_not_activated_title'), t('wallet_not_activated_confirm'), doAdd, t('wallet_continue'));
  });

  document.getElementById('wamenu-hack-wallet').addEventListener('click', () => {
    const addr = walletMenuAddr;
    hideWalletAddrMenu();
    if (!addr) return;
    sendAddrToHackWallet(addr);
  });

  document.getElementById('wamenu-copy').addEventListener('click', () => {
    const addr = walletMenuAddr;
    hideWalletAddrMenu();
    if (!addr) return;
    navigator.clipboard.writeText(addr).then(() => showToast(t('wallet_copied'))).catch(() => {});
  });

  document.addEventListener('touchstart', (e) => {
    const menu = document.getElementById('wallet-addr-menu');
    if (!menu?.classList.contains('hidden') && !menu.contains(e.target) && !e.target.closest('[data-copy-addr]')) {
      walletMenuDismissing = true;
      hideWalletAddrMenu();
    }
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('wallet-addr-menu');
    if (!menu?.classList.contains('hidden') && !menu.contains(e.target) && !e.target.closest('[data-copy-addr]')) {
      hideWalletAddrMenu();
    }
  });
}

// ─── 퀴즈파이 메인넷지갑에 등록 (컨텍스트 메뉴 + 지갑 카드 버튼 공용) ─────

async function sendAddrToHackWallet(addr, alias) {
  const username = getUsername();
  if (!username) { showToast(t('wallet_ctx_fail')); return; }
  const finalAlias = alias || aliasFor(addr) || `★${addr.slice(0, 6)}···${addr.slice(-4)}`;

  const doSend = async () => {
    try {
      const result = await registerInHackWallet(username, addr, finalAlias);
      if (result === 'added')          showToast(t('wallet_ctx_hack_sent'));
      else if (result === 'duplicate') showToast(t('wallet_ctx_hack_dup'));
      else if (result === 'full')      showToast(t('wallet_ctx_hack_full'));
    } catch {
      showToast(t('wallet_ctx_fail'));
    }
  };

  const active = await isAccountActive(addr);
  if (active) {
    await doSend();
  } else {
    showConfirmDialog(t('wallet_not_activated_title'), t('wallet_not_activated_confirm'), doSend, t('wallet_continue'));
  }
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

function showConfirmDialog(title, body, onConfirmed, okLabel) {
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h2 style="font-size:16px;">${title}</h2>
      <button class="modal-close" id="cd-x">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;line-height:1.6;margin-bottom:14px;">${body}</p>
      <div style="display:flex;gap:8px;">
        <button class="btn-outline btn-sm" id="cd-cancel" style="flex:1;">${t('wallet_change_cancel')}</button>
        <button class="btn-primary btn-sm" id="cd-ok" style="flex:1;">${okLabel ?? t('wallet_change_save')}</button>
      </div>
    </div>
  `);
  overlay.querySelector('#cd-x').onclick      = close;
  overlay.querySelector('#cd-cancel').onclick = close;
  overlay.querySelector('#cd-ok').onclick     = () => { close(); onConfirmed(); };
}

// ─── 클라우드 백업/복구 (Google Cloud Storage, 슬롯 5개) ─────────────────────

function dedupeWalletsByAddress(list) {
  const seen = new Set();
  const out = [];
  for (const w of list) {
    if (seen.has(w.address)) continue;
    seen.add(w.address);
    out.push(w);
  }
  return out;
}

async function fetchBackupSlot(category, slot) {
  const username = getUsername();
  const res = await fetch('/api/backup/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: currentAccessToken, category, username, slot }),
  });
  if (!res.ok) throw new Error('backup get failed');
  return res.json();
}

async function putBackupSlot(category, slot, wallets) {
  const username = getUsername();
  const res = await fetch('/api/backup/put', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: currentAccessToken, category, username, slot, wallets }),
  });
  if (!res.ok) throw new Error('backup put failed');
  return res.json();
}

function openBackupModal(category, currentWallets, maxCount, onApplied) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box" style="max-width:380px;">
    <div class="modal-header">
      <h2 style="font-size:16px;">☁️ ${t('backup_title')}</h2>
      <button class="modal-close" id="bk-x">✕</button>
    </div>
    <div class="modal-body" id="bk-body" style="max-height:70vh;overflow-y:auto;">
      <p style="color:var(--text-dim);font-size:13px;">${t('wallet_loading')}</p>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#bk-x').onclick = () => overlay.remove();

  const bodyEl = overlay.querySelector('#bk-body');
  let slotsData = [];

  async function loadSlots() {
    bodyEl.innerHTML = `<p style="color:var(--text-dim);font-size:13px;">${t('wallet_loading')}</p>`;
    try {
      slotsData = await Promise.all([1, 2, 3, 4, 5].map(s => fetchBackupSlot(category, s)));
      renderSlots();
    } catch {
      bodyEl.innerHTML = `<p style="color:var(--red);font-size:13px;">${t('backup_load_fail')}</p>`;
    }
  }

  function renderSlots() {
    bodyEl.innerHTML = slotsData.map((s, i) => {
      const slotNum = i + 1;
      const empty = !s.exists;
      const dateStr = empty ? '' : new Date(s.updatedAt).toLocaleString();
      const aliasPreview = empty ? '' : s.wallets.map(w => esc(w.alias)).join(', ');
      const slotInfo = empty ? t('backup_empty') : `${s.wallets.length} · ${dateStr}`;
      return `
        <div style="border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <b style="font-size:13px;">${t('backup_slot').replace('{n}', slotNum)}</b>
            <span style="font-size:11px;color:var(--text-dim);">${slotInfo}</span>
          </div>
          ${empty ? '' : `<div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;line-height:1.5;word-break:break-all;">${aliasPreview}</div>`}
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            <button class="btn-outline btn-sm" data-act="backup-full" data-slot="${slotNum}" style="width:auto;padding:0 10px;">${t('backup_btn_full_backup')}</button>
            <button class="btn-outline btn-sm" data-act="backup-append" data-slot="${slotNum}" style="width:auto;padding:0 10px;">${t('backup_btn_append_backup')}</button>
            <button class="btn-outline btn-sm" data-act="restore-full" data-slot="${slotNum}" style="width:auto;padding:0 10px;" ${empty ? 'disabled' : ''}>${t('backup_btn_full_restore')}</button>
            <button class="btn-outline btn-sm" data-act="restore-append" data-slot="${slotNum}" style="width:auto;padding:0 10px;" ${empty ? 'disabled' : ''}>${t('backup_btn_append_restore')}</button>
          </div>
        </div>`;
    }).join('');

    bodyEl.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.dataset.act, Number(btn.dataset.slot)));
    });
  }

  async function handleAction(act, slotNum) {
    const slotInfo = slotsData[slotNum - 1];

    if (act === 'backup-full') {
      const msg = slotInfo.exists
        ? t('backup_confirm_overwrite').replace('{n}', slotNum)
        : t('backup_confirm_save').replace('{n}', slotNum);
      showConfirmDialog(t('backup_title'), msg, async () => {
        try {
          await putBackupSlot(category, slotNum, currentWallets);
          showToast(t('backup_saved'));
          loadSlots();
        } catch { showToast(t('backup_fail')); }
      }, t('backup_btn_full_backup'));
      return;
    }

    if (act === 'backup-append') {
      const existing = slotInfo.exists ? slotInfo.wallets : [];
      const merged = dedupeWalletsByAddress([...existing, ...currentWallets]);
      const doSave = async (list) => {
        try {
          await putBackupSlot(category, slotNum, list);
          showToast(t('backup_saved'));
          loadSlots();
        } catch { showToast(t('backup_fail')); }
      };
      if (merged.length > maxCount) {
        const msg = t('backup_confirm_truncate').replace('{n}', maxCount).replace('{dropped}', merged.length - maxCount);
        showConfirmDialog(t('backup_title'), msg, () => doSave(merged.slice(0, maxCount)), t('wallet_continue'));
      } else {
        await doSave(merged);
      }
      return;
    }

    if (act === 'restore-full') {
      const msg = t('backup_confirm_restore_full').replace('{n}', slotNum);
      showConfirmDialog(t('backup_title'), msg, async () => {
        try {
          await onApplied(slotInfo.wallets);
          overlay.remove();
        } catch { showToast(t('backup_fail')); }
      }, t('backup_btn_full_restore'));
      return;
    }

    if (act === 'restore-append') {
      const merged = dedupeWalletsByAddress([...currentWallets, ...slotInfo.wallets]);
      const doRestore = async (list) => {
        try {
          await onApplied(list);
          overlay.remove();
        } catch { showToast(t('backup_fail')); }
      };
      if (merged.length > maxCount) {
        const msg = t('backup_confirm_truncate').replace('{n}', maxCount).replace('{dropped}', merged.length - maxCount);
        showConfirmDialog(t('backup_title'), msg, () => doRestore(merged.slice(0, maxCount)), t('wallet_continue'));
      } else {
        await doRestore(merged);
      }
      return;
    }
  }

  loadSlots();
}

// ─── Add wallet dialog ──────────────────────────────────────────────────────

function showAddDialog(currentWallets, onSaved) {
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

  overlay.querySelector('#md-save').onclick = async () => {
    const addr    = overlay.querySelector('#md-addr').value.trim();
    const alias   = overlay.querySelector('#md-alias').value.trim() || aliasFor(addr) || `Wallet ${currentWallets.length + 1}`;
    const errEl   = overlay.querySelector('#md-err');
    const saveBtn = overlay.querySelector('#md-save');

    if (!addr.startsWith('G') || addr.length !== 56) {
      errEl.textContent = t('info_key_invalid');
      errEl.style.display = '';
      return;
    }
    if (currentWallets.some(w => w.address === addr)) {
      errEl.textContent = t('wallet_duplicate_addr');
      errEl.style.display = '';
      return;
    }
    if (currentWallets.length >= PIDEX_WALLET_MAX) {
      errEl.textContent = t('wallet_full').replace('{n}', PIDEX_WALLET_MAX);
      errEl.style.display = '';
      return;
    }

    const username = getUsername();
    if (!username) { errEl.textContent = t('wallet_cloud_fail'); errEl.style.display = ''; return; }

    const wallet = { id: genId(), address: addr };
    saveBtn.disabled = true;

    const doSave = async () => {
      try {
        await saveWalletsServer(username, [...currentWallets, wallet]);
        await setAddressAlias(username, addr, alias);
        setActiveId(wallet.id);
        close();
        onSaved();
      } catch {
        errEl.textContent = t('wallet_cloud_err');
        errEl.style.display = '';
        saveBtn.disabled = false;
      }
    };

    const active = await isAccountActive(addr);
    if (active) {
      await doSave();
    } else {
      saveBtn.disabled = false;
      showConfirmDialog(t('wallet_not_activated_title'), t('wallet_not_activated_confirm'), doSave, t('wallet_continue'));
    }
  };
}

// ─── Edit alias dialog ──────────────────────────────────────────────────────

function showEditAliasDialog(wallet, allWallets, onSaved) {
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h2 style="font-size:16px;">${t('wallet_edit_alias')}</h2>
      <button class="modal-close" id="md-x">✕</button>
    </div>
    <div class="modal-body">
      <input type="text" id="md-alias" class="form-input" value="${esc(aliasFor(wallet.address) || wallet.alias)}" style="font-size:12px;" />
      <p id="md-err" style="color:var(--red);font-size:11px;margin-top:6px;display:none;"></p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn-outline btn-sm" id="md-cancel" style="flex:1;">${t('wallet_change_cancel')}</button>
        <button class="btn-primary btn-sm" id="md-save" style="flex:1;">${t('wallet_change_save')}</button>
      </div>
    </div>
  `);

  overlay.querySelector('#md-x').onclick      = close;
  overlay.querySelector('#md-cancel').onclick = close;
  overlay.querySelector('#md-alias').select();

  overlay.querySelector('#md-save').onclick = async () => {
    const alias   = overlay.querySelector('#md-alias').value.trim();
    const errEl   = overlay.querySelector('#md-err');
    const saveBtn = overlay.querySelector('#md-save');
    if (!alias) return;

    const username = getUsername();
    if (!username) { errEl.textContent = t('wallet_cloud_fail'); errEl.style.display = ''; return; }

    saveBtn.disabled = true;
    try {
      await setAddressAlias(username, wallet.address, alias);
      close();
      onSaved();
    } catch {
      errEl.textContent = t('wallet_cloud_err');
      errEl.style.display = '';
      saveBtn.disabled = false;
    }
  };
}

// ─── Delete confirm dialog ──────────────────────────────────────────────────

function showDeleteDialog(wallet, allWallets, onConfirmed) {
  const { overlay, close } = openModal(`
    <div class="modal-header">
      <h2 style="font-size:16px;">${t('wallet_delete')}</h2>
      <button class="modal-close" id="md-x">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;margin-bottom:12px;line-height:1.5;">${t('wallet_delete_confirm')}</p>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:16px;">${esc(aliasFor(wallet.address) || wallet.alias)} · ${wallet.address.slice(0, 8)}···${wallet.address.slice(-8)}</p>
      <p id="md-err" style="color:var(--red);font-size:11px;margin-bottom:8px;display:none;"></p>
      <div style="display:flex;gap:8px;">
        <button class="btn-outline btn-sm" id="md-cancel" style="flex:1;">${t('wallet_change_cancel')}</button>
        <button class="btn-primary btn-sm" id="md-del" style="flex:1;background:var(--red);">${t('wallet_delete')}</button>
      </div>
    </div>
  `);

  overlay.querySelector('#md-x').onclick      = close;
  overlay.querySelector('#md-cancel').onclick = close;
  overlay.querySelector('#md-del').onclick    = async () => {
    const errEl  = overlay.querySelector('#md-err');
    const delBtn = overlay.querySelector('#md-del');
    const username = getUsername();
    if (!username) { errEl.textContent = t('wallet_cloud_fail'); errEl.style.display = ''; return; }

    const remaining = allWallets.filter(w => w.id !== wallet.id);
    delBtn.disabled = true;
    try {
      await saveWalletsServer(username, remaining);
      close();
      onConfirmed(remaining);
    } catch {
      errEl.textContent = t('wallet_cloud_err');
      errEl.style.display = '';
      delBtn.disabled = false;
    }
  };
}

// ─── Transaction row ────────────────────────────────────────────────────────

function txRowHtml(op, walletAlias) {
  const isIn   = op.isIncoming;
  const other  = isIn ? op.from : op.to;
  const short  = other ? esc(aliasFor(other) || `${other.slice(0, 4)}···${other.slice(-3)}`) : '?';
  const asset  = op.asset_code ?? (op.asset_type === 'native' ? 'π' : (op.asset_type ?? '?'));
  const amount = parseFloat(op.amount ?? 0).toFixed(2);
  const date   = op.created_at ? new Date(op.created_at).toLocaleDateString() : '';
  const color  = isIn ? 'var(--green)' : '#f0b429';
  const dir    = isIn ? t('wallet_tx_recv') : t('wallet_tx_sent');
  const arrow  = isIn ? '↙' : '↗';

  const myChip    = `<span style="background:rgba(255,255,255,0.10);padding:5px 9px;border-radius:4px;color:var(--accent);font-weight:600;">${walletAlias}</span>`;
  const otherChip = other
    ? `<span data-copy-addr="${other}" style="background:rgba(255,255,255,0.06);padding:5px 9px;border-radius:4px;color:#999;font-family:monospace;cursor:pointer;">${short}</span>`
    : `<span style="background:rgba(255,255,255,0.06);padding:5px 9px;border-radius:4px;color:#999;font-family:monospace;">?</span>`;
  const fromChip  = isIn ? otherChip : myChip;
  const toChip    = isIn ? myChip    : otherChip;

  return `
    <div style="border-left:3px solid ${color};padding:10px 12px;margin-bottom:8px;border-radius:0 8px 8px 0;background:rgba(255,255,255,0.03);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:600;color:${color};">${arrow} ${dir}</span>
        <span style="font-size:13px;font-weight:700;color:${color};">${amount} ${asset}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;font-size:13px;flex-wrap:wrap;">
        ${fromChip}
        <span style="color:#555;font-size:13px;">──→</span>
        ${toChip}
      </div>
      <div style="font-size:10px;color:#666;margin-top:4px;">${date}</div>
    </div>
  `;
}

// ─── Empty / error states ───────────────────────────────────────────────────

function renderEmptyState(container, wallets) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">${t('wallet_title')}</h2>
      <div class="card" style="text-align:center;padding:32px 16px;">
        <p style="color:var(--text-dim);margin-bottom:4px;">${t('wallet_no_wallets')}</p>
        <p style="font-size:11px;color:var(--text-dim);margin-bottom:20px;">${t('wallet_max_hint').replace('{n}', PIDEX_WALLET_MAX)}</p>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn-primary" id="btn-add-first" style="width:auto;padding:0 24px;">${t('wallet_add')}</button>
          <button class="btn-outline" id="btn-backup-first" style="width:auto;padding:0 20px;">☁️ ${t('backup_title')}</button>
        </div>
      </div>
    </div>
  `;
  container.querySelector('#btn-add-first').addEventListener('click', () => {
    showAddDialog(wallets, () => rerenderPage('wallet'));
  });
  container.querySelector('#btn-backup-first').addEventListener('click', () => {
    openBackupModal('testnet', wallets, PIDEX_WALLET_MAX, async (newList) => {
      await saveWalletsServer(getUsername(), newList);
      rerenderPage('wallet');
    });
  });
}

function renderLoadFailState(container, reasonKey) {
  container.innerHTML = `
    <div class="page-content">
      <h2 class="page-title">${t('wallet_title')}</h2>
      <div class="card" style="text-align:center;padding:32px 16px;">
        <p style="color:var(--red);margin-bottom:16px;">${t(reasonKey)}</p>
        <button class="btn-outline" id="btn-wallet-retry" style="width:auto;padding:0 24px;">↻ ${t('wallet_refresh')}</button>
      </div>
    </div>
  `;
  container.querySelector('#btn-wallet-retry').addEventListener('click', () => rerenderPage('wallet'));
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

    const myAlias = esc(aliasFor(wallet.address) || wallet.alias);
    const txHtml = payments.length === 0
      ? `<div class="card"><p class="empty-msg">${t('wallet_tx_none')}</p></div>`
      : `<div class="card" style="padding:12px;">
          ${payments.map(op => txRowHtml(op, myAlias)).join('')}
        </div>`;

    detailEl.innerHTML = `
      <!-- Address bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:10px;">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:2px;">${myAlias}</div>
          <div data-copy-addr="${wallet.address}" style="font-size:14px;color:#888;font-family:monospace;cursor:pointer;padding:5px 3px;display:inline-block;">${wallet.address.slice(0, 5)}···${wallet.address.slice(-4)}</div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn-outline btn-sm" id="btn-edit-alias" style="padding:0 8px;font-size:12px;">✏️</button>
          <button class="btn-outline btn-sm" id="btn-send-hack" style="padding:0 8px;font-size:12px;" title="${t('wallet_send_to_hack')}">💼→</button>
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

      <!-- Transactions -->
      <div class="dash-section-title">${t('wallet_txs')}</div>
      ${txHtml}

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

      <p class="dash-updated">${t('wallet_updated')}: ${new Date().toLocaleTimeString()}</p>
    `;

    detailEl.querySelector('#btn-edit-alias')?.addEventListener('click', () => {
      showEditAliasDialog(wallet, allWallets, () => rerenderPage('wallet'));
    });

    detailEl.querySelector('#btn-send-hack')?.addEventListener('click', () => {
      sendAddrToHackWallet(wallet.address, `★${aliasFor(wallet.address) || wallet.alias}`);
    });

    detailEl.querySelector('#btn-del-wallet')?.addEventListener('click', () => {
      showDeleteDialog(wallet, allWallets, (remaining) => {
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
  container.innerHTML = `<div class="page-content"><p style="color:var(--text-dim);padding:16px 0;">${t('wallet_loading')}</p></div>`;

  const username = getUsername();
  if (!username) {
    renderLoadFailState(container, 'wallet_cloud_fail');
    return;
  }

  let wallets;
  try {
    wallets = await fetchWalletsServer(username);
  } catch {
    renderLoadFailState(container, 'wallet_load_fail');
    return;
  }

  // 최초 1회: Pi SDK 지갑 자동 등록 (서버에 아무것도 없을 때만)
  if (!wallets.length && currentUser?.wallet_address) {
    const autoWallet = { id: genId(), address: currentUser.wallet_address };
    try {
      await saveWalletsServer(username, [autoWallet]);
      await setAddressAlias(username, autoWallet.address, 'Pi Wallet');
      wallets = [autoWallet];
    } catch { /* 실패해도 빈 상태로 계속 진행 */ }
  }

  if (!wallets.length) {
    renderEmptyState(container, wallets);
    return;
  }

  const active = wallets.find(w => w.id === getActiveId()) ?? wallets[0];
  setActiveId(active.id);

  const selectorHtml = `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
      ${wallets.map(w => `
        <button class="wallet-chip${w.id === active.id ? ' active' : ''}"
          data-wid="${w.id}" data-active-check="${w.address}"
          style="padding:4px 12px;border-radius:20px;font-size:12px;border:1px solid ${w.id === active.id ? 'var(--accent)' : 'var(--border)'};background:${w.id === active.id ? 'var(--accent)' : 'transparent'};color:${w.id === active.id ? '#000' : 'var(--text)'};cursor:pointer;white-space:nowrap;">
          ${esc(aliasFor(w.address) || w.alias)}
        </button>`).join('')}
      ${wallets.length < PIDEX_WALLET_MAX ? `<button id="btn-add-wallet"
        style="padding:4px 12px;border-radius:20px;font-size:12px;border:1px dashed var(--border);background:transparent;color:var(--text-dim);cursor:pointer;">
        + ${t('wallet_add')}
      </button>` : ''}
    </div>
  `;

  container.innerHTML = `
    <div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <h2 class="page-title" style="margin:0;">${t('wallet_title')} <span style="font-size:11px;color:var(--text-dim);font-weight:400;">(${wallets.length}/${PIDEX_WALLET_MAX})</span></h2>
        <div style="display:flex;gap:4px;">
          <button class="btn-outline btn-sm" id="btn-wallet-backup" style="width:auto;padding:0 12px;">☁️</button>
          <button class="btn-outline btn-sm" id="btn-wallet-refresh" style="width:auto;padding:0 12px;">↻ ${t('wallet_refresh')}</button>
        </div>
      </div>
      ${selectorHtml}
      <div id="wallet-detail" style="margin-top:16px;"></div>
    </div>
  `;

  setupPullToRefresh(container, () => rerenderPage('wallet'));

  container.querySelector('#btn-wallet-refresh').addEventListener('click', () => rerenderPage('wallet'));

  container.querySelector('#btn-wallet-backup').addEventListener('click', () => {
    openBackupModal('testnet', wallets, PIDEX_WALLET_MAX, async (newList) => {
      await saveWalletsServer(username, newList);
      rerenderPage('wallet');
    });
  });

  container.querySelector('#btn-add-wallet')?.addEventListener('click', () => {
    showAddDialog(wallets, () => rerenderPage('wallet'));
  });

  container.querySelectorAll('[data-wid]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveId(btn.dataset.wid);
      rerenderPage('wallet');
    });
  });

  // 비활성 지갑 칩에 아이콘 표시 (병렬 조회 후 비동기로 반영)
  container.querySelectorAll('[data-active-check]').forEach(async (el) => {
    const addr = el.dataset.activeCheck;
    const active = await isAccountActive(addr);
    if (!active && container.isConnected) {
      el.insertAdjacentHTML('afterbegin', `<span title="${t('wallet_not_activated_icon_title')}">⚠️ </span>`);
    }
  });

  initWalletAddrMenu();

  container.addEventListener('click', (e) => {
    if (walletMenuDismissing) { walletMenuDismissing = false; return; }
    const el = e.target.closest('[data-copy-addr]');
    if (!el) return;
    const addr = el.dataset.copyAddr;
    if (!addr) return;
    e.stopPropagation();
    showWalletAddrMenu(addr, el);
  });

  await loadWalletDetail(container.querySelector('#wallet-detail'), active, wallets);
}
