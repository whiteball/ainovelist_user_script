// ==UserScript==
// @name         AIのべりすと v4向け 省スペース
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-09-06
// @description  AIのべりすとの編集ページで、チャット欄を非表示にしたり、モデル選択をトグル表示にしたり、いろんな所をちょっとずつ詰めたりして、メインの編集枠をできるだけ広く取れるようにします。AIに指示を出したいときは、画面右下の「USER」ボタンを押してください。編集枠の一番下にユーザー入力シャード（通常のチャット欄に入力したときに出るものと同じやつ）を追加します。「TEXT」ボタンはシャードのアイコンの＋ボタンを押したときに出るテキストシャードを追加します。「MODEL」ボタンを押すとモデル選択のドロップダウンメニューをトグル表示します。
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_toast_on_save.user.js.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_toast_on_save.user.js.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.head) {
        const style = document.createElement('style');
        style.textContent = `
br:has(+ .radiocaptions){
        display: none;
    }
    .radiocaptions{
        display: none;
    }
    .radio-inline__label.radio-card {
        line-height: 1;
        display: inline-block;
    }

    .radio-inline__input:checked + .radio-inline__label.radio-card > .radiocaptions {
        display: inline-block;
        padding-inline-start: 5px;
    }

#gui_writingmode_instruct {
    position: relative;
    .tool_bar {
        position: absolute;
        right: 200px;
        top: 0;
        display: flex;
        gap: 10px;
        button {
          flex: 1;
        }
    }
}
.nv4_page_column:has(~ aside.side_menu[aria-hidden="false"]) .tool_bar {
    right: 0 !important;
}
#gui_chat_input_form {
    display: none;
}
.gui_retryoptions {
    font-size: 14px !important;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
    align-items: center;
    grid-gap: 10px;
    & > input {
         width: 100%;
         &:first-child {
              grid-column: 2 / 3;
         }
    }
    .model_button {
        justify-self: start;
        margin-left: 20px;
    }
}
.btn-getcontinuation-chat {
    margin-bottom: 0;
    max-width: revert;
    width: 20%;
    font-size: 14px !important;
}
#data_container {
  padding-inline: 10px;
}
.data_edit {
    margin-bottom: 10px;
}
.main_area {
    max-height: 115vh;
}
.ai-model-selector {
    margin-bottom: 18px;
}
.btn-abort_output {
  font-size: 14px;
  height: 40px;
}
.fixed_bottom_right {
  bottom: 5px;
}
#loading_anim {
    display: flex;
    justify-content: center;
    align-items: center;
    #loading_anim_gif {
      width: 50px;
      height: 50px;
    }
    p {
        margin: 0;
    }
}
        `;
        document.head.appendChild(style)
    }

    const appendDataBlock = function (type) {
		try {
            const prevElement = document.querySelector('#data_container .data_block:last-child')
            if (!prevElement) {
                return;
            }
			var newBlock = createDataBlockElement(prevElement.getAttribute('data-index'), [{ cat: type, text: '' }]);
			var edit = newBlock.querySelector('.data_edit');

			prevElement.parentNode.appendChild(newBlock);

			AttachListeners();
			ApplyIconRules();
			try {
                if (typeof VisualChange === 'function') {
                    VisualChange();
                }
            } catch (e) {
                if (DEBUG_MODE) {
                    console.warn('VisualChange after icon_plus insert failed:', e);
                }
            }
			if (typeof syncDOMToStorageDebounced === 'function') {
                syncDOMToStorageDebounced(newBlock);
            }

			setTimeout(function () {
				try { edit.focus(); } catch (_) { }
			}, 10);
		} catch(e) {
            console.error('UserScript: appendDataBlock failed', e);
        }
    }

    const gui_writingmode_instruct = document.getElementById('gui_writingmode_instruct');
    gui_writingmode_instruct.insertAdjacentHTML('beforeend', `
<div class="tool_bar">
    <button id="add-text-shard" title="末尾にテキストシャードを追加">TEXT</button><button id="add-user-shard" title="末尾にユーザー入力シャードを追加">USER</button>
</div>`);
    document.getElementById('add-text-shard')?.addEventListener('click', function () {
        appendDataBlock('plaintext');
    });
    document.getElementById('add-user-shard')?.addEventListener('click', function () {
        appendDataBlock('User');
    });
    const getcontinuation_chat = document.getElementById('getcontinuation_chat');
    document.getElementById('retryoptions')?.prepend(getcontinuation_chat);
    document.getElementById('retryoptions')?.insertAdjacentHTML('beforeend', `
<div class="model_button"><button id="collapse-model-select" type="button" title="言語モデル選択リストを開閉">＞ MODEL</button>
    `);
    const model_action = function (event) {
        const element = document.getElementById('ai_model_selector_inline')
        if (element) {
            const main = document.getElementsByClassName('main_area');
            if (element.style.display==='none') {
                element.style.display = '';
                element.scrollIntoView({block: 'end'});
                if (event) {
                    event.target.textContent = '▼ MODEL';
                }
                if (main[0]) {
                    main[0].style['max-height'] = 'calc(115vh - 72.25px)';
                }
            } else {
                element.style.display = 'none';
                if (event) {
                    event.target.textContent = '▶ MODEL';
                }
                if (main[0]) {
                    main[0].style['max-height'] = '';
                }
            }
        }

    };
    document.getElementById('collapse-model-select')?.addEventListener('click', model_action);
    model_action();

    const orig_showpost_v4 = window.showpost_v4;
    window.showpost_v4 = function () {
        orig_showpost_v4();
        document.getElementById('chat_input_field').scrollIntoView({block: 'end'});
    }
})();
