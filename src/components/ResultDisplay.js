import React from 'react';
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
  if (!result) return null;

  const overall = RISK_STYLES[result.overallRisk] || RISK_STYLES.SAFE;

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
      </div>

      <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
        <strong className="block mb-1">권장 조치</strong>
        {result.suggestion}
      </div>

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
