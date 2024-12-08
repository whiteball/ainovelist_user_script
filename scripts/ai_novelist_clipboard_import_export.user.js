// ==UserScript==
// @name         AIのべりすと 本文をクリップボードにコピー／クリップボードで本文を上書き
// @namespace    https://ai-novelist-share.geo.jp/
// @version      0.2.0
// @description  AIのべりすと編集ページにある環境設定(デスクスタンドのアイコン)の「インポート／エクスポート」の下に、「本文をクリップボードにコピー」ボタンと「クリップボードで本文を完全に上書き」ボタンを追加します。
// @author       しらたま
// @match        https://ai-novel.com/novel.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://gist.github.com/whiteball/6ffbc2836cd42bd911aaae5eab127454/raw/ai_novelist_clipboard_import_export.user.js
// @downloadURL  https://gist.github.com/whiteball/6ffbc2836cd42bd911aaae5eab127454/raw/ai_novelist_clipboard_import_export.user.js
// @supportURL   https://gist.github.com/whiteball/6ffbc2836cd42bd911aaae5eab127454
// @grant        none
// ==/UserScript==

/*
更新履歴
2024/12/09 0.2.0 色分けを維持したままコピーできる設定を追加。
                 「クリップボードで本文を完全に上書き」でクリップボードにhtmlしかなくてもペーストできるようにした。
                 Firefoxでもクリップボードの取得ができるようになったので、記述を修正。
2023/03/29 0.1.1 コメントを除外するとき、1つ目のコメント以外が消えていなかったのを修正。
*/
(function() {
    'use strict';

    const file_save = document.getElementById('file_save')
    if (!file_save) {
        return
    }

    file_save.insertAdjacentHTML('afterend', `<hr noshade=""><br>
<input type="button" id="mod_copy_clipboard" value="本文をクリップボードにコピー" class="btn-square" style="color: #358e47; font-size: 16px; background-color:white; border-color: #358e47; width:100%; margin-right:1%; font-family: Quicksand;margin-bottom:0.5rem;">
<div style="display:none" id="mod_copy_clipboard_dummy"></div><br>
<label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);" id="mod_copy_clipboard_exclude_comment"><span class="explanations">　コメント(@_や@endpointなど)を除去</span></label><br>
<label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);" id="mod_copy_clipboard_keep_color"><span class="explanations">　色を維持(htmlとしてコピー)</span></label>` +
(navigator.clipboard.readText ? `<hr noshade=""><br>
<input type="button" id="mod_copy_clipboard_paste" value="クリップボードで本文を完全に上書き" class="btn-square" style="color: #d81a1a; font-size: 16px; background-color:white; border-color: #d81a1a; width:100%; margin-right:1%; font-family: Quicksand;margin-bottom:0.5rem;">` : ``))
    /** @type {HTMLButtonElement|null} */
    const mod_copy_clipboard = document.getElementById('mod_copy_clipboard')
    /** @type {HTMLDivElement|null} */
    const mod_copy_clipboard_dummy = document.getElementById('mod_copy_clipboard_dummy')
    /** @type {HTMLInputElement|null} */
    const mod_copy_clipboard_exclude_comment = document.getElementById('mod_copy_clipboard_exclude_comment')
    /** @type {HTMLInputElement|null} */
    const mod_copy_clipboard_keep_color = document.getElementById('mod_copy_clipboard_keep_color')
    /** @type {HTMLButtonElement|null} */
    const mod_copy_clipboard_paste = document.getElementById('mod_copy_clipboard_paste')
    if (!mod_copy_clipboard || !mod_copy_clipboard_dummy || !mod_copy_clipboard_exclude_comment || !mod_copy_clipboard_keep_color) {
        return
    }

    mod_copy_clipboard.addEventListener('click', function () {
        /** @type {string} */
        let text = localStorage.textdata
        let mime = 'text/plain'
        if (mod_copy_clipboard_keep_color.checked) {
            mime = 'text/html'
            text = text.replace(/(<br[^>]*?><\/div>)/gi, '<\/div>')

            const vis_fontcolor_ai = document.getElementById("vis_fontcolor_ai")
            if (vis_fontcolor_ai && vis_fontcolor_ai.value !== 'auto') {
                text = text.replaceAll('class="textcolor_ai"', 'class="textcolor_ai" style="color: ' + vis_fontcolor_ai.value + '"')
            } else {
                colsh = window.Colorscheme_Load( document.getElementById("vis_bgcolor").value )
                if( !colsh ){
                    colsh.fcolor_ai = '#2d509e'
                }
                text = text.replaceAll('class="textcolor_ai"', 'class="textcolor_ai" style="color: ' + colsh.fcolor_ai + '"')
            }

            if (mod_copy_clipboard_exclude_comment.checked) {
                // コメント除去
                text = text.replace(/^(\w|\W)*[@＠](startpoint|break)(<br[^>]*?>|(?=<\/div>)|<font[^>]*?>|$)/gi, '')
                    .replace(/[@＠]endpoint(?:<br[^>]*?>|<\/div>|<font[^>]*?>)(?:\w|\W)*$/gi, '')
                    .replace(/(<font color="#aaaaaa">)?[@＠][\/／][\*＊](<br[^>]*?>|<\/div>|<font[^>]*?>)(?![^@＠]*[@＠][\/／][\*＊](?:<br[^>]*?>|<\/div>|<font[^>]*?>))(?:\w|\W)*?[@＠][\*＊][\/／](?:(<br[^>]*?>|(?=<\/div>)|<\/?font[^>]*?>)?)/gi, '')
                    .replace(/(<font color="#aaaaaa">)?(?<=>)[@＠][_＿](?!.*<font[^>]*?>).*?(?:<br[^>]*?>|(?=<\/div>)|$)/gi, '')
                    .replace(/(<font color="#aaaaaa">)?(?<=>)[@＠][_＿].*?<font[^>]*?>.*?(?:<br[^>]*?>|(?=<\/div>)|$)/gi, '')
                    .replace(/[@＠]([_＿]|break|startpoint|endpoint|\/\*|\*\/)/gi, '')
            }
        } else {
            text = text.replace(/(<br[^>]*?><\/div>)/gi, '\n')
                .replace(/(<br[^>]*?>)/gi, '\n')
                .replace(/(<\/div>)/gi, '\n')
                .replace(/(&nbsp;)/gi, ' ')
                .replace(/(&amp;)/gi, '&')
                .replace(/(&lt;)/gi, '<')
                .replace(/(&gt;)/gi, '>')
                .replace(/<("[^"]*"|'[^']*'|[^'">])*>/gi, '')
            if (mod_copy_clipboard_exclude_comment.checked) {
                // コメント除去
                text = text.replace(/^(\w|\W)*[@＠](startpoint|break)(\n|$)/gi, '')
                    .replace(/[@＠]endpoint(?:\n|$)(?:\w|\W)*$/gi, '')
                    .replace(/[@＠][\/／][\*＊]\n(?![^@＠]*[@＠][\/／][\*＊]\n)(?:\w|\W)*?[@＠][\*＊][\/／](?:\n?)/gi, '')
                    .replace(/^[@＠][_＿][^\n]*(?:\n|$)/gi, '')
                    .replace(/[@＠]([_＿]|break|startpoint|endpoint|\/\*|\*\/)/gi, '')
            }
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

    if (!mod_copy_clipboard_paste) {
        return
    }
    mod_copy_clipboard_paste.addEventListener('click', async function () {
        if (!window.confirm('本文をクリップボードの内容で完全に置き換えます。\nこの操作は元に戻せません。\n本当によろしいですか？')) {
            return
        }
        document.querySelector('.data_edit').dispatchEvent(new Event('click'))
        let text = ''
        try {
            // const permission = await navigator.permissions.query({
            //     name: "clipboard-read",
            // })
            // if (permission.state === "denied") {
            //     throw new Error("クリップボードへのアクセス権が取得できませんでした。")
            // }

            const content = await navigator.clipboard.read()
            for (const item of content) {
                if (item.types.includes("text/html")) {
                    const blob = await item.getType("text/html");
                    text = await blob.text()
                    text = text.replace(/class="textcolor_ai" style="[^"]*"/gi, 'class="textcolor_ai"')
                        .replace(/[\r\n]/gi, '')
                        .replaceAll('<!--StartFragment-->', '')
                        .replaceAll('<!--EndFragment-->', '')
                } else if (item.types.includes("text/plain")) {
                    const blob = await item.getType("text/plain");
                    text = await blob.text()
                } else {
                    throw new Error("クリップボードに利用可能なテキストがありません。")
                }
            }
        } catch (e) {
            text = ''
            window.alert('クリップボードの取得でエラーが出ました。\n本文欄にカーソルを合わせてから、もう一度実行してみてください。\n(' + e.message + ')')
        }
        if (text === '') {
            return
        }
        window.TextSharding(text.replace(/\r\n/g, '\n'), false, true)
        document.getElementById('vis_fontsize').dispatchEvent(new Event('input'))
        window.CopyContent()
        this.setAttribute('value', '本文をクリップボードで上書きしました！')
        setTimeout(() => { this.setAttribute('value', 'クリップボードで本文を完全に上書き') }, 10000)
    })
})();
