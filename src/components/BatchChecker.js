import React, { useState } from 'react';
import { checkBatch, RISK_STYLES } from '../services/CopyrightService';

const TYPES = [
  { key: 'text', label: '텍스트' },
  { key: 'image', label: '이미지' },
  { key: 'audio', label: '음악' },
  { key: 'video', label: '영상' },
  { key: 'code', label: '코드' },
];

const emptyRow = () => ({ type: 'text', label: '', content: '' });

const BatchChecker = () => {
  const [rows, setRows] = useState([emptyRow(), emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const updateRow = (i, patch) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const items = rows
      .filter((r) => r.content.trim())
      .map((r) => ({ type: r.type, content: r.content, label: r.label || undefined }));
    if (items.length === 0) {
      setError('검사할 내용을 한 개 이상 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const data = await checkBatch({ items });
      setReport(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || '서버 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      <div className="bg-white rounded shadow p-5">
        <h2 className="text-xl font-bold text-gray-800 mb-1">일괄 저작권 검사</h2>
        <p className="text-sm text-gray-600">
          여러 콘텐츠를 한 번에 검사합니다. 최대 50개까지 지원합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-5 space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-start border-b border-gray-100 pb-3">
            <select
              value={row.type}
              onChange={(e) => updateRow(i, { type: e.target.value })}
              className="border border-gray-300 rounded p-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={row.label}
              onChange={(e) => updateRow(i, { label: e.target.value })}
              placeholder="라벨(선택)"
              className="border border-gray-300 rounded p-2 text-sm w-28"
            />
            <input
              type="text"
              value={row.content}
              onChange={(e) => updateRow(i, { content: e.target.value })}
              placeholder="검사할 내용 / 지문"
              className="border border-gray-300 rounded p-2 text-sm flex-1 min-w-[200px]"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
              className="px-2 py-2 text-sm text-red-600 disabled:opacity-30"
            >
              삭제
            </button>
          </div>
        ))}
        <div className="flex justify-between">
          <button type="button" onClick={addRow} className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
            + 행 추가
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-gray-800 text-white text-sm font-medium disabled:opacity-40">
            {loading ? '검사 중…' : '일괄 검사'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>
      )}

      {report && (
        <div className="bg-white rounded shadow p-5 space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-gray-100">총 {report.total}</span>
            {Object.entries(report.counts).map(([k, v]) => (
              <span key={k} className={`px-2 py-1 rounded border ${(RISK_STYLES[k] || { className: 'bg-gray-100 text-gray-700 border-gray-300' }).className}`}>
                {k}: {v}
              </span>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">라벨</th>
                  <th className="py-2 pr-3">유형</th>
                  <th className="py-2 pr-3">위험</th>
                  <th className="py-2 pr-3">최상위 일치</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => {
                  const style = RISK_STYLES[r.overallRisk] || RISK_STYLES.SAFE;
                  const top = r.matches && r.matches[0];
                  return (
                    <tr key={r.index} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3 text-gray-500">{r.index + 1}</td>
                      <td className="py-2 pr-3 text-gray-700">{r.label || '-'}</td>
                      <td className="py-2 pr-3 text-gray-700">{r.type || '-'}</td>
                      <td className="py-2 pr-3">
                        {r.error ? (
                          <span className="text-red-600 text-xs">{r.error}</span>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${style.className}`}>{style.label}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-700">
                        {top ? `${top.title} (${(top.score * 100).toFixed(0)}%)` : '없음'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchChecker;
