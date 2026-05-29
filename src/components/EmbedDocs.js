import React, { useEffect, useState } from 'react';

const WIDGET_SRC = (process.env.REACT_APP_COPYRIGHT_API
  ? process.env.REACT_APP_COPYRIGHT_API.replace(/\/api\/copyright$/, '')
  : 'http://localhost:4000') + '/embed/copyright-widget.js';

const snippetBasic = `<!-- 호스트 사이트에 한 줄 삽입 -->
<div data-aicw-widget
     data-api-key="YOUR_API_KEY"
     data-types="video,image,audio"
     data-block-on-high-risk="true"></div>
<script src="https://YOUR_HOST/embed/copyright-widget.js"></script>`;

const snippetJs = `<script src="https://YOUR_HOST/embed/copyright-widget.js"></script>
<script>
  AICopyrightWidget.init({
    target: '#my-container',
    apiKey: 'YOUR_API_KEY',
    types: ['video', 'image', 'audio'],
    blockOnHighRisk: true,
  });

  document.addEventListener('aicw:passed', function (e) {
    console.log('통과:', e.detail.result);
    // 업로드 버튼 활성화 등
  });
  document.addEventListener('aicw:blocked', function (e) {
    console.warn('차단:', e.detail.result);
  });
</script>`;

const Code = ({ children }) => (
  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
    <code>{children}</code>
  </pre>
);

const EmbedDocs = () => {
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (document.getElementById('aicw-widget-script')) {
      if (window.AICopyrightWidget) window.AICopyrightWidget.init();
      return;
    }
    const s = document.createElement('script');
    s.id = 'aicw-widget-script';
    s.src = WIDGET_SRC;
    s.async = true;
    document.body.appendChild(s);
  }, []);
  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      <div className="bg-white rounded shadow p-5">
        <h2 className="text-xl font-bold text-gray-800 mb-1">임베드 위젯 통합 가이드</h2>
        <p className="text-sm text-gray-600">
          외부 영상 플랫폼이 자기 페이지에 본 시스템의 저작권 검사 모듈을 삽입할 수 있습니다.
          <code className="ml-1 px-1 bg-gray-100 text-xs">script</code> 태그 한 줄 + 컨테이너 div만 있으면 동작합니다.
        </p>
      </div>

      <div className="bg-white rounded shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">1. 가장 간단한 통합 (data-attribute 방식)</h3>
          <button
            onClick={() => copy('basic', snippetBasic)}
            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            {copied === 'basic' ? '복사됨' : '복사'}
          </button>
        </div>
        <Code>{snippetBasic}</Code>
        <p className="text-xs text-gray-500">
          페이지 로드 시 <code>data-aicw-widget</code> 속성이 붙은 모든 컨테이너에 위젯이 자동 주입됩니다.
        </p>
      </div>

      <div className="bg-white rounded shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">2. 프로그래밍 방식 (JS 이벤트 수신 포함)</h3>
          <button
            onClick={() => copy('js', snippetJs)}
            className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            {copied === 'js' ? '복사됨' : '복사'}
          </button>
        </div>
        <Code>{snippetJs}</Code>
        <p className="text-xs text-gray-500">
          <strong>이벤트</strong> — <code>aicw:result</code> · <code>aicw:passed</code> · <code>aicw:blocked</code>.
          호스트 사이트는 이를 받아 업로드 버튼 활성화/차단을 제어합니다.
        </p>
      </div>

      <div className="bg-white rounded shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-2">설정 옵션</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="py-1 pr-3">속성 / JS 옵션</th>
              <th className="py-1 pr-3">설명</th>
              <th className="py-1">기본값</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <tr className="border-b"><td className="py-1 pr-3"><code>data-api-key</code></td><td>발급받은 API 키</td><td>(없음, 익명 호출은 제한)</td></tr>
            <tr className="border-b"><td className="py-1 pr-3"><code>data-api-base</code></td><td>백엔드 API 베이스 URL</td><td>위젯 스크립트의 origin</td></tr>
            <tr className="border-b"><td className="py-1 pr-3"><code>data-types</code></td><td>표시할 콘텐츠 탭 (쉼표 구분)</td><td><code>video,image,audio,text,code</code></td></tr>
            <tr className="border-b"><td className="py-1 pr-3"><code>data-title</code></td><td>위젯 제목</td><td>AI 콘텐츠 저작권 검사</td></tr>
            <tr><td className="py-1 pr-3"><code>data-block-on-high-risk</code></td><td>HIGH 위험 시 차단 메시지 표시 + blocked 이벤트</td><td><code>false</code></td></tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-2">실시간 데모</h3>
        <p className="text-xs text-gray-500 mb-2">
          백엔드가 실행 중일 때(<code>npm run server</code>) <a className="text-indigo-600 underline" href="http://localhost:4000/embed/demo.html" target="_blank" rel="noreferrer">/embed/demo.html</a>에서 호스트 사이트 시뮬레이션을 확인할 수 있습니다.
        </p>
        <div className="border border-gray-200 rounded p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">이 페이지 내부에 실제 위젯을 임베드한 모습 ↓</p>
          <div
            id="aicw-demo-host"
            data-aicw-widget
            data-api-key="embed-test-key-001"
            data-api-base="http://localhost:4000"
            data-types="video,image,text"
            data-title="라이브 임베드 미리보기"
            data-block-on-high-risk="true"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          ※ 위 미리보기는 <code>copyright-widget.js</code>가 로드되어야 동작합니다. 백엔드를 켜고 새로고침해 보세요.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-900">
        <strong>API 키 발급</strong> — 데모용으로 <code>embed-test-key-001</code>, <code>demo-key-public-2025</code> 두 키가 준비되어 있습니다.
        실제 서비스에서는 <code>server/data/apiKeys.json</code>을 DB로 교체하고 분당 호출 제한을 사용처별로 설정하세요.
      </div>
    </div>
  );
};

export default EmbedDocs;
