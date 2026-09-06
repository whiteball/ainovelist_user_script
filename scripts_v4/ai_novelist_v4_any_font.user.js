// ==UserScript==
// @name         AIのべりすと v4向け 任意フォント指定
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-09-06
// @description  AIのべりすとの本文のフォント指定の所に、任意のフォント名を指定できるボタンとテキストボックスを追加します。
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_any_font.user.js.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_any_font.user.js.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.head) {
        const style = document.createElement('style');
        style.textContent = `
#mod-v4-wb-font-select-dummy {
    display: none !important;
}
        `;
        document.head.appendChild(style)
    }

    const fonts_cat_ja = document.getElementById('fonts_cat_ja')
    if (fonts_cat_ja) {
        fonts_cat_ja.insertAdjacentHTML('beforebegin', `
<p class="fontselector ui-text-center ui-inline-block ui-cursor-pointer ui-flex-center ui-fontset-selected"
    id="prefs_fonts_cat_selector_any" onclick="ToggleFontLangs('any');" style="background-color: rgb(205, 43, 90); border-color: rgb(255, 255, 255); color: rgb(205, 43, 90);"
    aria-pressed="false">任意</p>
<div id="fonts_cat_any" style="display: none;">
<p id="mod-v4-wb-font-select" class="fontselector sidemenu ui-font-option ui-text-center ui-inline-block ui-cursor-pointer ui-flex-center"
style="font-family: Initial; background-color: rgb(45, 80, 158); color: white;font-size: 80%">
下にフォント名を入力</p>
<p id="mod-v4-wb-font-select-dummy" class="fontselector sidemenu ui-font-option ui-text-center ui-inline-block ui-cursor-pointer ui-flex-center">
下にフォント名を入力</p>
<p class="fontselector" style="border-width: 0;color: none;background-color: initial;border-color: initial;cursor: initial;width: 90%;">
<input type="text" id="mod-v4-wb-font-name" style="top:3px;height: 26px;width:90%" placeholder="任意フォント指定"></p>
</div>`)
        const mod_font_name = document.getElementById('mod-v4-wb-font-name'),
              mod_font_select = document.getElementById('mod-v4-wb-font-select'),
              mod_font_select_dummy = document.getElementById('mod-v4-wb-font-select-dummy')
        if (mod_font_name && mod_font_select && mod_font_select_dummy) {
            mod_font_name.addEventListener('keyup', function () {
                mod_font_select.style['font-family'] = this.value;
                mod_font_select_dummy.setAttribute('data-ui-font', this.value);
                mod_font_select.innerText = this.value ? this.value : '下にフォント名を入力';
            })
            mod_font_select.addEventListener('click', function () {
                localStorage.setItem('mod-v4-wb-original-font', mod_font_select_dummy.getAttribute('data-ui-font'));
                window.FontFamily(this);
            })
            if (window.NV4_FONT_CATS) {
                window.NV4_FONT_CATS.push('any');
            }
            const fontName = localStorage.getItem('mod-v4-wb-original-font');
            if (fontName) {
                mod_font_select.style['font-family'] = fontName;
                mod_font_select_dummy.setAttribute('data-ui-font', fontName);
                mod_font_select.innerText = fontName;
                mod_font_name.value = fontName;
                //window.FontFamily(mod_font_select);
            }
        }
    }
})();
