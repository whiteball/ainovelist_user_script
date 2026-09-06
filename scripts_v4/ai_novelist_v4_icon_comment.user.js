// ==UserScript==
// @name         AIのべりすと v4向け シャード全体をコメントアウトするボタン
// @namespace    https://ai-novelist-share.geo.jp/
// @version      2026-09-06
// @description  各シャード右上にあるアイコンボタンに、シャード全体をコメントアウトするボタンを追加する。コメントアウトしている状態で押すとコメントを外す。注意：先頭と末尾以外に複数行コメントアウト(@/* ... @*/)があると上手く動きません。
// @author       しらたま
// @match        https://ai-novel.com/novel_v4.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_icon_comment.user.js
// @downloadURL  https://github.com/whiteball/ainovelist_user_script/raw/refs/heads/main/scripts_v4/ai_novelist_v4_icon_comment.user.js
// @supportURL   https://github.com/whiteball/ainovelist_user_script
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const icon_svg = `<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="width: 48px; height: 48px; opacity: 1;" xml:space="preserve">
<g>
	<path d="M256,0C114.613,0,0,114.615,0,256s114.613,256,256,256c141.383,0,256-114.615,256-256S397.383,0,256,0z
		 M99.594,144.848L367.15,412.406C335.754,434.781,297.402,448,256,448c-105.871,0-192-86.131-192-192
		C64,214.596,77.217,176.244,99.594,144.848z M412.404,367.15L144.848,99.594C176.242,77.219,214.594,64,256,64
		c105.867,0,192,86.131,192,192C448,297.404,434.781,335.756,412.404,367.15z" style="fill: rgb(0, 0, 0);"></path>
</g>
</svg>`;
    const blob_text_icon = new Blob([icon_svg], { type: 'image/svg+xml' });
    const text_icon_url = URL.createObjectURL(blob_text_icon);

    if (document.head) {
        const style = document.createElement('style');
        style.textContent = `
.category .rightside .icons img.mod-v4-wb-img-comment-icon {
    width: 20px;
    height: 20px;
    padding: 2px;
    img[src$="white.png"] + & {
         filter: invert(100%);
    }
}
        `;
        document.head.appendChild(style)
    }

    // Your code here...　DelegateIconClicks
    const origBuildIconsForCategory = window.BuildIconsForCategory;
    window.BuildIconsForCategory = function (categoryName, isSecondary) {
        const div = origBuildIconsForCategory(categoryName, isSecondary);
        const icon_trash_witag = div.getElementsByClassName('icon_trash_witag');
        const icon_comment = document.createElement('img');
        icon_comment.src = text_icon_url;
        icon_comment.className = 'mod-v4-wb-img-comment-icon';
        div.insertBefore(icon_comment, icon_trash_witag[0]);
        return div;
    }

    const DelegateIconClicksMod = async function (e){
        var t = e.target;
        if (!t) return;
        var icon = (t.closest && t.closest('img,button')) ? t.closest('img,button') : null;
        if (!icon) return;
        var block = icon.closest('.data_block');
        if (!block) return;

        if (icon.classList.contains('mod-v4-wb-img-comment-icon')){
            const catWrap = icon.closest('.category');
            if (catWrap) {
                const editBlock = window.GetEditElementFromCategory(catWrap);
                if (editBlock) {
                    const childNodes = editBlock.childNodes;
                    let commentBegin = null, commentEnd = null;
                    for (const child of childNodes) {
                        // 改行か空白以外を探す
                        if (!(child.nodeName === 'BR' || (child.nodeName === '#text' && child.textContent.trim() === ''))) {
                            if (child.textContent.trim().startsWith('@/*')) {
                                commentBegin = child;
                            }
                            break;
                        }
                    }
                    for (let i = childNodes.length - 1; i >= 0; i--) {
                        const child = childNodes[i];
                        // 改行か空白以外を探す
                        if (!(child.nodeName === 'BR' || (child.nodeName === '#text' && child.textContent.trim() === ''))) {
                            if (commentBegin && child.textContent.trim().endsWith('@*/')) {
                                commentEnd = child;
                            }
                            break;
                        }
                    }
                    if (commentBegin && commentEnd) {
                        if (commentBegin.textContent.trim() === '@/*') {
                            if (commentBegin.nextSibling.tagName === 'BR') {
                                commentBegin.parentNode.removeChild(commentBegin.nextSibling);
                            }
                            commentBegin.parentNode.removeChild(commentBegin);
                        } else {
                            commentBegin.textContent = commentBegin.textContent.replace('@/*', '');
                        }
                        if (commentEnd.textContent.trim() === '@*/') {
                            if (commentEnd.previousSibling.tagName === 'BR') {
                                commentEnd.parentNode.removeChild(commentEnd.previousSibling);
                            }
                            commentEnd.parentNode.removeChild(commentEnd);
                        } else {
                            commentEnd.textContent = commentEnd.textContent.replace('@*/', '');
                        }
                    } else {
                        editBlock.prepend(document.createElement('br'));
                        editBlock.prepend(document.createTextNode('@/*'));
                        editBlock.append(document.createElement('br'));
                        editBlock.append(document.createTextNode('@*/'));
                    }
                }
            }
            return;
        }

       return;
    }

    var container = document.getElementById('data_container');
    if (container){
        container.addEventListener('click', DelegateIconClicksMod);
    }

    window?.ApplyIconRules();

})();
