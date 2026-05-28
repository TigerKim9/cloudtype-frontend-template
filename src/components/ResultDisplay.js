import React, { useState } from 'react';
import { RISK_STYLES } from '../services/CopyrightService';

const RiskBadge = ({ risk }) => {
  const style = RISK_STYLES[risk] || RISK_STYLES.SAFE;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${style.className}`}>
      위험 {style.label}
    </span>
  );
};

const ResultDisplay = ({ result }) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;
  const overall = RISK_STYLES[result.overallRisk] || RISK_STYLES.SAFE;

  const handleCopy = async () => {
    if (!result.attribution) return;
    try {
      await navigator.clipboard.writeText(result.attribution);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-white rounded shadow p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">검사 결과</h3>
        <div className={`px-3 py-1 rounded border font-semibold ${overall.className}`}>
          종합 위험도: {overall.label}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        검사 시각: {new Date(result.checkedAt).toLocaleString()} · 일치 항목 {result.matchCount}건
        {result.file && (
          <span className="ml-2 text-gray-500">
            · 파일: {result.file.name} ({Math.round(result.file.size / 1024)} KB)
          </span>
        )}
      </div>

      {result.derivedContent && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs font-mono break-all text-gray-700">
          <strong className="block mb-1 font-sans text-sm not-italic">추출된 지문</strong>
          {result.derivedContent}
        </div>
      )}

      <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
        <strong className="block mb-1">권장 조치</strong>
        {result.suggestion}
      </div>

      {result.attribution && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong className="block mb-1">저작자 표시 (자동 생성)</strong>
              {result.attribution}
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-1 text-xs rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            >
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
      )}

      {result.matches.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">제목</th>
                <th className="py-2 pr-3">저자</th>
                <th className="py-2 pr-3">연도</th>
                <th className="py-2 pr-3">라이선스</th>
                <th className="py-2 pr-3">유사도</th>
                <th className="py-2 pr-3">위험</th>
              </tr>
            </thead>
            <tbody>
              {result.matches.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-mono text-xs text-gray-500">{m.id}</td>
                  <td className="py-2 pr-3 font-medium text-gray-800">{m.title}</td>
                  <td className="py-2 pr-3 text-gray-700">{m.author}</td>
                  <td className="py-2 pr-3 text-gray-700">{m.year}</td>
                  <td className="py-2 pr-3 text-gray-700">{m.license}</td>
                  <td className="py-2 pr-3 text-gray-800 font-mono">{(m.score * 100).toFixed(1)}%</td>
                  <td className="py-2 pr-3"><RiskBadge risk={m.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
