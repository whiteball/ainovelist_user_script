// ==UserScript==
// @name         AIのべりすと v4向け サイドメニュー幅調整
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-09-06
// @description  AIのべりすとの編集ページのサイドメニューの左上に、サイドメニューの幅を調整するボタンを追加します。ゆっくりシングルクリックすると1px、ダブルクリックするとシングルクリック分と合わせて10px移動します。
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_adjust_side_menu.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_adjust_side_menu.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.head) {
        const style = document.createElement('style');
        style.textContent = `
#mod-wb-sidebar-size {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 5px;
}
        `;
        document.head.appendChild(style)
    }
    let width = Number(localStorage.getItem('mod-v4-wb-sidebar-width') ?? 580);

    const orig = window.DetermineSidebarWidth;
    window.DetermineSidebarWidth = function (viewport) {
        try {
            var vp = (typeof viewport === 'number' && !isNaN(viewport)) ? viewport : Math.floor(window.innerWidth || 0);
            if (vp <= 0) return width;
            var baseWidth = width;
            if (vp <= SIDEMENU_BREAKPOINT) {
                return Math.max(vp, 0);
            }
            if (vp <= baseWidth * 2) {
                return Math.floor(vp / 2);
            }
            return baseWidth;
        } catch(e) {
            return width;
        }
    }

    const options_header = document.getElementsByClassName('options_header')?.[0].insertAdjacentHTML('afterbegin', `
<div id="mod-wb-sidebar-size">
<button id="mod-wb-sidebar-size-inc">◀</button><button id="mod-wb-sidebar-size-dec">▶</button>
</div>
    `);
    const incButton = document.getElementById('mod-wb-sidebar-size-inc');
    if (incButton) {
        incButton.addEventListener('click', function () {
            width += 1;
            localStorage.setItem('mod-v4-wb-sidebar-width', width);
            window.HandleWindowResize();
        });
        incButton.addEventListener('dblclick', function () {
            width += 8;
            localStorage.setItem('mod-v4-wb-sidebar-width', width);
            window.HandleWindowResize();
        });
    }
    const decButton = document.getElementById('mod-wb-sidebar-size-dec');
    if (decButton) {
        decButton.addEventListener('click', function () {
            width -= 1;
            localStorage.setItem('mod-v4-wb-sidebar-width', width);
            window.HandleWindowResize();
        });
        decButton.addEventListener('dblclick', function () {
            width -= 8;
            localStorage.setItem('mod-v4-wb-sidebar-width', width);
            window.HandleWindowResize();
        });
    }
})();
