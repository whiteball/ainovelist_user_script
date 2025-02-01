// ==UserScript==
// @name         AIのべりすと 複数行コメントを折りたたむ
// @namespace    https://ai-novelist-share.geo.jp/
// @version      0.1.0
// @description  複数行コメントを折りたたみます。コメント領域の中に3つ以上の改行がある場合に、そのコメントを非表示にして代わりにコメントを展開するボタンを配置します。
// @author       しらたま
// @match        https://ai-novel.com/novel.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts/ai_novelist_collapse_comment.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts/ai_novelist_collapse_comment.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    document.head.insertAdjacentHTML('beforeend', `<style>
span.mod_collapse_comments {
    color: #000000;
    background-color: #aaaaaa;
    border-radius: 100vh;
    border-color: #333333;
    display: block;
    text-align:center;
    width: 100%;
    max-width: max(40rem, 50vw);
}
span.mod_collapse_comments:hover {
    color: #ffffff;
    background: #333333;
}
span.mod_collapse_comments::before {
    content: '※閉じる';
}
span.mod_collapse_comments:has(+ font[style*="display"])::before {
    content: attr(data-text);
}
span.mod_collapse_comments:has(+ font[style*="display"]) {
    display: inline-block;
}
</style>`)

    window.modClickEventHandler = function (event) {
        const next = event.target.nextElementSibling;
        if (next instanceof HTMLElement) {
            if (next.style.display === '') {
                next.style.display = 'none';
            } else {
                next.style.display = '';
            }
        }
    }
    let handle = 0;
    const install = () => {
        if (document.getElementById('mainbody')?.style.opacity === 0) {
            return;
        }
        clearInterval(handle);
        handle = 0;

        const originalTextSharding = window.TextSharding;
        window.TextSharding = function (orig_text = null, nospan = true, noscroll = false, tagreplace = 0) {
            originalTextSharding(orig_text, nospan, noscroll, tagreplace)

            for (const comment of document.querySelectorAll('#data_edit font[color="#aaaaaa"]')) {
                let count = 0;
                let text_list = [];
                for (const child of comment.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent) {
                        text_list.push(child.textContent)
                    } else if (child instanceof HTMLElement && child.tagName === 'BR') {
                        count++;
                    }
                }
                if (count >= 3) {
                    if (comment instanceof HTMLElement) {
                        const span = document.createElement('span');
                        span.setAttribute('data-text', '※展開:' + text_list.join(' ').replaceAll(/<[^>]+>/gi, '').substring(0, 32).replace(/[@＠][\/／][\*＊]/gi, '') + '(' + count +'行略)')
                        span.className = 'mod_collapse_comments'
                        span.contentEditable = false;
                        // 属性テキストとしてイベントを設定しないと、data_editへのinnerHTML更新でイベントが消える
                        span.setAttribute('onclick', 'modClickEventHandler(event)');
                        //span.addEventListener('click', modClickEventHandler);
                        comment.style.display = 'none';
                        comment.parentElement.insertBefore(span, comment);
                    }
                }

            }
        }
        if (document.getElementById("data_edit")?.innerHTML !== '') {
            window.TextSharding()
        }
    }

    // AIのべりすとユーティリティによるTextSharding上書きより後に実行したい
    handle = setInterval(install, 200)
})();
