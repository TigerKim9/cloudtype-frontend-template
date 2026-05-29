(function () {
  'use strict';

  var NS = 'aicw';
  var STYLE_ID = NS + '-styles';

  var SCRIPT = document.currentScript;
  var DEFAULTS = {
    apiBase: (SCRIPT && SCRIPT.getAttribute('data-api-base')) ||
      (SCRIPT && SCRIPT.src ? SCRIPT.src.replace(/\/embed\/.*$/, '') : 'http://localhost:4000'),
    apiKey: (SCRIPT && SCRIPT.getAttribute('data-api-key')) || '',
    target: (SCRIPT && SCRIPT.getAttribute('data-target')) || '',
    types: (SCRIPT && SCRIPT.getAttribute('data-types')) || 'video,image,audio,text,code',
    title: (SCRIPT && SCRIPT.getAttribute('data-title')) || 'AI 콘텐츠 저작권 검사',
    blockOnHighRisk: (SCRIPT && SCRIPT.getAttribute('data-block-on-high-risk')) === 'true',
  };

  var TYPE_LABEL = {
    text: '텍스트',
    image: '이미지',
    audio: '음악',
    video: '영상',
    code: '코드',
  };

  var RISK_COLOR = {
    SAFE: { bg: '#dcfce7', fg: '#166534', label: '안전' },
    LOW: { bg: '#dbeafe', fg: '#1e40af', label: '낮음' },
    MEDIUM: { bg: '#fef3c7', fg: '#92400e', label: '중간' },
    HIGH: { bg: '#fee2e2', fg: '#991b1b', label: '높음' },
  };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.' + NS + '-root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1f2937;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;max-width:520px;box-shadow:0 1px 3px rgba(0,0,0,.08);box-sizing:border-box}' +
      '.' + NS + '-root *{box-sizing:border-box}' +
      '.' + NS + '-title{font-size:16px;font-weight:700;margin:0 0 4px 0}' +
      '.' + NS + '-sub{font-size:12px;color:#6b7280;margin:0 0 12px 0}' +
      '.' + NS + '-tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}' +
      '.' + NS + '-tab{font-size:12px;padding:4px 10px;border:1px solid #d1d5db;border-radius:999px;background:#fff;color:#374151;cursor:pointer}' +
      '.' + NS + '-tab.active{background:#111827;color:#fff;border-color:#111827}' +
      '.' + NS + '-drop{border:2px dashed #d1d5db;border-radius:6px;padding:20px;text-align:center;cursor:pointer;font-size:13px;color:#6b7280}' +
      '.' + NS + '-drop.over{background:#f9fafb;border-color:#6366f1}' +
      '.' + NS + '-textarea{width:100%;min-height:90px;padding:8px;font-size:13px;border:1px solid #d1d5db;border-radius:6px;resize:vertical;font-family:inherit}' +
      '.' + NS + '-input{width:100%;padding:8px;font-size:13px;border:1px solid #d1d5db;border-radius:6px;font-family:inherit}' +
      '.' + NS + '-btn{margin-top:10px;width:100%;padding:8px 12px;background:#111827;color:#fff;border:0;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer}' +
      '.' + NS + '-btn:disabled{opacity:.5;cursor:not-allowed}' +
      '.' + NS + '-result{margin-top:12px;padding:10px;border-radius:6px;font-size:13px}' +
      '.' + NS + '-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}' +
      '.' + NS + '-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}' +
      '.' + NS + '-attr{margin-top:8px;padding:8px;background:#eef2ff;color:#3730a3;border-radius:6px;font-size:12px}' +
      '.' + NS + '-match{margin-top:6px;font-size:12px;color:#374151;padding:4px 0;border-top:1px solid #f3f4f6}' +
      '.' + NS + '-error{margin-top:10px;padding:8px;background:#fee2e2;color:#991b1b;border-radius:6px;font-size:12px}' +
      '.' + NS + '-foot{margin-top:8px;font-size:10px;color:#9ca3af;text-align:right}' +
      '.' + NS + '-blocked{margin-top:10px;padding:8px;background:#fee2e2;color:#991b1b;border-radius:6px;font-size:12px;font-weight:600}';
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      children.forEach(function (c) { if (c) node.appendChild(c); });
    }
    return node;
  }

  function fmtScore(s) { return (s * 100).toFixed(1) + '%'; }

  function dispatch(host, name, detail) {
    host.dispatchEvent(new CustomEvent('aicw:' + name, { detail: detail, bubbles: true }));
  }

  function render(host, opts) {
    var state = {
      type: opts.types[0],
      content: '',
      file: null,
      loading: false,
      result: null,
      error: null,
    };

    var root = el('div', { class: NS + '-root' });
    root.appendChild(el('p', { class: NS + '-title', text: opts.title }));
    root.appendChild(el('p', { class: NS + '-sub', text: '업로드 전 AI 콘텐츠의 저작권 위험을 확인하세요.' }));

    var tabs = el('div', { class: NS + '-tabs' });
    var bodyArea = el('div');
    var resultArea = el('div');

    function setType(t) {
      state.type = t;
      state.content = '';
      state.file = null;
      state.result = null;
      state.error = null;
      drawTabs();
      drawBody();
      drawResult();
    }

    function drawTabs() {
      tabs.innerHTML = '';
      opts.types.forEach(function (t) {
        var b = el('button', {
          class: NS + '-tab' + (state.type === t ? ' active' : ''),
          type: 'button',
          onclick: function () { setType(t); },
          text: TYPE_LABEL[t] || t,
        });
        tabs.appendChild(b);
      });
    }

    function drawBody() {
      bodyArea.innerHTML = '';
      var t = state.type;
      var fileTypes = (t === 'image' || t === 'audio' || t === 'video');

      if (fileTypes) {
        var drop = el('div', {
          class: NS + '-drop',
          text: state.file ? state.file.name + ' (' + Math.round(state.file.size / 1024) + ' KB)' : '파일을 끌어다 놓거나 클릭하여 선택',
        });
        var input = el('input', {
          type: 'file',
          accept: t === 'image' ? 'image/*' : (t === 'audio' ? 'audio/*' : 'video/*'),
          style: 'display:none',
        });
        input.addEventListener('change', function (e) {
          state.file = e.target.files[0] || null;
          drawBody();
        });
        drop.addEventListener('click', function () { input.click(); });
        drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add(NS + '-drop-over'); drop.classList.add('over'); });
        drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
        drop.addEventListener('drop', function (e) {
          e.preventDefault();
          drop.classList.remove('over');
          state.file = e.dataTransfer.files[0] || null;
          drawBody();
        });
        bodyArea.appendChild(drop);
        bodyArea.appendChild(input);
      } else {
        var ta = el(t === 'code' || t === 'text' ? 'textarea' : 'input', {
          class: t === 'code' || t === 'text' ? NS + '-textarea' : NS + '-input',
          placeholder: t === 'code' ? 'AI가 생성한 코드…' : 'AI가 생성한 텍스트…',
        });
        ta.value = state.content;
        ta.addEventListener('input', function (e) { state.content = e.target.value; });
        bodyArea.appendChild(ta);
      }

      var btn = el('button', {
        class: NS + '-btn',
        type: 'button',
        text: state.loading ? '검사 중…' : '저작권 검사',
        onclick: runCheck,
      });
      if (state.loading) btn.disabled = true;
      bodyArea.appendChild(btn);
    }

    function drawResult() {
      resultArea.innerHTML = '';
      if (state.error) {
        resultArea.appendChild(el('div', { class: NS + '-error', text: state.error }));
        return;
      }
      if (!state.result) return;
      var r = state.result;
      var color = RISK_COLOR[r.overallRisk] || RISK_COLOR.SAFE;

      var box = el('div', {
        class: NS + '-result',
        style: 'background:' + color.bg + ';color:' + color.fg,
      });
      var head = el('div', { class: NS + '-row' });
      head.appendChild(el('strong', { text: '검사 결과' }));
      head.appendChild(el('span', {
        class: NS + '-badge',
        style: 'background:' + color.fg + ';color:#fff',
        text: '위험 ' + color.label,
      }));
      box.appendChild(head);
      box.appendChild(el('div', { style: 'font-size:12px', text: r.suggestion }));

      (r.matches || []).slice(0, 3).forEach(function (m) {
        var line = el('div', { class: NS + '-match' });
        line.appendChild(el('strong', { text: m.title }));
        line.appendChild(document.createTextNode(' — ' + m.author + ' · ' + m.license + ' · ' + fmtScore(m.score)));
        box.appendChild(line);
      });

      resultArea.appendChild(box);

      if (r.attribution) {
        resultArea.appendChild(el('div', { class: NS + '-attr', text: '저작자 표시: ' + r.attribution }));
      }

      if (opts.blockOnHighRisk && r.overallRisk === 'HIGH') {
        resultArea.appendChild(el('div', { class: NS + '-blocked', text: '⚠ 업로드 차단됨: 침해 위험이 높습니다.' }));
        dispatch(host, 'blocked', { result: r });
      } else {
        dispatch(host, 'passed', { result: r });
      }
    }

    function runCheck() {
      state.loading = true;
      state.error = null;
      state.result = null;
      drawBody();
      drawResult();

      var headers = {};
      if (opts.apiKey) headers['X-API-Key'] = opts.apiKey;

      var fileTypes = (state.type === 'image' || state.type === 'audio' || state.type === 'video');
      var promise;
      if (fileTypes) {
        if (!state.file) {
          state.loading = false;
          state.error = '파일을 선택해 주세요.';
          drawBody(); drawResult();
          return;
        }
        var form = new FormData();
        form.append('type', state.type);
        form.append('file', state.file);
        promise = fetch(opts.apiBase + '/api/copyright/upload', {
          method: 'POST', headers: headers, body: form,
        });
      } else {
        if (!state.content.trim()) {
          state.loading = false;
          state.error = '내용을 입력해 주세요.';
          drawBody(); drawResult();
          return;
        }
        headers['Content-Type'] = 'application/json';
        promise = fetch(opts.apiBase + '/api/copyright/check', {
          method: 'POST', headers: headers,
          body: JSON.stringify({ type: state.type, content: state.content, source: 'embed-widget' }),
        });
      }

      promise
        .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, body: j }; }); })
        .then(function (r) {
          state.loading = false;
          if (!r.ok) {
            state.error = (r.body && r.body.error) || ('HTTP ' + r.body);
          } else {
            state.result = r.body;
            dispatch(host, 'result', { result: r.body });
          }
          drawBody(); drawResult();
        })
        .catch(function (err) {
          state.loading = false;
          state.error = err.message || '요청 실패';
          drawBody(); drawResult();
        });
    }

    drawTabs();
    drawBody();
    root.appendChild(tabs);
    root.appendChild(bodyArea);
    root.appendChild(resultArea);
    root.appendChild(el('div', { class: NS + '-foot', text: 'Powered by AI Copyright API' }));

    host.innerHTML = '';
    host.appendChild(root);
  }

  function init(options) {
    injectStyles();
    var opts = Object.assign({}, DEFAULTS, options || {});
    opts.types = String(opts.types || 'video,image,audio,text,code').split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    var hosts;
    if (options && options.target) {
      hosts = typeof options.target === 'string' ? document.querySelectorAll(options.target) : [options.target];
    } else if (opts.target) {
      hosts = document.querySelectorAll(opts.target);
    } else {
      hosts = document.querySelectorAll('[data-aicw-widget]');
    }
    hosts.forEach(function (h) {
      var perHost = Object.assign({}, opts);
      ['api-base', 'api-key', 'types', 'title', 'block-on-high-risk'].forEach(function (k) {
        var v = h.getAttribute('data-' + k);
        if (v != null) {
          var key = k.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
          if (k === 'block-on-high-risk') perHost.blockOnHighRisk = v === 'true';
          else perHost[key] = v;
        }
      });
      if (typeof perHost.types === 'string') {
        perHost.types = perHost.types.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      }
      render(h, perHost);
    });
  }

  window.AICopyrightWidget = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();
