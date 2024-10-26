// ==UserScript==
// @name         AIのべりすと 出力をVOICEVOX読み上げ
// @namespace    https://ai-novelist-share.geo.jp/
// @version      0.2.0
// @description  AIのべりすとにて、出力をVOICEVOX(https://voicevox.hiroshiba.jp/)で読み上げるためのユーザースクリプトです。Ctrl+Alt+vで選択テキストの読み上げもできます。利用には別途VOICEVOXのインストールが必要です。話速などの調整や、プリセットの使用・編集もブラウザ上からできます。また、VOICEVOXの複数エンジン対応を使用している場合、すべてのエンジンを同時に扱うことも可能です。
// @author       しらたま
// @match        https://ai-novel.com/novel*.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ai-novel.com
// @updateURL    https://gist.github.com/whiteball/f5d700c831a45252b046d2cb1f599a7f/raw/ai_novelist_voicevox.user.js
// @downloadURL  https://gist.github.com/whiteball/f5d700c831a45252b046d2cb1f599a7f/raw/ai_novelist_voicevox.user.js
// @supportURL   https://gist.github.com/whiteball/f5d700c831a45252b046d2cb1f599a7f
// @grant        none
// ==/UserScript==

/*
更新履歴
2023/02/06 v0.2.0
・複数ホストに対応。VOICEVOXに複数エンジンをインストールしている場合、それらのエンジンのホストを「localhost:50021<<|>>localhost:50025」などのように並べて書けば、すべてのエンジンのボイスが利用可能になる。
・ボイスを選択したとき、そのキャラクターのアイコンを表示するようにした。
・ボイスと一覧で、プリセットにもベースとなるボイス名を表示するようにした。
・話速・音高・抑揚・音量・開始無音・終了無音の各パラメータを調整できるようにした。
・プリセットの追加・更新・削除をできるようにした。
・選択部分の読み上げを無効にできるようにした。
*/

(function() {
    'use strict';
    let pref = JSON.parse(localStorage.user_script_voicevox_pref ? localStorage.user_script_voicevox_pref : '{}')
    if ( ! pref.hasOwnProperty('voicevox')) {
        pref.voicevox = false
    }
    if ( ! pref.hasOwnProperty('hotkey')) {
        pref.hotkey = false
    }
    if ( ! pref.hasOwnProperty('host')) {
        pref.host = 'localhost:50021'
    }
    if ( ! pref.hasOwnProperty('style')) {
        pref.style = '3'
    }
    if ( ! pref.hasOwnProperty('volume')) {
        pref.volume = 70
    }
    if ( ! pref.hasOwnProperty('ignore_pattern')) {
        pref.ignore_pattern = ''
    }
    if ( ! pref.hasOwnProperty('read_back')) {
        pref.read_back = false
    }
    if ( ! pref.hasOwnProperty('read_back_pattern')) {
        pref.read_back_pattern = '<br><<|>>。<<|>>「'
    }
    if ( ! pref.hasOwnProperty('part_voice')) {
        pref.part_voice = false
    }

    /*const loadPref = function () {
        const pref_temp = JSON.parse(localStorage.user_script_voicevox_pref ? localStorage.user_script_voicevox_pref : '{}')
    }*/
    const savePref = function () {
        if (pref) {
            localStorage.user_script_voicevox_pref = JSON.stringify(pref)
        }
    }

    const htmlEscape = function (str) {
        return str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    }

    const splitter = new RegExp(/<\|>|<<\|>>/)
    class Params {
        constructor() {
            for (const param of [['speedScale', 1], ['pitchScale', 0], ['intonationScale', 1], ['volumeScale', 1], ['prePhonemeLength', 0.1], ['postPhonemeLength', 0.1]]) {
                const elem = document.getElementById('mod_voicevox_param_' + param[0])
                let value
                if (elem && elem.value) {
                    value = Number(elem.value)
                } else {
                    value = param[1]
                }
                if (isNaN(value)) {
                    value = param[1]
                }
                this[param[0]] = value
            }
        }
    }

    const voiceQueue = []
    const audio = new Audio()
    audio.valume = Number(pref.volume) / 100
    audio.addEventListener('ended', (event) => {
        URL.revokeObjectURL(audio.src)
        //audio.src = ''
        if (voiceQueue.length > 0) {
            audio.src = voiceQueue.shift()
            audio.play()
        }
    })
    const getStyle = function (id) {
        const target = document.querySelector('#mod_voicevox_style option[value="' + id + '"]')
        if (!target) {
            return false
        }
        const host = target.getAttribute('data-host'),
              uuid = target.getAttribute('data-uuid'),
              name = target.getAttribute('data-name'),
              params_attr = target.getAttribute('data-params')
        let style_id = target.getAttribute('data-id'), preset_id = undefined, params = undefined
        if (!style_id) {
            style_id = target.getAttribute('data-raw-id')
        } else {
            preset_id = target.getAttribute('data-raw-id')
        }
        if (!style_id || !host || !uuid) {
            return false
        }
        if (params_attr) {
            const params_array = params_attr.split(',')
            params = {
                "speedScale": Number(params_array[0]),
                "pitchScale": Number(params_array[1]),
                "intonationScale": Number(params_array[2]),
                "volumeScale": Number(params_array[3]),
                "prePhonemeLength": Number(params_array[4]),
                "postPhonemeLength": Number(params_array[5])
            }
        }
        return {
            host,
            uuid,
            style_id,
            preset_id,
            name,
            params

        }
    }
    // VOICEVOX API
    const speechOneVoiceVox = async function (text, style) {
        if (!(typeof text === 'string' && text !== '' && (style || style === 0))) {
            return false
        }
        const endoced_text = encodeURIComponent(text)
        try {
            let res
            const info = getStyle(style)
            if (!info) {
                throw new Error('ボイスのスタイルが取得できません')
            }
            let query
            if (info.preset_id) {
                res = await fetch(`http://${info.host}/audio_query_from_preset?text=${endoced_text}&preset_id=${info.preset_id}`, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                    },
                })
                query = await res.json()
            } else {
                res = await fetch(`http://${info.host}/audio_query?text=${endoced_text}&speaker=${info.style_id}`, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                    },
                })
                query = await res.json()
                const mod_voicevox_param_enable = document.getElementById('mod_voicevox_param_enable')
                if (mod_voicevox_param_enable && mod_voicevox_param_enable.checked) {
                    /*for (const param of ['speedScale', 'pitchScale', 'intonationScale', 'volumeScale', 'prePhonemeLength', 'postPhonemeLength']) {
                        const param_element = document.getElementById('mod_voicevox_param_' + param)
                        if (param_element) {
                            const param_num = Number(param_element.value)
                            if (!isNaN(param_num)) {
                                query[param] = param_num
                            }
                        }
                    }*/
                    query = Object.assign(query, new Params())
                }
            }
            query.prePhonemeLength += 0.5
            const sound_row = await fetch(`http://${info.host}/synthesis?speaker=${info.style_id}&enable_interrogative_upspeak=true`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'audio/wav',
                },
                body: JSON.stringify(query),
            })
            const sound_blob = await sound_row.blob()
            const sound_url = URL.createObjectURL(sound_blob)
            return sound_url
        } catch (e) {
            console.error(e)
            return false
        }
    }
    const speechVoiceVox = async function (text, style = undefined) {
        if (!pref.voicevox) {
            return false
        }
        if (style === undefined) {
            // 引数省略時は設定を使う
            style = document.getElementById('mod_voicevox_style').value
        }
        if (!(typeof text === 'string' && text !== '' && (style || style === 0))) {
            return false
        }

        if (pref.ignore_pattern) {
            for(const pattern of pref.ignore_pattern.split(/<\|>|<<\|>>/)) {
                if (!pattern) { continue }
                const reg = new RegExp(pattern, 'g')
                text = text.replace(reg, '')
            }
        }
        if (text === '') {
            return false
        }

        let text_structure = [text], temp_structure = []
        if (pref.part_voice) {
            const prefix = /^\(\?:VOICEVOX:((?:\d+\-)?p?\d+)\)\{0\}/
            for (let i = 0; i < 100; i++) {
                const script_selector = document.getElementById('script_selector' + i)
                if (script_selector && script_selector.value === 'script_none') {
                    const script_in = document.getElementById('script_in' + i)
                    if (script_in && !script_in.value.startsWith('(?:VOICEVOX:')) {
                        continue
                    }
                    const match_result = script_in.value.match(prefix)
                    if (!(match_result && match_result[1])){
                        continue
                    }
                    const part_style = match_result[1]
                    const script_out = document.getElementById('script_out' + i)
                    let script_out_text = script_out.value
                    const regexp_in = new RegExp(script_in.value)
                    let matched = false
                    do {
                        matched = false
                        for (const temp of text_structure) {
                            if (typeof temp !== 'string') {
                                temp_structure.push(temp)
                                continue
                            }
                            if (temp === '') {
                                continue
                            }
                            const in_match = temp.match(regexp_in)
                            if (!in_match) {
                                temp_structure.push(temp)
                                continue
                            }
                            temp_structure.push(temp.substring(0, in_match.index))
                            const temp_behind = temp.substring(in_match.index + in_match[0].length)
                            const replace_result = temp.replace(regexp_in, script_out_text)
                            temp_structure.push({
                                'text': replace_result.substring(in_match.index, replace_result.length - temp_behind.length),
                                'style': part_style,
                            })
                            temp_structure.push(temp_behind)
                            matched = true
                        }
                        text_structure = temp_structure
                        temp_structure = []
                    } while (matched)
                }
            }
        }

        // 再生キューを消して、再生中のものは停止する
        while (voiceQueue.length > 0) {
            URL.revokeObjectURL(voiceQueue.shift())
        }
        if (!audio.paused) {
            audio.pause()
            if (audio.src !== '') {
                URL.revokeObjectURL(audio.src)
            }
        }
        audio.pause()
        try {
            for (const struct of text_structure) {
                let part_text = '', part_style = style
                if (typeof struct === 'string') {
                    part_text = struct
                } else {
                    part_text = struct.text
                    part_style = struct.style
                }
                for (const line of part_text.split('\n')) {
                    if (!(line.trim())) { continue }
                    const sound_url = await speechOneVoiceVox(line, part_style)
                    if (sound_url === false) {
                        return false
                    }
                    if (audio.paused) {
                        audio.src = sound_url
                        audio.play()
                    } else {
                        voiceQueue.push(sound_url)
                    }
                }
            }
        } catch (e) {
            console.error(e)
            return false
        }
        return true
    }
    const getStyleList = async function () {
        let result = [], multi = splitter.test(pref.host), i = 0

        for (const host of pref.host.split(splitter)) {
            i++
            if (multi) {
                result.push('-- ' + host)
            }
            try {
                const res = await fetch(`http://${host}/speakers`, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                    }
                })
                const speakers = await res.json()
                for (const speaker of speakers) {
                    const name = speaker.name, uuid = speaker.speaker_uuid
                    for (const style of speaker.styles) {
                        result.push({
                            'id': '' + (multi ? '' + i + '-' : '') + style.id,
                            'uuid': uuid,
                            'name': name + ' - ' + style.name,
                            'raw_id': '' + style.id,
                            'host': host,
                        })
                    }
                }
                const res2 = await fetch(`http://${host}/presets`, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                    }
                })
                const preset_result = []
                const presets = await res2.json()
                for (const preset of presets) {
                    preset_result.push({
                        'id': (multi ? '' + i + '-' : '') + 'p' + preset.id,
                        'uuid': preset.speaker_uuid,
                        'name': preset.name,
                        'style_id': '' + preset.style_id,
                        'raw_id': '' + preset.id,
                        'params': `${preset.speedScale},${preset.pitchScale},${preset.intonationScale},${preset.volumeScale},${preset.prePhonemeLength},${preset.postPhonemeLength}`,
                        'host': host,
                    })
                }
                if (preset_result.length > 0) {
                    result.push('--')
                    result = result.concat(preset_result)
                }
            } catch (e) {
                console.error(e)
            }
        }
        return result
    }
    const initStyle = async function (id) {
        const info = getStyle(id)
        if (!info) {
            return false
        }
        try {
            const res = await fetch(`http://${info.host}/is_initialized_speaker?speaker=${info.style_id}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                }
            })
            const is_init = await res.json()
            if (!is_init) {
                fetch(`http://${info.host}/initialize_speaker?speaker=${info.style_id}`, {
                    method: 'POST',
                    headers: {
                        'accept': '*/*',
                    }
                })
            }
            fetch(`http://${info.host}/speaker_info?speaker_uuid=${encodeURIComponent(info.uuid)}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                }
            })
                .then(res => res.json())
                .then(speaker_info => {
                if (speaker_info && speaker_info.style_infos) {
                    for (const style_info of speaker_info.style_infos) {
                        if (style_info.id === Number(info.style_id)){
                            const mod_voicevox_icon = document.getElementById('mod_voicevox_icon')
                            if (mod_voicevox_icon) {
                                mod_voicevox_icon.src = 'data:image/png;base64,' + style_info.icon
                                mod_voicevox_icon.style.display = ''
                            }
                        }
                    }
                }
            })
            if (info.params) {
                for (const param in info.params) {
                    if (info.params.hasOwnProperty(param)) {
                        const param_element = document.getElementById('mod_voicevox_param_' + param)
                        if (param_element) {
                            param_element.value = info.params[param]
                        }
                    }
                }
                const mod_voicevox_param_preset_name = document.getElementById('mod_voicevox_param_preset_name')
                if (mod_voicevox_param_preset_name) {
                    mod_voicevox_param_preset_name.value = info.name
                }
            } else {
                const mod_voicevox_param_preset_name = document.getElementById('mod_voicevox_param_preset_name')
                if (mod_voicevox_param_preset_name) {
                    mod_voicevox_param_preset_name.value = ''
                }
            }
            return true
        } catch (e) {
            console.error(e)
        }
        return false
    }
    const addPreset = async function (host, name, uuid, style_id, params) {
        try {
            const res = await fetch(`http://${host}/add_preset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    "id": -1,
                    "name": name,
                    "speaker_uuid": uuid,
                    "style_id": Number(style_id),
                    "speedScale": Number(params.speedScale),
                    "pitchScale": Number(params.pitchScale),
                    "intonationScale": Number(params.intonationScale),
                    "volumeScale": Number(params.volumeScale),
                    "prePhonemeLength": Number(params.prePhonemeLength),
                    "postPhonemeLength": Number(params.postPhonemeLength)
                })
            })
            return res.json()
        } catch (e) {
            console.error(e)
            return undefined
        }
    }
    const updatePreset = async function (host, id, name, uuid, style_id, params) {
        try {
            const res = await fetch(`http://${host}/update_preset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    "id": Number(id),
                    "name": name,
                    "speaker_uuid": uuid,
                    "style_id": Number(style_id),
                    "speedScale": Number(params.speedScale),
                    "pitchScale": Number(params.pitchScale),
                    "intonationScale": Number(params.intonationScale),
                    "volumeScale": Number(params.volumeScale),
                    "prePhonemeLength": Number(params.prePhonemeLength),
                    "postPhonemeLength": Number(params.postPhonemeLength)
                })
            })
            return res.json()
        } catch (e) {
            console.error(e)
            return undefined
        }
    }
    const deletePreset = async function (host, id) {
        try {
            const res = await fetch(`http://${host}/delete_preset?id=${id}`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                }
            })
            return true
        } catch (e) {
            console.error(e)
            return true
        }
    }

    // 出力文を取得する部分
    // PushHistoryが基本的に最新出力文挿入後にしか呼ばれないため、無理矢理割り込んでいます
    const originalPushHistory = window.PushHistory
    window.PushHistory = function (data) {
        let start = data.lastIndexOf('<span id="ai_output"'), end = data.indexOf('</span>', start)
        if (start >= 0 && end >= 0) {
            // 出力した後
            // 出力の最初が改行ならそれを読み飛ばす
            const matches = data.slice(start, start + 100).match(/^<span[^>]+>/),
                  head = matches ? (matches[0].length + start) : 0
            if (pref.read_back) {
                // 指定の文字が出てくるまで戻る
                let nearest = 0
                for (const pattern of pref.read_back_pattern.split(/<\|>|<<\|>>/)) {
                    if (!pattern) { continue }
                    const temp_nearest = head + pattern.length
                    if (nearest < temp_nearest && data.slice(head, temp_nearest) === pattern) {
                        nearest = temp_nearest
                        continue
                    }
                    if (start > nearest) {
                        const temp = data.lastIndexOf(pattern, start)
                        if (temp > nearest) {
                            nearest = temp + pattern.length
                        }
                    }
                }
                if ((end - nearest) > 1024) {
                    // 長すぎる場合は出力のみを渡す
                    speechVoiceVox(data.slice(start, end).replace(/<br>/g, '\n').replace(/<[^>]+?>/g, ''))
                } else {
                    speechVoiceVox(data.slice(nearest, end).replace(/<br>/g, '\n').replace(/<[^>]+?>/g, ''))
                }
            } else {
                speechVoiceVox(data.slice(start, end).replace(/<br>/g, '\n').replace(/<[^>]+?>/g, ''))
            }
        }
        originalPushHistory(data)
    }

    document.getElementById('options_goodies').insertAdjacentHTML('beforeend', `
<dl>
  <dt id="mod_voicevox_menu" style="cursor: pointer">
    <div class="header3" style="padding:0px;">
      <h3 style="padding-left:15px;" id="options_head">▼　VOICEVOX設定(ユーザースクリプト)</h3>
    </div>
  </dt>
  <dd class="dd-margin" style="margin: 0px 0px 0px 40px; display: none;">
    <h3>VOICEVOX設定
      <span id="tooltips">
	    <span id="help_mod_voicevox" data-text="別途インストールしたVOICEVOXで出力文を読み上げるための設定です。出力文が長いとエラーが出る可能性があるので、「出力の長さ」を小さくしたり「出力をトリムする」を有効にしたりしてください。&lt;br&gt;Ctrl+Alt+vで本文の選択テキストを読み上げることもできます。&lt;br&gt;ホストには&lt;&lt;|&gt;&gt;で区切って複数のエンジンを指定することもできます。&lt;br&gt;例:localhost:50021&lt;&lt;|&gt;&gt;localhost:50025">
	    <img src="images/icon_popup.png" width="20" height="20" id="help_mod_voicevox_icon" class="help_popup" style="margin-left: 10px; margin-top: -5px; vertical-align:middle;" aria-describedby="tooltip_mod_voicevox" onclick="return false;"></span>
      </span>
    </h3>
    <div style="margin-bottom: 1rem;line-height: 2rem;">
        <label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);" id="mod_voicevox" ` + (pref.voicevox ? 'checked' : '') + `><span class="explanations">　出力の読み上げを有効化</span></label><br>
        <label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);" id="mod_voicevox_hotkey" ` + (pref.hotkey ? 'checked' : '') + `><span class="explanations">　ショートカットキーによる選択部分の読み上げを有効化</span></label><br>
        <label>ホスト：<input type="text" style="font-size: 18px;width:300px;max-width: 80vw;margin: 5px 0" id="mod_voicevox_host" value="${pref.host}" placeholder="例：localhost:50021"></label><br>
        <label>ボイス：<select style="font-size: 18px;margin: 5px 0;max-width: 80vw;" id="mod_voicevox_style"></select><img id="mod_voicevox_icon" style="display: none;margin-left:10px;width:3rem;height:3rem;vertical-align: middle;"></label><br>
        <button id="mod_voicevox_style_button" style="margin: 5px 0">ボイス一覧を取得</button><br>
        <label style="margin: 5px 0">ブラウザ音量：<input type="number" style="font-size: 18px;width:4rem;" id="mod_voicevox_volume" value="${pref.volume}" min="0" max="100" placeholder="例：70"></label><br>
        <dl>
            <dt id="mod_voicevox_param_area_title" style="cursor: pointer;min-width:20rem;width: 30vw">
                <h5 style="margin: 5px 0 10px;border-bottom: #cd2b5a 2px solid;">▼ パラメータ調整(クリックで展開)</h5>
            </dt>
            <dd id="mod_voicevox_param_area" style="display:none;margin: 5px 0 1rem">
                <label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);" id="mod_voicevox_param_enable"><span class="explanations">　パラメータ調整を有効化</span>
                  <span id="tooltips">
	                <span id="help_mod_voicevox_param" data-text="パラメータ調整を有効にすると、下の6つのパラメータが音声に反映されるようになります。また、ボイス選択でプリセットを選択すると、そのプリセットの値でパラメータが上書きされます。&lt;br&gt;ボイス選択でプリセット以外を選択している場合は、プリセット名を入力して作成ボタンを押すことで、現在のボイスとパラメータで新規プリセットを追加できます。&lt;br&gt;プリセットを選択している場合は、現在のパラメータでそのプリセット設定を上書きします(ボイスは変更できません)。&lt;br&gt;プリセット選択状態で削除ボタンを押すと、そのプリセットを削除します。削除すると元に戻せません。">
	                <img src="images/icon_popup.png" width="20" height="20" id="help_mod_voicevox_param_icon" class="help_popup" style="margin-left: 10px; margin-top: -5px; vertical-align:middle;" aria-describedby="tooltip_mod_voicevox_param" onclick="return false;"></span>
                  </span></label><br>
                <label style="margin: 5px 0">話速：<input type="number" style="font-size: 18px;width:4.5rem;" id="mod_voicevox_param_speedScale" value="1.00" min="0.50" max="2.00" step="0.01" placeholder="1.00"></label>
                <label style="margin: 5px 0">音高：<input type="number" style="font-size: 18px;width:4.5rem;" id="mod_voicevox_param_pitchScale" value="0.00" min="-0.15" max="0.15" step="0.01" placeholder="0.00"></label>
                <label style="margin: 5px 0">抑揚：<input type="number" style="font-size: 18px;width:4.5rem;" id="mod_voicevox_param_intonationScale" value="1.00" min="0" max="2.00" step="0.01" placeholder="1.00"></label>
                <label style="margin: 5px 0">音量：<input type="number" style="font-size: 18px;width:4.5rem;" id="mod_voicevox_param_volumeScale" value="1.00" min="0" max="2.00" step="0.01" placeholder="1.00"></label>
                <label style="margin: 5px 0">開始：<input type="number" style="font-size: 18px;width:4.5rem;" id="mod_voicevox_param_prePhonemeLength" value="0.10" min="0" max="1.50" step="0.01" placeholder="0.10"></label>
                <label style="margin: 5px 0">終了：<input type="number" style="font-size: 18px;width:4.5rem;" id="mod_voicevox_param_postPhonemeLength" value="0.10" min="0" max="1.50" step="0.01" placeholder="0.10"></label><br>
                <button id="mod_voicevox_param_reset_button"s style="margin-top:0.5rem">リセット</button>
                <div>
                    <input type="text" id="mod_voicevox_param_preset_name" style="margin-top:1rem" placeholder="プリセット名">
                    <button id="mod_voicevox_param_preset_button"s style="margin-left: 1rem;margin-top:1rem">現在のパラメータでプリセットを作成/更新</button>
                    <button id="mod_voicevox_param_preset_delete_button"s style="margin-left: 1rem;margin-top:1rem">現在のプリセットを削除</button>
                </div>
            </dd>
        </dl>
        <label>無視パターン
            <span id="tooltips">
	        <span id="help_mod_voicevox_ignore" data-text="正規表現可・&lt;&lt;|&gt;&gt;で区切って複数パターン指定可・改行のマッチは正規表現を使用してください。">
	            <img src="images/icon_popup.png" width="20" height="20" id="help_mod_voicevox_ignore_icon" class="help_popup" style="margin-left: 10px; margin-top: -5px; vertical-align:middle;" aria-describedby="tooltip_mod_voicevox_ignore" onclick="return false;"></span>
            </span>
        </label><br>
        <input type="text" style="font-size: 18px; width: 20rem;" id="mod_voicevox_ignore_pattern" value="${pref.ignore_pattern}" placeholder="例：送信文【】<<|>>『[^』]+?』"><br>
        <label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);margin-top: 1.5rem;" id="mod_voicevox_read_back" ` + (pref.read_back ? 'checked' : '') + `><span class="explanations">　出力文に加えて、指定した文字列が現れるまで遡った部分を含めて読み上げ</span></label><br>
        <div>遡って読むの際の区切り文字列
            <span id="tooltips">
	        <span id="help_mod_voicevox_split" data-text="&lt;|&gt;で区切って複数の文字列を指定可・最も出力文から距離が近いものを使います。&lt;br&gt;出力の先頭が区切り文字列だった場合、その先だけが読み上げ対象になります。">
	            <img src="images/icon_popup.png" width="20" height="20" id="help_mod_voicevox_split_icon" class="help_popup" style="margin-left: 10px; margin-top: -5px; vertical-align:middle;" aria-describedby="tooltip_mod_voicevox_split" onclick="return false;"></span>
            </span>
        </div>
        <input type="text" style="font-size: 18px; width: 20rem;" id="mod_voicevox_read_back_pattern" value="${pref.read_back_pattern}" placeholder="例：<br><<|>>。<<|>>「"><br>
        <label><input type="checkbox" style="font-size: 18px; transform:scale(1.5);margin-top: 1.5rem;" id="mod_voicevox_part_voice" ` + (pref.part_voice ? 'checked' : '') + `><span class="explanations">　特殊なスクリプトによるパート別音声を有効にする</span></label><br>
        <h5 style="margin: 0;line-height: initial;">パート別音声について</h5>
        <div style="margin-top: 0;padding: 5px;line-height: initial;">
          スクリプトの設定で、種別が「使用しない」になっており、INの先頭が「(?:VOICEVOX:ID){0}」となっているものを特殊なスクリプトとみなして、それに一致する部分の再生ボイスをスクリプト中のIDにしたがって変更します。<br>
          例えば「ずんだもん：『セリフ』」というテキストの「セリフ」という部分を「ずんだもん - ノーマル (ID:3)」で読み上げさせたければ、次のように設定します。<br>
          <div style="padding:5px 10px">種別: 使用しない<br>
          IN: (?:VOICEVOX:3){0}ずんだもん：『([^』]+?)』<br>
          OUT: $1</div>
          ※「ID:**」の部分は「ID:p1」(プリセットの場合)、「ID:1-2」(複数ホストの場合)などの種類があります。
        </div>
    </div>
  </dd>
</dl>
    `)
    // メニュー開閉
    window.jQuery('#mod_voicevox_menu').on('click', function() {
		window.jQuery(this).next().slideToggle('fast')
	})
    window.jQuery('#mod_voicevox_param_area_title').on('click', function() {
		window.jQuery(this).next().slideToggle('fast')
	})
    // ヘルプのポップアップ
    window.jQuery("#help_mod_voicevox, #help_mod_voicevox_ignore, #help_mod_voicevox_split, #help_mod_voicevox_param").on({
        'mouseenter': function () {
            const $ = window.jQuery
            var text = $(this).attr('data-text');
            $(this).append('<div class="tooltips_body">' + text + '</div>');
        },
        'mouseleave': function () {
            window.jQuery(this).find(".tooltips_body").remove();
        }
    })

    // 設定変更イベント
    const mod_voicevox = document.getElementById('mod_voicevox')
    if (mod_voicevox) {
        mod_voicevox.addEventListener('change', function() {
            if (this.checked) {
                pref.voicevox = true
            } else {
                pref.voicevox = false
            }
            savePref()
        })
    }
    const mod_voicevox_hotkey = document.getElementById('mod_voicevox_hotkey')
    if (mod_voicevox_hotkey) {
        mod_voicevox_hotkey.addEventListener('change', function() {
            if (this.checked) {
                pref.hotkey = true
            } else {
                pref.hotkey = false
            }
            savePref()
        })
    }
    const mod_voicevox_style = document.getElementById('mod_voicevox_style')
    if (mod_voicevox_style) {
        mod_voicevox_style.addEventListener('change', function() {
            if (this.value !== '') {
                pref.style = this.value
                savePref()
                initStyle(pref.style)
            }
        })
    }
    const mod_voicevox_host = document.getElementById('mod_voicevox_host')
    if (mod_voicevox_host) {
        mod_voicevox_host.addEventListener('change', function() {
            if (this.value !== '') {
                pref.host = this.value
                savePref()
            }
        })
    }
    const mod_voicevox_volume = document.getElementById('mod_voicevox_volume')
    if (mod_voicevox_volume) {
        mod_voicevox_volume.addEventListener('change', function() {
            if (this.value !== '') {
                pref.volume = Number(this.value)
                savePref()
                audio.volume = pref.volume / 100
            }
        })
    }
    const mod_voicevox_ignore_pattern = document.getElementById('mod_voicevox_ignore_pattern')
    if (mod_voicevox_ignore_pattern) {
        mod_voicevox_ignore_pattern.addEventListener('change', function() {
            pref.ignore_pattern = this.value
            savePref()
        })
    }
    const mod_voicevox_read_back = document.getElementById('mod_voicevox_read_back')
    if (mod_voicevox_read_back) {
        mod_voicevox_read_back.addEventListener('change', function() {
            if (this.checked) {
                pref.read_back = true
            } else {
                pref.read_back = false
            }
            savePref()
        })
    }
    const mod_voicevox_read_back_pattern = document.getElementById('mod_voicevox_read_back_pattern')
    if (mod_voicevox_read_back_pattern) {
        mod_voicevox_read_back_pattern.addEventListener('change', function() {
            pref.read_back_pattern = this.value
            savePref()
        })
    }
    const mod_voicevox_part_voice = document.getElementById('mod_voicevox_part_voice')
    if (mod_voicevox_part_voice) {
        mod_voicevox_part_voice.addEventListener('change', function() {
            if (this.checked) {
                pref.part_voice = true
            } else {
                pref.part_voice = false
            }
            savePref()
        })
    }
    const mod_voicevox_style_button = document.getElementById('mod_voicevox_style_button')
    const setStyleSelectList = async function (select_style = undefined, host = undefined, is_preset = true) {
        if (!pref.voicevox && !pref.hotkey) {
            return
        }
        if (mod_voicevox_style) {
            const list = await getStyleList()
            let select_value = ''
            mod_voicevox_style.innerHTML = list.map(x => {
                if (typeof x === 'object') {
                    let checked = ''
                    if (select_style) {
                        select_style = '' + select_style
                        if (host) {
                            if (x.style_id) {
                                checked = ((is_preset && x.raw_id === select_style && x.host === host)? ' selected': '')
                            } else {
                                checked = ((!is_preset && x.raw_id === select_style && x.host === host)? ' selected': '')
                            }
                        } else {
                            checked = (x.id === select_style ? ' selected': '')
                        }
                        if (checked !== '') {
                            select_value = x.id
                        }
                    } else {
                        checked = (x.id === pref.style ? ' selected': '')
                    }
                    if (x.style_id) {
                        const baseVoice = list.find(v => (!v.style_id && v.uuid === x.uuid && v.raw_id === x.style_id))
                        return `<option value="${htmlEscape(x.id)}"${checked} data-id="${htmlEscape(x.style_id)}" data-raw-id="${htmlEscape(x.raw_id)}" data-host="${htmlEscape(x.host)}" data-uuid="${htmlEscape(x.uuid)}" data-params="${htmlEscape(x.params)}" data-name="${htmlEscape(x.name)}">${htmlEscape(x.name)} ${baseVoice ? '(' + htmlEscape(baseVoice.name) + ')' : ''}(ID:${htmlEscape(x.id)})</option>`
                    } else {
                        return `<option value="${htmlEscape(x.id)}"${checked} data-raw-id="${htmlEscape(x.raw_id)}" data-host="${htmlEscape(x.host)}" data-uuid="${htmlEscape(x.uuid)}">${htmlEscape(x.name)} (ID:${htmlEscape(x.id)})</option>`
                    }
                }
                return `<option disabled>${x}</option>`
            }).join('')
            if (select_value) {
                mod_voicevox_style.value = select_value
                mod_voicevox_style.dispatchEvent(new Event('change'))
            }
            if (mod_voicevox_style.value !== '') {
                initStyle(mod_voicevox_style.value)
            }
        }
    }
    if (mod_voicevox_style_button) {
        mod_voicevox_style_button.addEventListener('click', function () {
            setStyleSelectList()
        })
        setStyleSelectList()
    }
    const mod_voicevox_param_reset_button = document.getElementById('mod_voicevox_param_reset_button')
    if (mod_voicevox_param_reset_button) {
        mod_voicevox_param_reset_button.addEventListener('click', function () {
            if (window.confirm('パラメータの各値を初期値に戻しますか？')) {
                for (const param of [['speedScale', 1], ['pitchScale', 0], ['intonationScale', 1], ['volumeScale', 1], ['prePhonemeLength', 0.1], ['postPhonemeLength', 0.1]]) {
                    const elem = document.getElementById('mod_voicevox_param_' + param[0])
                    if (elem) {
                        elem.value = param[1]
                    }
                }
            }
        })
    }
    const mod_voicevox_param_preset_button = document.getElementById('mod_voicevox_param_preset_button'),
          mod_voicevox_param_preset_name = document.getElementById('mod_voicevox_param_preset_name')
    if (mod_voicevox_param_preset_button && mod_voicevox_param_preset_name && mod_voicevox_style) {
        mod_voicevox_param_preset_button.addEventListener('click', function () {
            if (mod_voicevox_param_preset_name.value === '') {
                window.alert('プリセット名を入力してください')
                return
            }
            const info = getStyle(mod_voicevox_style.value)
            if (!info) {
                window.alert('ボイス情報が取得できませんでした')
                return
            }
            const params = new Params()
            if (info.preset_id) {
                if (!window.confirm(`現在選択中のプリセット：${info.name}(ID:${mod_voicevox_style.value})を以下のデータで更新します。
よろしいですか？

名前：${mod_voicevox_param_preset_name.value}
話速：${params.speedScale}
音高：${params.pitchScale}
抑揚：${params.intonationScale}
音量：${params.volumeScale}
開始：${params.prePhonemeLength}
終了：${params.postPhonemeLength}
`)) {
                    return
                }
            } else {
                if (!window.confirm(`新規プリセットを以下のデータで追加します。
よろしいですか？

名前：${mod_voicevox_param_preset_name.value}
話速：${params.speedScale}
音高：${params.pitchScale}
抑揚：${params.intonationScale}
音量：${params.volumeScale}
開始：${params.prePhonemeLength}
終了：${params.postPhonemeLength}
`)) {
                    return
                }
            }
            let promise
            if (info.preset_id) {
                promise = updatePreset(info.host, info.preset_id, mod_voicevox_param_preset_name.value, info.uuid, info.style_id, params)
            } else {
                promise = addPreset(info.host, mod_voicevox_param_preset_name.value, info.uuid, info.style_id, params)
            }
            promise.then(preset_id => {
                setStyleSelectList(preset_id, info.host)
            })
        })
    }
    const mod_voicevox_param_preset_delete_button = document.getElementById('mod_voicevox_param_preset_delete_button')
    if (mod_voicevox_param_preset_delete_button && mod_voicevox_style) {
        mod_voicevox_param_preset_delete_button.addEventListener('click', function () {
            const info = getStyle(mod_voicevox_style.value)
            if (!info) {
                window.alert('ボイス情報が取得できませんでした')
                return
            }
            if (!info.preset_id) {
                window.alert('選択中のボイスはプリセットではありません')
                return
            }
            if (!window.confirm(`現在選択中のプリセット：${info.name}(ID:${mod_voicevox_style.value})を削除します。
よろしいですか？`)) {
                return
            }
            deletePreset(info.host, info.preset_id).then(preset_id => {
                setStyleSelectList()
            })
        })
    }
    // 選択テキストを読み上げ
    document.getElementById('data_container').addEventListener('keyup', function (event) {
        if (event.isComposing || event.keyCode === 229) {
            return;
        }
        if (!(event.altKey && event.ctrlKey && event.code === 'KeyV')) {
            return
        }
        const selection = document.getSelection()
        if (pref.hotkey) {
            speechVoiceVox(selection.toString())
        }
    })
})();