// ==UserScript==
// @name         AIのべりすと v4向け AI応答時間表示
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-09-06
// @description  チャット欄の左上辺りに、最後に「続ける/Retry/プチボット実行」したときに応答が返ってくるまでかかった時間を表示します。エラーが起きたときでも、エラーが返ってくるまでの時間を表示します。
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_response_time.user.js.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_response_time.user.js.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let start = 0;
    const orig_hidepost_v4 = window.hidepost_v4,
          orig_showpost_v4 = window.showpost_v4;
    window.hidepost_v4 = function () {
        start = performance.now();
        orig_hidepost_v4();
    }
    window.showpost_v4 = function () {
        orig_showpost_v4();
        const end = performance.now();
        const div = document.getElementById('mod-wb-show-ai-time')
        if (div) {
            div.textContent = '応答' + (end - start) + 'ms'
        }
    }

    if (document.head) {
        const style = document.createElement('style');
        style.textContent = `
#gui_writingmode_instruct {
    position: relative;
    #mod-wb-show-ai-time {
        position: absolute;
        left: 10px;
        top: 0;
        color: contrast-color(var(--background-color));
    }
}
        `;
        document.head.appendChild(style)
    }
    const gui_writingmode_instruct = document.getElementById('gui_writingmode_instruct');
    gui_writingmode_instruct.insertAdjacentHTML('afterbegin', `
<div id="mod-wb-show-ai-time">

</div>`);
})();
