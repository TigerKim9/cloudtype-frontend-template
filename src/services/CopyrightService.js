import axios from 'axios';

const API_BASE = process.env.REACT_APP_COPYRIGHT_API || '/api/copyright';

export async function checkCopyright({ type, content, threshold, topK }) {
  const { data } = await axios.post(`${API_BASE}/check`, {
    type,
    content,
    threshold,
    topK,
  });
  return data;
}

export async function fetchDB(type) {
  const { data } = await axios.get(`${API_BASE}/db/${type}`);
  return data;
}

export const RISK_STYLES = {
  SAFE: { label: '안전', className: 'bg-green-100 text-green-800 border-green-300' },
  LOW: { label: '낮음', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  MEDIUM: { label: '중간', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  HIGH: { label: '높음', className: 'bg-red-100 text-red-800 border-red-300' },
};
