import React, { useState } from 'react';
import { checkCopyright, uploadAndCheck } from '../services/CopyrightService';
import ResultDisplay from './ResultDisplay';

const TYPES = [
  {
    key: 'text',
    label: '텍스트',
    placeholder: 'AI로 생성한 글, 시, 소설 일부를 붙여넣으세요.',
    inputType: 'textarea',
    accept: '.txt,text/plain',
    hint: '한국어/영어 모두 지원. 3-gram Jaccard 유사도로 검사합니다.',
    supportsUpload: true,
  },
  {
    key: 'image',
    label: '이미지',
    placeholder: 'pHash 직접 입력 또는 파일을 업로드하면 자동 계산',
    inputType: 'text',
    accept: 'image/*',
    hint: '파일 업로드 시 Jimp의 pHash로 64-bit perceptual hash를 계산해 DB와 비교합니다.',
    supportsUpload: true,
  },
  {
    key: 'audio',
    label: '음악/오디오',
    placeholder: '음표 시퀀스 (예: C-D-E-C) 또는 오디오 파일 업로드',
    inputType: 'text',
    accept: 'audio/*',
    hint: '파일 업로드 시 SHA-256 기반 음표 시퀀스 지문을 생성합니다.',
    supportsUpload: true,
  },
  {
    key: 'code',
    label: '코드',
    placeholder: 'AI가 생성한 코드 스니펫을 붙여넣으세요.',
    inputType: 'textarea',
    accept: '.js,.ts,.py,.java,.c,.cpp,.go,.rs,text/plain',
    hint: '5-gram Jaccard 유사도로 등록 코드와 비교합니다.',
    supportsUpload: true,
  },
];

const CopyrightChecker = () => {
  const [type, setType] = useState('text');
  const [mode, setMode] = useState('text');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const current = TYPES.find((t) => t.key === type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data;
      if (mode === 'file') {
        if (!file) {
          setError('파일을 선택해 주세요.');
          setLoading(false);
          return;
        }
        data = await uploadAndCheck({ type, file });
      } else {
        if (!content.trim()) {
          setError('내용을 입력해 주세요.');
          setLoading(false);
          return;
        }
        data = await checkCopyright({ type, content });
      }
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || '서버 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (key) => {
    setType(key);
    setContent('');
    setFile(null);
    setResult(null);
    setError(null);
    if (key === 'image' || key === 'audio') setMode('file');
    else setMode('text');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      <div className="bg-white rounded shadow p-5">
        <h2 className="text-xl font-bold text-gray-800 mb-1">AI 저작권 연동 검사</h2>
        <p className="text-sm text-gray-600">
          AI가 생성한 콘텐츠를 등록된 저작물 DB와 대조해 침해 위험과 라이선스 정보를 알려드립니다.
        </p>
      </div>

      <div className="bg-white rounded shadow p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTypeChange(t.key)}
              className={`px-4 py-2 rounded border text-sm font-medium transition ${
                type === t.key
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4 text-xs">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-3 py-1 rounded border ${mode === 'text' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600'}`}
          >
            직접 입력
          </button>
          {current.supportsUpload && (
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`px-3 py-1 rounded border ${mode === 'file' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600'}`}
            >
              파일 업로드
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'file' ? (
            <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
              <input
                type="file"
                accept={current.accept}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block mx-auto text-sm"
              />
              {file && (
                <p className="mt-2 text-xs text-gray-600">
                  {file.name} · {Math.round(file.size / 1024)} KB · {file.type || 'unknown'}
                </p>
              )}
            </div>
          ) : current.inputType === 'textarea' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={current.placeholder}
              className="w-full h-40 border border-gray-300 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          ) : (
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={current.placeholder}
              className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          )}
          <p className="text-xs text-gray-500">{current.hint}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setContent(''); setFile(null); setResult(null); setError(null); }}
              className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-gray-800 text-white text-sm font-medium disabled:opacity-40"
            >
              {loading ? '검사 중…' : '저작권 검사'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {error}
        </div>
      )}

      {result && <ResultDisplay result={result} />}
    </div>
  );
};

export default CopyrightChecker;
