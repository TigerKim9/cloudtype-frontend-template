import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_COPYRIGHT_API || '/api/copyright';

const RISK_OPTIONS = ['SAFE', 'LOW', 'MEDIUM', 'HIGH'];

const WebhooksPage = () => {
  const [hooks, setHooks] = useState([]);
  const [log, setLog] = useState([]);
  const [form, setForm] = useState({
    name: '',
    url: '',
    minRisk: 'HIGH',
    apiKeyFilter: '',
    secret: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const [h, l] = await Promise.all([
        axios.get(`${API_BASE}/webhooks`),
        axios.get(`${API_BASE}/webhooks/log`),
      ]);
      setHooks(h.data.items || []);
      setLog(l.data.items || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await axios.post(`${API_BASE}/webhooks`, {
        ...form,
        events: ['check.completed'],
      });
      setForm({ name: '', url: '', minRisk: 'HIGH', apiKeyFilter: '', secret: '' });
      setInfo('웹훅이 등록되었습니다.');
      load();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('웹훅을 삭제할까요?')) return;
    await axios.delete(`${API_BASE}/webhooks/${id}`);
    load();
  };

  const test = async (id) => {
    setBusy(true);
    setInfo(null);
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE}/webhooks/${id}/test`);
      const fired = data.fired && data.fired[0];
      if (!fired) setInfo('테스트 트리거 조건과 일치하지 않습니다 (예: HIGH 필터).');
      else if (fired.ok) setInfo(`전송 성공 (status ${fired.status})`);
      else setInfo(`전송 실패: ${fired.error || fired.status}`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">
      <div className="bg-white rounded shadow p-5">
        <h2 className="text-xl font-bold text-gray-800 mb-1">웹훅 알림</h2>
        <p className="text-sm text-gray-600">
          검사 결과의 위험도가 임계치 이상일 때 외부 URL로 POST 알림을 보냅니다.
          서명(<code>X-Aicw-Signature</code>)을 위한 secret을 설정하면 HMAC-SHA256으로 페이로드를 검증할 수 있습니다.
        </p>
      </div>

      <form onSubmit={create} className="bg-white rounded shadow p-5 space-y-3">
        <h3 className="font-semibold text-gray-800">웹훅 등록</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="이름 (선택)"
            className="border border-gray-300 rounded p-2 text-sm"
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://your-host/webhook"
            className="border border-gray-300 rounded p-2 text-sm"
            required
          />
          <select
            value={form.minRisk}
            onChange={(e) => setForm({ ...form, minRisk: e.target.value })}
            className="border border-gray-300 rounded p-2 text-sm"
          >
            {RISK_OPTIONS.map((r) => (
              <option key={r} value={r}>최소 위험: {r}</option>
            ))}
          </select>
          <input
            value={form.apiKeyFilter}
            onChange={(e) => setForm({ ...form, apiKeyFilter: e.target.value })}
            placeholder="특정 API 키 이름으로 필터 (선택)"
            className="border border-gray-300 rounded p-2 text-sm"
          />
          <input
            value={form.secret}
            onChange={(e) => setForm({ ...form, secret: e.target.value })}
            placeholder="서명용 secret (선택)"
            className="border border-gray-300 rounded p-2 text-sm sm:col-span-2"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy || !form.url}
            className="px-4 py-2 rounded bg-gray-800 text-white text-sm disabled:opacity-40"
          >
            등록
          </button>
        </div>
      </form>

      {info && <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded p-3 text-sm">{info}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}

      <div className="bg-white rounded shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-2">등록된 웹훅 ({hooks.length})</h3>
        {hooks.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 웹훅이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">이름</th>
                  <th className="py-2 pr-3">URL</th>
                  <th className="py-2 pr-3">최소 위험</th>
                  <th className="py-2 pr-3">API 키 필터</th>
                  <th className="py-2 pr-3">동작</th>
                </tr>
              </thead>
              <tbody>
                {hooks.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-gray-800">{h.name}</td>
                    <td className="py-2 pr-3 text-xs text-gray-600 break-all max-w-xs">{h.url}</td>
                    <td className="py-2 pr-3">{h.minRisk}</td>
                    <td className="py-2 pr-3 text-xs text-gray-500">{h.apiKeyFilter || '-'}</td>
                    <td className="py-2 pr-3 space-x-2">
                      <button onClick={() => test(h.id)} className="text-xs text-indigo-600 underline">테스트</button>
                      <button onClick={() => remove(h.id)} className="text-xs text-red-600 underline">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-5">
        <h3 className="font-semibold text-gray-800 mb-2">최근 전송 로그</h3>
        {log.length === 0 ? (
          <p className="text-sm text-gray-500">전송 로그가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">시각</th>
                  <th className="py-2 pr-3">이벤트</th>
                  <th className="py-2 pr-3">위험</th>
                  <th className="py-2 pr-3">상태</th>
                  <th className="py-2 pr-3">URL</th>
                </tr>
              </thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{new Date(l.deliveredAt).toLocaleString()}</td>
                    <td className="py-2 pr-3">{l.event}</td>
                    <td className="py-2 pr-3">{l.risk || '-'}</td>
                    <td className="py-2 pr-3">
                      {l.ok ? (
                        <span className="text-green-700">✓ {l.status}</span>
                      ) : (
                        <span className="text-red-700">✗ {l.error || l.status}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-600 break-all max-w-xs">{l.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhooksPage;
