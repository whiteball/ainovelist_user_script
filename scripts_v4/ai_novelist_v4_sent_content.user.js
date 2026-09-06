// ==UserScript==
// @name         AIのべりすと v4向け 送信内容確認
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-09-06
// @description  AIのべりすと編集ページのサイドメニューに、送信内容(テキスト・禁止ワード・バイアス)確認のアイコンを追加します。
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_sent_content.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_sent_content.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const balloon_options_option = document.getElementById('balloon_options_option'),
        options_goodies = document.getElementById('options_goodies')
    if (!balloon_options_option || !options_goodies) {
        // 起点となる要素がないのでスルーする
        return
    }
    // アイコンの準備
    const color_black = 'rgb(68,68,68)';
    const text_svg = `<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="512px" height="512px" viewBox="0 0 512 512" style="width: 64px; height: 64px; opacity: 1;" xml:space="preserve"><style type="text/css">.st0{fill:#4B4B4B;}</style><g><path class="st0" d="M449.891,87.953c-3.766-8.906-10.031-16.438-17.922-21.781c-7.891-5.328-17.5-8.469-27.719-8.469h-42.656v-7.359h-61.828c0.281-2,0.438-4.063,0.438-6.141C300.203,19.828,280.375,0,256,0s-44.203,19.828-44.203,44.203c0,2.078,0.156,4.141,0.438,6.141h-61.828v7.359H107.75c-6.813,0-13.359,1.391-19.281,3.906c-8.906,3.766-16.453,10.031-21.797,17.922c-5.328,7.906-8.469,17.5-8.469,27.719v355.219c0,6.781,1.391,13.344,3.906,19.281c3.766,8.906,10.031,16.438,17.922,21.781c7.906,5.344,17.5,8.469,27.719,8.469h296.5c6.797,0,13.359-1.375,19.281-3.906c8.922-3.75,16.453-10.031,21.797-17.922c5.328-7.891,8.469-17.5,8.469-27.703V107.25C453.797,100.438,452.422,93.891,449.891,87.953z M256,27.797c9.047,0,16.406,7.359,16.406,16.406c0,2.172-0.438,4.234-1.203,6.141h-30.391c-0.781-1.906-1.219-3.969-1.219-6.141C239.594,35.156,246.969,27.797,256,27.797z M424.328,462.469c0,2.813-0.563,5.406-1.578,7.797c-1.5,3.578-4.063,6.672-7.281,8.859c-3.219,2.156-7,3.406-11.219,3.406h-296.5c-2.813,0-5.422-0.563-7.813-1.563c-3.594-1.516-6.672-4.094-8.844-7.297c-2.156-3.219-3.406-7-3.422-11.203V107.25c0-2.813,0.563-5.422,1.578-7.813c1.516-3.594,4.078-6.688,7.281-8.844c3.219-2.156,7-3.406,11.219-3.422h42.656v6.141c0,11.531,9.344,20.875,20.891,20.875h169.422c11.531,0,20.875-9.344,20.875-20.875v-6.141h42.656c2.813,0,5.422,0.563,7.813,1.578c3.578,1.5,6.672,4.063,8.844,7.281s3.422,7,3.422,11.219V462.469z" style="fill: color_setting;"></path><rect x="156.141" y="170.672" class="st0" width="31.625" height="31.625" style="fill: color_setting;"></rect><rect x="225.516" y="170.672" class="st0" width="130.359" height="31.625" style="fill: color_setting;"></rect><rect x="156.141" y="264.125" class="st0" width="31.625" height="31.625" style="fill: color_setting;"></rect><rect x="225.516" y="264.125" class="st0" width="130.359" height="31.625" style="fill: color_setting;"></rect><rect x="156.141" y="357.594" class="st0" width="31.625" height="31.625" style="fill: color_setting;"></rect><rect x="225.516" y="357.594" class="st0" width="130.359" height="31.625" style="fill: color_setting;"></rect></g></svg>`;
    const blob_text_icon = new Blob([text_svg.replace(/color_setting/g, color_black)], { type: 'image/svg+xml' });
    const text_icon_url = URL.createObjectURL(blob_text_icon);
    
    // オプション枠の追加
    balloon_options_option.parentNode.insertAdjacentHTML('beforeend', `
<p class="balloon balloon-btn ballon_options" id="mod-v4-wb-balloon_options_sent_content" onClick="ToggleOptions('wb-1');" tabindex="0" role="button" title="送信テキスト確認(ユーザースクリプト)">
    <img src="${text_icon_url}" class="options_icons" id="mod-v4-wb-img_options_sent_content" alt="環境設定">
</p>`)

    document?.head?.insertAdjacentHTML('beforeend', `<style type="text/css">
#mod-v4-wb-sent-ban-confirm, #mod-v4-wb-sent-bias-confirm {
width: 100%;
margin-top: 1rem;
}
#mod-v4-wb-sent-ban-confirm div, #mod-v4-wb-sent-bias-confirm div {
color:#777777;
margin-bottom: 0.5rem;
}
#mod-v4-wb-sent-ban-confirm table, #mod-v4-wb-sent-ban-confirm td,
#mod-v4-wb-sent-bias-confirm table, #mod-v4-wb-sent-bias-confirm td {
border: solid 1px #777777;
width: 100%;
}
#mod-v4-wb-sent-ban-confirm table, #mod-v4-wb-sent-bias-confirm table {
font-size: 90%;
border-collapse: collapse;
table-layout: fixed;
}
#mod-v4-wb-sent-ban-confirm td, #mod-v4-wb-sent-bias-confirm td {
max-width: 20%;
padding: 5px;
}
#mod-v4-wb-balloon_options_sent_content.is-balloon-selected img {
  filter: invert(34%);
}
</style>`)
    document.getElementById('options_goodies').insertAdjacentHTML('afterend', `<div id="mod-v4-wb-options_sent_content" class="ui-hidden">
    <div class="side_menu-header-wrapper">
        <div class="side_menu-header">
            <h3 id="side_menu-genpreset-label" class="side_menu-header-text">
                送信内容確認(ユーザースクリプト)
            </h3>
        </div>
    </div>

    <section id="mod-v4-wb-side_menu-sent-text-section" class="side_menu-setting-section side_menu-section_bottomspace">
        <div class="side_menu-sectiontitle">
            <button id="mod-v4-wb-side_menu-sent-text-toggle" class="side_menu-toggle" aria-expanded="true" aria-controls="mod-v4-wb-side_menu-sent-text-content">
                <span class="side_menu-toggle-icon" aria-hidden="true">▼</span>
                <h3 id="mod-v4-wb-side_menu-sent-text-toggle-label" class="side_menu-toggle-header-text">送信テキスト</h3>
            </button>
        </div>
        <section id="mod-v4-wb-side_menu-sent-text" class="side_menu-story_options">
            <div id="mod-v4-wb-side_menu-sent-text-content" class="side_menu-sectioncontent" aria-hidden="false">
                <div style="max-width:90%; color:#777777" class="explanations">
                    <div style="float:left;text-align:left">最後にAIに送信した入力テキスト内容・禁止ワード・バイアスを確認できます。</div>
                    <div style="float:none;text-align:right" id="mod-v4-wb-options_sent_content_count"></div>
                </div>
                <textarea id="mod-v4-wb-sent-text-confirm" rows="30" readOnly></textarea>
            </div>
        </section>
    </section>
    
    <section id="mod-v4-wb-side_menu-sent-ban-section" class="side_menu-setting-section side_menu-section_bottomspace">
        <div class="side_menu-sectiontitle">
            <button id="mod-v4-wb-side_menu-sent-ban-toggle" class="side_menu-toggle" aria-expanded="true" aria-controls="mod-v4-wb-side_menu-sent-ban-content">
                <span class="side_menu-toggle-icon" aria-hidden="true">▼</span>
                <h3 id="mod-v4-wb-side_menu-sent-ban-toggle-label" class="side_menu-toggle-header-text">禁止ワード</h3>
            </button>
        </div>
        <section id="mod-v4-wb-side_menu-sent-ban" class="side_menu-story_options">
            <div id="mod-v4-wb-side_menu-sent-ban-content" class="side_menu-sectioncontent" aria-hidden="false">
                <div id="mod-v4-wb-sent-ban-confirm"></div>
            </div>
        </section>
    </section>
    
    <section id="mod-v4-wb-side_menu-sent-bias-section" class="side_menu-setting-section side_menu-section_bottomspace">
        <div class="side_menu-sectiontitle">
            <button id="mod-v4-wb-side_menu-sent-bias-toggle" class="side_menu-toggle" aria-expanded="true" aria-controls="mod-v4-wb-side_menu-sent-bias-content">
                <span class="side_menu-toggle-icon" aria-hidden="true">▼</span>
                <h3 id="mod-v4-wb-side_menu-sent-bias-toggle-label" class="side_menu-toggle-header-text">バイアス</h3>
            </button>
        </div>
        <section id="mod-v4-wb-side_menu-sent-bias" class="side_menu-story_options">
            <div id="mod-v4-wb-side_menu-sent-bias-content" class="side_menu-sectioncontent" aria-hidden="false">
                <div id="mod-v4-wb-sent-bias-confirm"></div>
            </div>
        </section>
    </section>
</div>`)

    // 表示の調整
    const VisualChange2 = function () {
        const $ = window.jQuery
        $('#send-text-confirm,#send-ban-word-confirm,#send-bias-confirm').css('font-family', document.getElementById("vis_fontfamily").value);
        const fontSize = document.getElementById("vis_fontsize")
        $('#send-text-confirm,#send-ban-word-confirm,#send-bias-confirm').css('font-size', fontSize.value / 40 + 'rem');
        $('#send-text-confirm').css('letter-spacing', document.getElementById("vis_fontkerning").value / 80 + 'rem');
        $('#send-text-confirm').css('line-height', document.getElementById("vis_fontleading").value / 10 + 'rem');
        const array_iconsize_actuals = ['32', '20', '24', '28', '32', '36', '40', '48'];
        $('#mod-v4-wb-balloon_options_sent_content').each(function () {
            const size = array_iconsize_actuals[document.getElementById("gui_iconsize").value];
            $(this).css('width', size * 2);
            $(this).css('height', size * 2);
            $(this).css('margin-right', size / 7);
        });
    }
    document.getElementById('vis_fontsize').addEventListener('input', VisualChange2);
    document.getElementById('vis_fontkerning').addEventListener('input', VisualChange2);
    document.getElementById('vis_fontleading').addEventListener('input', VisualChange2);
    document.getElementById('gui_iconsize').addEventListener('input', VisualChange2);
    const originalFontFamily = window.FontFamily
    window.FontFamily = function (elem) {
        originalFontFamily(elem)
        VisualChange2()
    }
    // ほぼ本家処理のコピー
    // 追加したアイコンは白黒の二つ用意するのではなく、filterで色変えをしているので、$().attr('src')による画像パスの設定が要らない
    const ToggleOptionsEx = function (id, dontclose = false) {
        const colsh = GetColorScheme();
        var sectionMap = { 'wb-1': '#mod-v4-wb-options_sent_content' };
        var targetSelector = sectionMap.hasOwnProperty(id) ? sectionMap[id] : null;
        var targetVisible = targetSelector ? $(targetSelector).is(':visible') : false;
        var isSmallViewport = Math.floor(window.innerWidth || 0) <= window.SIDEMENU_BREAKPOINT;
        if( $('#window_state').val() == 0 && id == $.cookie("pref") && !targetVisible ){
            dontclose = true;
        }
        if (!isSmallViewport && !dontclose && targetVisible) {
            return;
        }
        var isToggleClose = isSmallViewport && !dontclose && targetVisible;
        window.Nv4HideAllOptionPanels();
        try {
            var containerCheck = document.querySelector('.container');
            var sideCheck = document.querySelector('aside.side_menu:not(.side_menu_toc)');
            if (containerCheck && sideCheck) {
                containerCheck.classList.remove('is-side-collapsed');
                sideCheck.setAttribute('aria-hidden','false');
                try { $('#img_options_window').attr('src','images/icon_mini_option_white.png'); } catch(e){}
                try { $('#balloon_options_window').addClass('is-balloon-selected'); } catch(e){}
            }
        } catch(e) {}
        try { window.ApplyHeaderAdjustments(); } catch(e) { console.debug('ToggleOptions apply header adjust error', e); }
        window.BalloonOptionsIconChange();
        $('#img_options_option').attr('src','images/icon_mini_option.png');
        $('#img_options_pin').attr('src','images/icon_mini_pin.png');
        $('#img_options_wi').attr('src','images/icon_mini_wi.png');
        $('#img_options_goodies').attr('src','images/icon_mini_goodies.png');
        document.querySelectorAll('.options_header .is-balloon-selected').forEach((element) => element.classList.remove('is-balloon-selected'));
        if (isToggleClose) {
            $('#option_state').val('');
            try { window.AdjustFooterForSidebar(); } catch(e) {}
            try { window.UpdateForcedMainSpLayoutState(); } catch(e) {}
            return;
        }
        if ( id === 'wb-1' ) {
            window.Nv4SetOptionPanelVisible('#mod-v4-wb-options_sent_content', true);
            if (colsh.balloon_on) document.documentElement.style.setProperty('--ui-balloon-on', colsh.balloon_on);
            $('#mod-v4-wb-balloon_options_sent_content').addClass('is-balloon-selected');
            $('#option_state').val("wb-1");
        }
        try { window.AdjustFooterForSidebar(); } catch(e) {}
    }

    const originalNv4HideAllOptionPanels = window.Nv4HideAllOptionPanels
    window.Nv4HideAllOptionPanels = function () {
        originalNv4HideAllOptionPanels();
        // 追加したアイコンに紐付いたコンテンツを非表示にする
        Nv4SetOptionPanelVisible('#mod-v4-wb-options_sent_content', false);
    }
    const originalToggleOptions = window.ToggleOptions
    window.ToggleOptions = function (id, dontclose = false) {
        if (id?.startsWith?.('wb-')) {
            ToggleOptionsEx(id, dontclose);
        } else {
            originalToggleOptions(id, dontclose);
            // 追加したアイコンの選択状態を消す
            document.querySelectorAll('#mod-v4-wb-balloon_options_sent_content.is-balloon-selected').forEach((element) => element.classList.remove('is-balloon-selected'));
        }
        
        return;
    }
    const original__nv4_try_init_visual = window.__nv4_try_init_visual
    window.__nv4_try_init_visual = function () {
        original__nv4_try_init_visual()
        VisualChange2();
    }

    // HandleWindowResizeも上書きした方が良いけど、とりあえず保留
    VisualChange2();

    // 本家処理のコピー
    // addEventListenerだけ呼びたかったけど、applyState/applyCollapseAnimationが外から見えなかったので丸ごとコピー
    (function(){
		document.querySelectorAll('#mod-v4-wb-options_sent_content .side_menu-toggle[aria-controls]').forEach(function(btn){
			const cid = btn.getAttribute('aria-controls');
			const content = document.getElementById(cid);
			if (!content) {
				console.warn('Toggle target not found for', btn.id || '(no id)', 'aria-controls=', cid);
				return;
			}
			// 初期同期
			const expanded = btn.getAttribute('aria-expanded') === 'true';
			applyState(btn, content, expanded, true);

			btn.addEventListener('click', function(e){
				e.preventDefault();
				const cur = btn.getAttribute('aria-expanded') === 'true';
				applyState(btn, content, !cur, false);
			});
		});

		function applyCollapseAnimation(content, expanded, btn){
			try{
				if(content._collapseTimer){
					clearTimeout(content._collapseTimer);
					content._collapseTimer = null;
				}
				if(content._collapseEndHandler){
					content.removeEventListener('transitionend', content._collapseEndHandler);
					content._collapseEndHandler = null;
				}

				content.style.overflow = 'hidden';
				content.style.transition = 'height 0.25s ease';
				content.style.transformOrigin = 'top';
				content.style.willChange = 'height';
				if(DEBUG_MODE) console.log('[applyCollapseAnimation] expanded:', expanded, 'transformOrigin:', content.style.transformOrigin);
				if(expanded){
					content.style.display = '';
					var openHeight = content.scrollHeight;
					content.style.height = '0px';
					content.offsetHeight;
					content.style.height = openHeight + 'px';

					var onOpenEnd = function(ev){
						if(ev.propertyName !== 'height') return;
						content.style.height = '';
						content.style.overflow = '';
						content.style.transition = '';
						content.removeEventListener('transitionend', onOpenEnd);
						content._collapseEndHandler = null;
					};
					content._collapseEndHandler = onOpenEnd;
					content.addEventListener('transitionend', onOpenEnd);
				}else{
					var closeHeight = content.scrollHeight;
					content.style.height = closeHeight + 'px';
					content.offsetHeight;
					content.style.height = '0px';

					var onCloseEnd = function(ev){
						if(ev.propertyName !== 'height') return;
						content.style.display = 'none';
						content.style.height = '';
						content.style.overflow = '';
						content.style.transition = '';
						// collapsed クラスをアニメーション完了後に付与
						content.classList.add('collapsed');
						content.removeEventListener('transitionend', onCloseEnd);
						content._collapseEndHandler = null;
					};
					content._collapseEndHandler = onCloseEnd;
					content.addEventListener('transitionend', onCloseEnd);

					content._collapseTimer = setTimeout(function(){
						content.style.display = 'none';
						content.style.height = '';
						content.style.overflow = '';
						content.style.transition = '';
						content.classList.add('collapsed');
						if(content._collapseEndHandler){
							content.removeEventListener('transitionend', content._collapseEndHandler);
							content._collapseEndHandler = null;
						}
						content._collapseTimer = null;
					}, 320);
				}
			}catch(_){
				content.style.display = expanded ? '' : 'none';
			}
		}

		// トグル状態を適用するヘルパー（aria-expanded / aria-hidden / 表示/非表示更新）
		function applyState(btn, content, expanded, instant){
			btn.setAttribute('aria-expanded', String(expanded));
			if (!expanded && typeof Nv4MoveFocusBeforeAriaHidden === 'function') {
				Nv4MoveFocusBeforeAriaHidden(content, btn);
			}
			content.setAttribute('aria-hidden', String(!expanded));
			if (expanded) {
				content.classList.remove('collapsed');
				if(instant){
					content.style.display = '';
					content.style.height = '';
					content.style.overflow = '';
					content.style.transition = '';
				}else{
					applyCollapseAnimation(content, true);
				}
				// スライダーの値を更新
				if (typeof TempChange === 'function') {
					TempChange();
				}
			} else {
				// アニメーション中は collapsed クラスを付けない（CSS の display: none を回避）
				if(instant){
					content.classList.add('collapsed');
					content.style.display = 'none';
					content.style.height = '';
					content.style.overflow = '';
					content.style.transition = '';
				}else{
					// クラスはアニメーション完了後に付ける
					applyCollapseAnimation(content, false, btn);
				}
			}
			const icon = btn.querySelector('.side_menu-toggle-icon');
			if (icon) icon.textContent = expanded ? '▼' : '▶';
		}
	})();

    // 通信への介入
    const originalAjax = window.jQuery.ajax
    window.jQuery.ajax = function (param) {
        if (param.type === 'POST' && param.data) {
            if (param.url.indexOf('https://ltmemory.tringpt.com/') < 0 && param.url.indexOf('https://api-ltm.') < 0 && param.headers && param.headers['Content-Type'] === 'application/json') {
                const json_data = JSON.parse(param.data)
                const textarea = document.getElementById('mod-v4-wb-sent-text-confirm'),
                    ban_textarea = document.getElementById('mod-v4-wb-sent-ban-confirm'),
                    bias_textarea = document.getElementById('mod-v4-wb-sent-bias-confirm')
                if (json_data.text && textarea) {
                    textarea.value = json_data.text
                    const counter = document.getElementById('mod-v4-wb-options_sent_content_count')
                    if (counter) {
                        counter.textContent = json_data.text.length + '文字'
                    }
                }
                // 禁止ワードの抽出と禁止ワード無効化の適用
                if (json_data.userbadwords && ban_textarea) {
                    const ban_list = json_data.userbadwords.replace(/\u2581/g, '\\n').split('<<|>>')

                    const mod_anti_ban_words = document.getElementById('mod_anti_ban_words')
                    let anti_ban_words = []
                    if (mod_anti_ban_words && mod_anti_ban_words.value) {
                        const pos = json_data.userbadwords.indexOf('[[')
                        if (pos >= 0) {
                            json_data.userbadwords = json_data.userbadwords.slice(pos + '[[<<|>>'.length)
                        }
                        anti_ban_words = mod_anti_ban_words.value.split(/\n|<<\|>>/)
                    }

                    let temp = '', row_temp = '', counter = 0, ban_word_counter = 0, override = []
                    for (const word of ban_list) {
                        if (!word) {
                            continue
                        }
                        if (anti_ban_words.length !== 0) {
                            if (anti_ban_words.includes(word)) {
                                continue
                            }
                            override.push(word)
                        }
                        counter++
                        ban_word_counter++
                        row_temp += '<td>' + word.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') + '</td>'
                        if (counter >= 5) {
                            temp += '<tr>' + row_temp + '</tr>'
                            counter = 0
                            row_temp = ''
                        }
                    }
                    if (row_temp !== '') {
                        temp += '<tr>' + row_temp + '</tr>'
                    }
                    ban_textarea.innerHTML = '<div>適用中の禁止ワード (' + ban_word_counter + '件)</div>' + '<table>' + temp + '</table>'
                    if (anti_ban_words.length !== 0) {
                        json_data.userbadwords = override.join('<<|>>').replace(/\\n/g, '\u2581')
                        param.data = JSON.stringify(json_data)
                    }
                }
                // biasの抽出
                if (json_data.logit_bias && json_data.logit_bias_values && bias_textarea) {
                    const bias_list = json_data.logit_bias.replace(/\u2581/g, '\\n').split('<<|>>'),
                        bias_value_list = json_data.logit_bias_values.split('|')
                    let temp = '', row_temp = '', counter = 0, index = 0, bias_counter = 0
                    for (const word of bias_list) {
                        if (!word) {
                            continue
                        }
                        counter++
                        bias_counter++
                        row_temp += '<td>' + word.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') + ' (' + (Number(bias_value_list[index]) * 4) + ')</td>'
                        if (counter >= 5) {
                            temp += '<tr>' + row_temp + '</tr>'
                            counter = 0
                            row_temp = ''
                        }
                        index++
                    }
                    if (row_temp !== '') {
                        temp += '<tr>' + row_temp + '</tr>'
                    }
                    bias_textarea.innerHTML = '<div>適用中のバイアス・括弧内はバイアス値 (' + bias_counter + '件)</div><table>' + temp + '</table>'
                }
            }
        }
        return originalAjax(param)
    }
})();
