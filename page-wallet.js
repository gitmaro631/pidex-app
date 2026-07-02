import { fetchAccount, fetchPoolById } from './horizon.js';
import { formatPi, formatToken, formatLargeNum } from './util-format.js';
import { showLoading, hideLoading, rerenderPage } from './app.js';
import { t } from './i18n.js';

const STORAGE_KEY = 'stellar_pub_key';

function renderChangeAddressDialog(container, onSaved) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:360px;">
      <div class="modal-header">
        <h2 style="font-size:16px;">${t('wallet_change_title')}</h2>
        <button class="modal-close" id="btn-addr-cancel">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:rgba(255,160,0,0.12);border:1px solid rgba(255,160,0,0.4);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;line-height:1.6;color:#f0b429;">
          ${t('wallet_change_warn').replace(/\n/g, '<br>')}
        </div>
        <div class="key-input-row" style="display:flex;gap:8px;">
          <input type="text" class="form-input" id="addr-input"
            placeholder="${t('wallet_change_ph')}" style="font-size:12px;flex:1;" />
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn-outline btn-sm" id="btn-addr-cancel2" style="flex:1;">${t('wallet_change_cancel')}</button>
          <button class="btn-primary btn-sm" id="btn-addr-save" style="flex:1;">${t('wallet_change_save')}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#btn-addr-cancel').addEventListener('click', close);
  overlay.querySelector('#btn-addr-cancel2').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelector('#btn-addr-save').addEventListener('click', () => {
    const val = overlay.querySelector('#addr-input').value.trim();
    if (!val.startsWith('G') || val.length !== 56) {
      overlay.querySelector('#addr-input').style.borderColor = 'var(--red)';
      return;
    }
    localStorage.setItem(STORAGE_KEY, val);
    close();
    onSaved();
  });
}

export async function renderWallet(container) {
  const pubKey = localStorage.getItem(STORAGE_KEY);

  container.innerHTML = `
    <div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <h2 class="page-title" style="margin-bottom:0;">${t('wallet_title')}</h2>
        <div style="display:flex;gap:6px;">
          <button class="btn-outline btn-sm" id="btn-wallet-change" style="width:auto;padding:0 10px;font-size:11px;">🔑 ${t('wallet_change_btn')}</button>
          <button class="btn-outline btn-sm" id="btn-wallet-refresh" style="width:auto;padding:0 12px;">↻ ${t('wallet_refresh')}</button>
        </div>
      </div>
      <div class="wallet-loading">${t('wallet_loading')}</div>
    </div>
  `;
  container.querySelector('#btn-wallet-refresh').addEventListener('click', () => rerenderPage('wallet'));
  container.querySelector('#btn-wallet-change').addEventListener('click', () => {
    renderChangeAddressDialog(container, () => {
      rerenderPage('wallet');
    });
  });

  if (!pubKey) {
    container.querySelector('.wallet-loading').textContent = t('wallet_no_key');
    return;
  }

  try {
    showLoading(t('wallet_loading2'));
    const account = await fetchAccount(pubKey);

    const lpDetails = await Promise.allSettled(
      account.lpShares.map(s => fetchPoolById(s.liquidity_pool_id))
    );

    hideLoading();

    const subentries   = account.raw.subentry_count ?? 0;
    const baseReserve  = 0.5;
    const minReserve   = (2 + subentries) * baseReserve;
    const availablePi  = Math.max(0, account.pi - minReserve);

    const tokensWithBalance = account.tokens.filter(t => parseFloat(t.balance) > 0);
    const tokensNoBalance   = account.tokens.filter(t => parseFloat(t.balance) === 0);

    container.querySelector('.page-content').innerHTML = `
      <h2 class="page-title">${t('wallet_title')}</h2>
      <p class="wallet-addr">${pubKey.slice(0,8)}...${pubKey.slice(-8)}</p>

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
          <span>${t('wallet_reserve')}
            <span class="hint-inline">(${t('wallet_reserve_note')})</span>
          </span>
          <span class="val-red">~${formatPi(minReserve)}</span>
        </div>
      </div>

      ${tokensWithBalance.length > 0 ? `
        <div class="dash-section-title">${t('wallet_tokens')}</div>
        <div class="card">
          ${tokensWithBalance.map(t => `
            <div class="wallet-pi-row">
              <span class="token-name">${t.asset_code ?? t.asset_type}
                <span class="token-issuer">${(t.asset_issuer ?? '').slice(0,6)}...</span>
              </span>
              <span>${formatToken(t.balance, t.asset_code)}</span>
            </div>`).join('')}
        </div>` : ''}

      <div class="dash-section-title">${t('wallet_lp')}</div>
      ${account.lpShares.length === 0
        ? `<div class="card"><p class="empty-msg">${t('wallet_no_lp')}</p></div>`
        : `<div class="card">
            ${account.lpShares.map((s, i) => {
              const poolResult = lpDetails[i];
              const pool = poolResult.status === 'fulfilled' ? poolResult.value : null;
              const pairName = pool ? `${pool.assetA} / ${pool.assetB}` : s.liquidity_pool_id.slice(0, 12) + '...';
              const shareRatio = pool && pool.totalShares > 0
                ? ((parseFloat(s.balance) / pool.totalShares) * 100).toFixed(4)
                : null;
              return `
                <div class="wallet-pi-row lp-row">
                  <div>
                    <div class="token-name">${pairName}</div>
                    ${shareRatio ? `<div class="lp-share-pct">${t('wallet_share')}: ${shareRatio}%</div>` : ''}
                  </div>
                  <span>${parseFloat(s.balance).toFixed(6)} ${t('wallet_stake')}</span>
                </div>`;
            }).join('')}
          </div>`
      }

      ${account.tokens.length > 0 ? `
        <div class="dash-section-title">${t('wallet_trustlines')}</div>
        <div class="card">
          ${account.tokens.map(tok => `
            <div class="wallet-pi-row">
              <span class="token-name">${tok.asset_code ?? tok.asset_type}
                <span class="token-issuer">${(tok.asset_issuer ?? '').slice(0,6)}...</span>
              </span>
              <span class="${parseFloat(tok.balance) > 0 ? '' : 'val-dim'}">${parseFloat(tok.balance) > 0 ? formatToken(tok.balance, tok.asset_code) : t('wallet_no_balance')}</span>
            </div>`).join('')}
          ${tokensNoBalance.length > 0
            ? `<p class="hint-text">${t('wallet_zero_tl')} ${tokensNoBalance.length}</p>`
            : ''}
        </div>` : ''}

      <p class="dash-updated">${t('wallet_updated')}: ${new Date().toLocaleTimeString()}</p>
    `;
  } catch (e) {
    hideLoading();
    container.querySelector('.page-content').innerHTML = `
      <h2 class="page-title">${t('wallet_title')}</h2>
      <div class="card">
        <p class="empty-msg" style="color:var(--red)">${t('wallet_fail')}: ${e.message}</p>
        <p class="form-hint">${t('wallet_check_key')}</p>
      </div>
    `;
  }
}
