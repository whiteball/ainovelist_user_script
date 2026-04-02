// ==UserScript==
// @name         AIのべりすと 本文をクリップボードにコピー／クリップボードで本文を上書き
// @namespace    https://ai-novelist-share.geo.jp/
// @version      0.3.0
// @description  AIのべりすと編集ページにある環境設定(デスクスタンドのアイコン)の「インポート／エクスポート」の下に、「本文をクリップボードにコピー」ボタンと「クリップボードで本文を完全に上書き」ボタンを追加します。
// @author       しらたま
// @match        https://ai-novel.com/novel.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts/ai_novelist_clipboard_import_export.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts/ai_novelist_clipboard_import_export.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

/*
更新履歴
2026/04/02 0.3.0 アシスタントモードの指示文やthinkブロックを除外するオプションを追加。
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
<label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);" id="mod_copy_clipboard_exclude_assistant"><span class="explanations">　指示ブロックと&lt;think&gt;ブロックを除去</span></label><br>
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
    const mod_copy_clipboard_exclude_assistant = document.getElementById('mod_copy_clipboard_exclude_assistant')
    /** @type {HTMLInputElement|null} */
    const mod_copy_clipboard_keep_color = document.getElementById('mod_copy_clipboard_keep_color')
    /** @type {HTMLButtonElement|null} */
    const mod_copy_clipboard_paste = document.getElementById('mod_copy_clipboard_paste')
    if (!mod_copy_clipboard || !mod_copy_clipboard_dummy || !mod_copy_clipboard_exclude_comment || !mod_copy_clipboard_exclude_assistant || !mod_copy_clipboard_keep_color) {
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
                    .replace(/(<font color="#aaaaaa">)?(?<=>)[@＠][_＿](?!.*<\/?font[^>]*?>).*?(?:<br[^>]*?>|(?=<\/div>)|$)/gi, '')
                    .replace(/(<font color="#aaaaaa">)?(?<=>)[@＠][_＿].*?<\/?font[^>]*?>.*?(?:<br[^>]*?>|(?=<\/div>)|$)/gi, '')
                    .replace(/[@＠]([_＿]|break|startpoint|endpoint|\/\*|\*\/)/gi, '')
            }
            if (mod_copy_clipboard_exclude_assistant.checked) {
                let index = 0, offset = 0
                let text_tmp = ''
                while (true) {
                    const pos_user = text.indexOf('<img src="images/chat_icon_user00.png" class="chat_icon" alt="[＃ユーザー]">', index),
                          pos_assistant = text.indexOf('<img src="images/chat_icon_assistant00.png" class="chat_icon" alt="[＃アシスタント]">', index),
                          pos_think_begin = text.indexOf('&lt;think&gt;', index),
                          pos_think_end = text.indexOf('&lt;/think&gt;', index)
                    if (pos_user === pos_think_begin) {
                        text_tmp += text.substring(index)
                        break
                    }
                    if (pos_user < pos_think_begin && 0 <= pos_user || pos_think_begin < 0) {
                        text_tmp += text.substring(index, pos_user)
                        const pos_assistant2 = text.indexOf('<img src="images/chat_icon_assistant00.png" class="chat_icon" alt="[＃アシスタント]">', pos_assistant + 1)
                        if (pos_assistant < pos_think_end && (pos_think_end < pos_assistant2 || pos_assistant2 < 0)) {
                            index = pos_think_end
                            offset = '&lt;/think&gt;'.length
                        } else {
                            index = pos_assistant
                            offset = '<img src="images/chat_icon_assistant00.png" class="chat_icon" alt="[＃アシスタント]">'.length
                        }
                    } else {
                        text_tmp += text.substring(index, pos_think_begin)
                        index = pos_think_end
                        offset = '&lt;/think&gt;'.length
                    }
                    if (index < 0) {
                        break
                    }
                    index += offset
                }
                text = text_tmp
            }
        } else {
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
            if (mod_copy_clipboard_exclude_assistant.checked) {
                let index = 0, offset = 0
                let text_tmp = ''
                while (true) {
                    const pos_user = text.indexOf('[＃ユーザー]', index),
                          pos_assistant = text.indexOf('[＃アシスタント]', index),
                          pos_think_begin = text.indexOf('<think>', index),
                          pos_think_end = text.indexOf('</think>', index)
                    if (pos_user === pos_think_begin) {
                        text_tmp += text.substring(index)
                        break
                    }
                    if (pos_user < pos_think_begin && 0 <= pos_user || pos_think_begin < 0) {
                        text_tmp += text.substring(index, pos_user)
                        const pos_assistant2 = text.indexOf('[＃アシスタント]', pos_assistant + 1)
                        if (pos_assistant < pos_think_end && (pos_think_end < pos_assistant2 || pos_assistant2 < 0)) {
                            index = pos_think_end
                            offset = '</think>'.length
                        } else {
                            index = pos_assistant
                            offset = '[＃アシスタント]'.length
                        }
                    } else {
                        text_tmp += text.substring(index, pos_think_begin)
                        index = pos_think_end
                        offset = '</think>'.length
                    }
                    if (index < 0) {
                        break
                    }
                    index += offset
                }
                text = text_tmp
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
