// ==UserScript==
// @name         AIのべりすと v4向け キーボード操作
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-09-06
// @description  AIのべりすとの編集ページで、シャードにフォーカスがあるときにいくつかのキー操作を追加する。(1) チャット欄と同様にShift+Enterなどで送信(チャット欄の送信設定に従う) (2) 選択範囲のコメントアウト(@/* ... @*/)/コメント解除 (3) キャレットがシャードの先頭にあるときに上矢印キー、末尾にあるとき下矢印キーで隣のシャードに移動 (4) Ctrl+Alt+上下矢印キーでそのシャードを上下に移動(フォーカスのあるシャードの右上アイコンの↑/↓を押した時と同じ動作なので、チャット/AIシャードはセットで移動する)
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_keyboad_control.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_keyboad_control.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const FIELDS = '#data_container .data_edit';

    /** キャレットが要素の先頭にあるか */
    function atStart(el) {
        const sel = getSelection();
        if (!sel.rangeCount || !sel.isCollapsed) return false;
        const r = sel.getRangeAt(0);
        if (!el.contains(r.startContainer)) return false;

        const pre = document.createRange();
        pre.setStart(el, 0);
        pre.setEnd(r.startContainer, r.startOffset);

        const frag = pre.cloneContents();
        return frag.textContent.length === 0; // && !frag.querySelector('img, br, input, video, canvas, svg, object');
    }

    /** キャレットが要素の末尾にあるか */
    function atEnd(el) {
        const sel = getSelection();
        if (!sel.rangeCount || !sel.isCollapsed) return false;
        const r = sel.getRangeAt(0);
        if (!el.contains(r.startContainer)) return false;

        const rest = document.createRange();
        rest.setStart(r.endContainer, r.endOffset);
        rest.setEnd(el, el.childNodes.length);
        if (rest.toString().length > 0) return false;
        // ブラウザが自動挿入する末尾の <br> 1個までは「末尾」とみなす
        return rest.cloneContents().querySelectorAll('br').length <= 1;
    }

    /** フォーカスを移し、キャレットを端に置く */
    function focusAt(el, edge /* 'start' | 'end' */) {
        el.focus({ preventScroll: true });
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(edge === 'start');
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        el.scrollIntoView({ block: 'nearest' });
    }

    /** 現在のシャードを上下に移動する */
    function moveShard(event) {
        // 選択位置を保存
        const selection = document.getSelection();
        const range = selection.getRangeAt(0);
        let start = -1, startPos = 0, end = -1, endPos = 0;
        let i = 1;
        if (event.target == range.startContainer) {
            start = 0;
            startPos = range.startOffset;
        }
        if (event.target == range.endContainer) {
            end = 0;
            endPos = range.endOffset;
        }
        const childNodes = event.target.childNodes;
        while ((start === -1 || end === -1) && (childNodes.length >= i)) {
            if (childNodes[i - 1] == range.startContainer) {
                start = i;
                startPos = range.startOffset;
            }
            if (childNodes[i - 1] == range.endContainer) {
                end = i;
                endPos = range.endOffset;
            }
            i++;
        }
        
        // アイコンクリックを再現
        const icon = event.target.closest('.data_block')?.querySelector(event.key === 'ArrowUp' ? '.icon_up' : '.icon_down');
        if (icon) {
            icon.dispatchEvent(new Event('click', { 'bubbles': true, 'cancelable': true }));
        }

        //シャード移動で失われるフォーカスを復帰させる
        event.target.focus();

        // 選択状態を元に戻す
        try {
            const newRange = document.createRange();
            if (start >= 0) {
                newRange.setStart(start === 0 ? event.target : event.target.childNodes[start - 1], startPos);
            }
            if (end >= 0) {
                newRange.setEnd(end === 0 ? event.target : event.target.childNodes[end - 1], endPos);
            }
            
            selection.removeAllRanges();
            selection.addRange(newRange);
        } catch (exception) {
            console.debug(exception);
        }
    }

    document.getElementById('data_container').addEventListener('keydown', (event) => {;
        // IME 変換中
        if (event.isComposing || event.keyCode === 229) return;
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
                {
                    if (event.shiftKey || event.metaKey) {
                        break;
                    } else if (event.ctrlKey && event.altKey) {
                        moveShard(event);
                        break;
                    } else if (event.ctrlKey || event.altKey) {
                        break;
                    }

                    const el = event.target.closest?.(FIELDS);
                    if (!el) {break;}

                    const up = event.key === 'ArrowUp';
                    if (up ? !atStart(el) : !atEnd(el)) { break;}

                    const fields = [...document.querySelectorAll(FIELDS)]
                    .filter((f) => !f.disabled && f.offsetParent !== null);
                    const next = fields[fields.indexOf(el) + (up ? -1 : 1)];
                    if (!next) { break;}

                    event.preventDefault();
                    focusAt(next, up ? 'end' : 'start');
                }
                break;
            case '/':
                {
                    if (!event.ctrlKey) {
                        break;
                    }
                    const selection = document.getSelection()
                    const range = selection.getRangeAt(0)
                    let start = range.startContainer, end = range.endContainer;
                    if (start.nodeName !== '#text') {
                        start = start.childNodes[range.startOffset]
                    }
                    if (end.nodeName !== '#text') {
                        end = end.childNodes[range.endOffset - 1]
                    }

                    if (start.textContent === '@/*' && end.textContent === '@*/') {
                        if (start.nextSibling.tagName === 'BR') {
                            start.parentNode.removeChild(start.nextSibling)
                        }
                        start.parentNode.removeChild(start)
                        if (end.previousSibling.nodeName === '#text' && end.previousSibling.textContent === '' && end.previousSibling.previousSibling.tagName && end.previousSibling.previousSibling.tagName === 'BR') {
                            end.parentNode.removeChild(end.previousSibling.previousSibling)
                            end.parentNode.removeChild(end.previousSibling)
                        } else {
                            if (end.previousSibling.tagName && end.previousSibling.tagName === 'BR') {
                                end.parentNode.removeChild(end.previousSibling)
                            }
                        }
                        end.parentNode.removeChild(end)
                        return
                    }

                    const before = document.createTextNode('@/*'), after = document.createTextNode('@*/')
                    const brBefore = document.createElement('br'), brAfter = document.createElement('br')

                    start.parentNode.insertBefore(before, start)
                    start.parentNode.insertBefore(brBefore, start)
                    end.parentNode.insertBefore(after, end.nextSibling)
                    end.parentNode.insertBefore(brAfter, end.nextSibling)
                    selection.removeAllRanges()
                    selection.setBaseAndExtent(before, 0, after, 3)
                }
                break;
            case 'Enter':
                {
                    const chat_enterkey = Number(document.getElementById("chat_enterkey")?.value ?? 1),
                        chat_change_enterkey = document.getElementById("chat_change_enterkey")?.checked ?? false;
                    
                    // 送信キー無効なら何もしない。Ctrl/Alt+Enterでの改行挿入もしない。
                    if (chat_enterkey === 0) {
                        break;
                    }

                    event.preventDefault()
                    const optionKeys = ['shiftKey', 'ctrlKey', 'altKey'];
                    if ((chat_change_enterkey && optionKeys.every(key => !(event?.[key] ?? false))) || (!chat_change_enterkey && event[optionKeys?.[chat_enterkey - 1] ?? 'shiftKey'])) {
                        // 送信イベントを呼ぶ
                        document.getElementById('getcontinuation_chat')?.dispatchEvent(new Event('click'));
                    } else {
                        // Undo履歴に残すために、execCommand(非推奨API)で改行を送信する。これによりCtrl/Alt+Enterでも改行が入る
                        document.execCommand('insertText', false, '\n');
                    }
                }
                break;
            default:
                break;
        }
    });
})();
