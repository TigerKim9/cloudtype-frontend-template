import React, { useEffect, useState } from 'react';
import { fetchHistory, clearHistory, fetchStats, RISK_STYLES } from '../services/CopyrightService';

const TYPE_LABEL = { text: '텍스트', image: '이미지', audio: '음악', code: '코드' };

const StatCard = ({ label, value, tone = 'gray' }) => {
  const toneCls = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  }[tone];
  return (
    <div className={`p-3 rounded ${toneCls}`}>
      <div className="text-xs opacity-75">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([fetchHistory(), fetchStats()]);
      setItems(list);
      setStats(s);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || '서버 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    if (!window.confirm('이력을 모두 삭제할까요?')) return;
    await clearHistory();
    load();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">
      <div className="bg-white rounded shadow p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">검사 이력</h2>
          <p className="text-sm text-gray-600">최근 검사한 콘텐츠와 위험도 통계를 확인할 수 있습니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">새로고침</button>
          <button onClick={handleClear} className="px-3 py-1.5 rounded border border-red-300 text-sm text-red-700 hover:bg-red-50">전체 삭제</button>
        </div>
      </div>

      {stats && (
        <div className="bg-white rounded shadow p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">통계</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="총 검사" value={stats.total} />
            <StatCard label="안전" value={stats.byRisk.SAFE} tone="green" />
            <StatCard label="낮음" value={stats.byRisk.LOW} tone="blue" />
            <StatCard label="중간" value={stats.byRisk.MEDIUM} tone="yellow" />
            <StatCard label="높음" value={stats.byRisk.HIGH} tone="red" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>
      )}

      <div className="bg-white rounded shadow p-5">
        {loading ? (
          <p className="text-sm text-gray-500">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">아직 검사 이력이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">시각</th>
                  <th className="py-2 pr-3">유형</th>
                  <th className="py-2 pr-3">소스</th>
                  <th className="py-2 pr-3">내용 미리보기</th>
                  <th className="py-2 pr-3">위험</th>
                  <th className="py-2 pr-3">최상위 일치</th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => {
                  const style = RISK_STYLES[h.overallRisk] || RISK_STYLES.SAFE;
                  return (
                    <tr key={h.id} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(h.checkedAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-gray-700">{TYPE_LABEL[h.type] || h.type}</td>
                      <td className="py-2 pr-3 text-xs text-gray-500 break-all max-w-[140px]">{h.source}</td>
                      <td className="py-2 pr-3 text-gray-800 break-all max-w-xs">{h.contentPreview}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${style.className}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-700">
                        {h.topMatch ? (
                          <>
                            <div className="font-medium">{h.topMatch.title}</div>
                            <div className="text-gray-500">{h.topMatch.author} · {h.topMatch.license} · {(h.topMatch.score * 100).toFixed(1)}%</div>
                          </>
                        ) : (
                          <span className="text-gray-400">없음</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
