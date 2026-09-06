// ==UserScript==
// @name         AIのべりすと v4 保存時にお知らせがにゅっと出る
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-09-06
// @description  AIのべりすとの編集ページで、ローカル、またはリモートに保存が実行されたとき、左下に時限で消えるポップアップを出します。なお、ストレージがいっぱいなどの理由で保存時にエラーが出た場合でも、「保存しました」と表示されますが、仕様です。右下にポップアップが出て欲しいときは、18行目あたりの`const position = 'bottom-left';`を`const position = 'bottom-right';`に書き換えてください。
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_toast_on_save.user.js.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_toast_on_save.user.js.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-toast-plugin/1.3.2/jquery.toast.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // 右側にするときは bottom-left を bottom-right に書き換える
    const position = 'bottom-left';

    if (document.head) {
        const style = document.createElement('style');
        style.textContent = `
.jq-toast-wrap {
    width: 200px !important;
}
        `;
        document.head.appendChild(style)
    }

    document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', `<link href="https://cdnjs.cloudflare.com/ajax/libs/jquery-toast-plugin/1.3.2/jquery.toast.min.css" rel="stylesheet">`)
    const formatTime = function (dateTime, no_delimiter = false) {
        const time_del = no_delimiter ? '' : ':'
        return ('0' + dateTime.getHours()).slice(-2) + time_del + ('0' + dateTime.getMinutes()).slice(-2) + time_del + ('0' + dateTime.getSeconds()).slice(-2)
    }
    let localToast = undefined, remoteToast = undefined
    const showLocalToast = function (message) {
        if (localToast) {
            // まだトーストが非表示になっていないなら、そのトーストの内容を書き換える
            const exist = document.querySelector('.jq-toast-wrap div[style*="rgb(236, 180, 60)"]:not([style*="display: none"])')
            if (exist) {
                exist.childNodes[2].nodeValue = 'ローカル保存しました(' + formatTime(new Date()) + ')'
                return
            }
            localToast.reset()
        }
        localToast = window.jQuery?.toast({
            text: 'ローカル保存しました(' + formatTime(new Date()) + ')',
            showHideTransition: 'slide',
            allowToastClose: true,
            hideAfter: 2000,
            stack: 2,
            position: position,
            bgColor: '#ecb43c',
            textColor: '#404040',
            textAlign: 'left',
            loader: false,
            loaderBg: '#9EC600',
        })
        const fixed_bottom_right = document.getElementsByClassName('fixed_' + position.replace('-', '_'))
        if (fixed_bottom_right.length > 0) {
            const exist = document.querySelector('.jq-toast-wrap.' + position)
            if (exist) {
                exist.style.right = `${60 + fixed_bottom_right[0].clientWidth}px`
            }
        }
    }
    const showRemoteToast = function (message) {
        if (remoteToast) {
            remoteToast.reset()
        }
        remoteToast = window.jQuery?.toast({
            text: 'リモート保存しました(' + formatTime(new Date()) + ')',
            showHideTransition: 'slide',
            allowToastClose: true,
            hideAfter: 4000,
            stack: 2,
            position: position,
            bgColor: '#3cece0',
            textColor: '#2e2e2e',
            textAlign: 'left',
            loader: false,
            loaderBg: '#9EC600',
        })
        const fixed_bottom_right = document.getElementsByClassName('fixed_' + position.replace('-', '_'))
        if (fixed_bottom_right.length > 0) {
            const exist = document.querySelector('.jq-toast-wrap.' + position)
            if (exist) {
                exist.style.right = `${60 + fixed_bottom_right[0].clientWidth}px`
            }
        }
    }

	// 保存処理に介入
    const originalAjax = window.jQuery.ajax
    window.jQuery.ajax = function (param) {
        if (param.type === 'POST' && param.data) {
            if (param.url.slice(-('_remotestories_v4.php'.length)) === '_remotestories_v4.php' && param.data?.mode === 'w') {
                showRemoteToast()
            }
        }
        return originalAjax(param)
    }

    const originalStorageSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
        const work_id = localStorage.getItem('current_works_id_v4')
        if (this === localStorage && key === 'works_v4_' + work_id) {
            showLocalToast()
        }
        return originalStorageSetItem.bind(this)(key, value)
    }
})();
