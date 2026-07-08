import { renderLPHelper } from './page-lp-helper.js';
import { renderSwap }     from './page-swap.js';
import { t }              from './i18n.js';

export function renderTools(container) {
  container.innerHTML = `
    <div class="tools-wrapper">
      <div class="tools-inner-tabs">
        <button class="tools-inner-tab active" data-tool="lp">💧 ${t('nav_lp') || 'LP 계산'}</button>
        <button class="tools-inner-tab" data-tool="swap">⇄ ${t('nav_swap') || '스왑'}</button>
      </div>
      <div id="tools-content"></div>
    </div>
  `;

  const contentEl = container.querySelector('#tools-content');
  let current = 'lp';

  function showTool(tool) {
    current = tool;
    container.querySelectorAll('.tools-inner-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    contentEl.innerHTML = '';
    if (tool === 'lp')   renderLPHelper(contentEl);
    else                 renderSwap(contentEl);
  }

  container.querySelectorAll('.tools-inner-tab').forEach(btn => {
    btn.addEventListener('click', () => showTool(btn.dataset.tool));
  });

  showTool('lp');
}
