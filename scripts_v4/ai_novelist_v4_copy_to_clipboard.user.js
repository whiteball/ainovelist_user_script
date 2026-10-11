// ==UserScript==
// @name         AIのべりすと v4向け 本文をクリップボードにコピー
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-10-11
// @description  AIのべりすと編集ページにある環境設定(デスクスタンドのアイコン)の「インポート」の下に、「本文をクリップボードにコピー」ボタンを追加します。
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_copy_to_clipboard.user.js.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_copy_to_clipboard.user.js.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const file_save = document.getElementById('file_save')
    if (!file_save) {
        return
    }

    file_save.insertAdjacentHTML('afterend', `<hr noshade=""><br>
<input type="button" id="mod_copy_clipboard" value="本文をクリップボードにコピー" class="btn-square" style="color: #358e47; font-size: 16px; background-color:white; border-color: #358e47; width:100%; margin-right:1%; font-family: Quicksand;margin-bottom:0.5rem;">
<div style="display:none" id="mod_copy_clipboard_dummy"></div>
<div style="text-align: left;margin-left: 10px;">
<label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);" id="mod_copy_clipboard_exclude_comment"><span class="explanations">　コメント(@_や@endpointなど)を除去</span></label><br style="display: initial;">
<label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);" id="mod_copy_clipboard_exclude_assistant"><span class="explanations">　指示ブロックと&lt;think&gt;ブロックを除去</span></label>
<div>` )
    /** @type {HTMLButtonElement|null} */
    const mod_copy_clipboard = document.getElementById('mod_copy_clipboard')
    /** @type {HTMLDivElement|null} */
    const mod_copy_clipboard_dummy = document.getElementById('mod_copy_clipboard_dummy')
    /** @type {HTMLInputElement|null} */
    const mod_copy_clipboard_exclude_comment = document.getElementById('mod_copy_clipboard_exclude_comment')
    /** @type {HTMLInputElement|null} */
    const mod_copy_clipboard_exclude_assistant = document.getElementById('mod_copy_clipboard_exclude_assistant')
    if (!mod_copy_clipboard || !mod_copy_clipboard_dummy || !mod_copy_clipboard_exclude_comment || !mod_copy_clipboard_exclude_assistant) {
        return
    }

    mod_copy_clipboard.addEventListener('click', function () {
        const exclude_assistant = mod_copy_clipboard_exclude_assistant.checked;
        /** @type {string} */
        let text = JSON.parse(localStorage.ainovel_data_container_v4).data_container.reduce(
            (acc, data) => {
                const b = data.text_body;
                let text = '';
                if (b?.plaintext) {
                    text = b.plaintext;
                } else if (b?.User && !exclude_assistant) {
                    text = '[#ユーザー]\n' + b.User;
                } else if (b?.Assistant) {
                    text = (exclude_assistant ? '' : '[#アシスタント]\n') + b.Assistant;
                }
                return acc + '\n'+ text;
            },
            ''
        )
        let mime = 'text/plain';
        text = text.replace(/(alt\s*=\s*"([^"]*)"\s*>)/gi, '$1$2')
            .replace(/&lt;(\/?think)&gt;/gi, '\x01_$1_\x01')
            .replace(/(<br[^>]*?><\/div>)/gi, '\n')
            .replace(/(<br[^>]*?>)/gi, '\n')
            .replace(/(<\/div>)/gi, '\n')
            .replace(/(&nbsp;)/gi, ' ')
            .replace(/(&amp;)/gi, '&')
            .replace(/(&lt;)/gi, '<')
            .replace(/(&gt;)/gi, '>')
            .replace(/<("[^"]*"|'[^']*'|[^'">])*>/gi, '')
            .replace(/\x01_(\/?think)_\x01/gi, '<$1>')
        if (mod_copy_clipboard_exclude_comment.checked) {
            // コメント除去
            text = text.replace(/^(\w|\W)*[@＠](startpoint|break)(\n|$)/gi, '')
                .replace(/[@＠]endpoint(?:\n|$)(?:\w|\W)*$/gi, '')
                .replace(/[@＠][\/／][\*＊]\n(?![^@＠]*[@＠][\/／][\*＊]\n)(?:\w|\W)*?[@＠][\*＊][\/／](?:\n?)/gi, '')
                .replace(/^[@＠][_＿][^\n]*(?:\n|$)/gmi, '')
                .replace(/[@＠]([_＿]|break|startpoint|endpoint|\/\*|\*\/)/gi, '')
        }
        if (!exclude_assistant) {
            // 空っぽのユーザー/アシスタントは除去
            text = text.replace(/\[[#＃♯][^\]]+\]\s*(?=\[[#＃♯][^\]]+\])/gi, '')
        }

        if (window.ClipboardItem && navigator.clipboard.write) {
            const blob_text = new Blob([text], { type: mime }),
                item = [new window.ClipboardItem({ [mime]: blob_text })]

            navigator.clipboard.write(item).then(() => {
                this.setAttribute('value', '本文をクリップボードにコピーしました！')
                setTimeout(() => { this.setAttribute('value', '本文をクリップボードにコピー') }, 10000)
            })
        } else {
            const selection = document.getSelection()
            const range = selection.getRangeAt(0)
            selection.removeAllRanges()
            mod_copy_clipboard_dummy.style.display = ''
            mod_copy_clipboard_dummy.innerText = text
            selection.selectAllChildren(mod_copy_clipboard_dummy)
            document.execCommand("Copy");
            mod_copy_clipboard_dummy.style.display = 'none'
            this.setAttribute('value', '本文をクリップボードにコピーしました！')
            selection.removeAllRanges()
            selection.addRange(range)
            setTimeout(() => { this.setAttribute('value', '本文をクリップボードにコピー') }, 10000)
        }
    })
})();
