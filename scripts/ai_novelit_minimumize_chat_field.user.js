// ==UserScript==
// @name         AIのべりすと チャット欄を最小化
// @namespace    https://ai-novelist-share.geo.jp/
// @version      0.1.0
// @description  チャットGUIの入力欄の表示/非表示を切り替えられるチェックボックスを追加します。非表示中、続きを各ボタンはリトライボタンの隣に配置します。また非表示中のチェックボックスの隣には、カーソル位置に[#ユーザー]を挿入するボタンと、[#アシスタント]を挿入するボタンが表示します。
// @author       しらたま
// @match        https://ai-novel.com/novel.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts/ai_novelit_minimumize_chat_field.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts/ai_novelit_minimumize_chat_field.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const style = document.createElement('style')
    style.innerText = `
#gui_writingmode_instruct:has(+ form #mod-compact-chat-field:checked) {
    #writingMode, #writingMode_instruct {
        label {font-size: 75% !important;}
        label .radiocaptions {
            display: none;
        }
    }
}

#mod-compact-chat-field:checked ~ div.flex-chat_field {
    display: none;
}

#mod-compact-chat-field:not(:checked) ~ button {
    display: none;
}

#gui_chat_input_form:has(#mod-compact-chat-field:not(:checked)) + #retryoptions #mod-pseudo-continue {
    display: none;
}

#gui_chat_input_form:has(#mod-compact-chat-field:checked) + #retryoptions input {
    width: 15% !important;
}
`
    document.head.append(style)

    const chatField = document.getElementsByClassName('flex-chat_field')[0];

    // チェックボックスの追加
    const check = document.createElement('input');
    check.type = 'checkbox'
    check.title = '畳む'
    check.id = 'mod-compact-chat-field'
    check.checked = false
    check.addEventListener('change', function () {
        if (this.checked) {
            check.title = '開く'
        } else {
            check.title = '畳む'
        }
        var colsh = window.Colorscheme_Load(document.getElementById("vis_bgcolor").value);
        if (!colsh) {
            colsh.body = "#fff";
            colsh.button = "#777";
        }
        try {
            window.jQuery('#mod-pseudo-continue').animate({ "backgroundColor": colsh.body }, 330, "linear")
            window.jQuery('#mod-pseudo-continue').animate({ "border-bottom-color": colsh.button, "border-left-color": colsh.button, "border-right-color": colsh.button, "border-top-color": colsh.button }, 330, "linear")
            window.jQuery('#mod-pseudo-continue').animate({ "color": colsh.button }, 330, "linear")
        } catch (e) {
            console.error(e)
        }
        const fontSizeList = new Array('17', '12', '14', '16', '17', '19', '21', '25');
        window.jQuery('#mod-pseudo-continue').css('font-size', fontSizeList[document.getElementById("gui_btnsize").value]);
    })
    chatField.parentNode.insertBefore(check, chatField)

    // アイコン挿入関数
    const setIcon = function (img) {
        const br = document.createElement('br')
        const brAfter = document.createElement('br')
        // キャレット位置が取得できないときに、最下部へ挿入するときの関数
        const fallback = function () {
            const target = document.querySelector('#data_container div#data_edit:last-child')

            target.append(br)
            target.append(img)
            target.append(brAfter)

            const top = window.scrollY, left = window.scrollX
            brAfter.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'start' })
            window.scrollTo({ top: top, left: left, behavior: 'auto' })
        }

        const selection = document.getSelection()
        if (selection.rangeCount === 0) {
            fallback()
            return
        }
        const range = selection.getRangeAt(0)

        let end = range.endContainer;
        if (end.nodeName !== '#text') {
            end = end.childNodes[range.endOffset - 1]
        }

        const parent = document.getElementById('data_container')
        if (!(parent && parent.contains(end))) {
            fallback()
            return
        }

        const endNext = end.nextSibling
        end.parentNode.insertBefore(br, endNext)
        end.parentNode.insertBefore(img, endNext)
        end.parentNode.insertBefore(brAfter, endNext)
        selection.removeAllRanges()
        try {
            if (end.nodeName === '#text') {
                const index = Array.from(end.parentNode.childNodes).indexOf(end);
                const offset = Math.min(index + 5, end.parentNode.childNodes.length)
                selection.setPosition(end.parentNode, offset)
            } else {
                const offset = Math.min(range.endOffset + 4, range.endContainer.childNodes.length)
                selection.setPosition(range.endContainer, offset)
            }
        } catch (e) {
            console.error(e)
        }

        const top = window.scrollY, left = window.scrollX,
            scrollOption = { behavior: 'auto', block: 'nearest', inline: 'start' }
        // アイコンとその次の行を画面内に表示するために、2回スクロールする
        img.scrollIntoView(scrollOption)
        if (endNext) {
            if (endNext.nextElementSibling) {
                endNext.nextElementSibling.scrollIntoView(scrollOption)
            } else {
                endNext.scrollIntoView(scrollOption)
            }
        } else {
            brAfter.scrollIntoView(scrollOption)
        }
        window.scrollTo({ top: top, left: left, behavior: 'auto' })
    }

    // 挿入ボタンの追加
    const button1 = document.createElement('button');
    button1.innerText = 'ユ'
    button1.style['margin-left'] = '12px'
    button1.addEventListener('click', function (event) {
        event.preventDefault()
        const img = document.createElement('img');
        img.src = 'images/chat_icon_user00.png'
        img.classList.add('chat_icon')
        img.alt = '[＃ユーザー]'
        setIcon(img)
    })
    chatField.parentNode.insertBefore(button1, chatField)

    const button2 = document.createElement('button');
    button2.innerText = 'ア'
    button2.style['margin-left'] = '12px'
    button2.addEventListener('click', function () {
        event.preventDefault()
        const img = document.createElement('img');
        img.src = 'images/chat_icon_assistant00.png'
        img.classList.add('chat_icon')
        img.alt = '[＃アシスタント]'
        setIcon(img)
    })
    chatField.parentNode.insertBefore(button2, chatField)

    // 続きボタンwの追加
    const retryOptions = document.getElementById('retryoptions')
    const button = retryOptions.children[0].cloneNode()
    button.id = 'mod-pseudo-continue'
    button.value = '続ける'
    button.style.removeProperty('display')
    button.style['margin-right'] = '5px'
    button.addEventListener('click', function () {
        const cont = document.getElementById('getcontinuation_chat')
        cont?.dispatchEvent(new Event('click'))
    })
    retryOptions.insertBefore(button, retryOptions.children[0])
})();
