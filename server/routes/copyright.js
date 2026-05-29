const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  textSimilarity,
  audioSimilarity,
  codeSimilarity,
  videoSimilarity,
  riskLevel,
} = require('../utils/similarity');
const { computePHash, hashSimilarity } = require('../utils/imageHash');
const { computeAudioFingerprint } = require('../utils/audioHash');
const { computeVideoFingerprint } = require('../utils/videoHash');
const { readHistory, appendHistory, clearHistory } = require('../utils/history');
const { buildAttribution } = require('../utils/attribution');
const { apiKeyAuth } = require('../utils/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const DB = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'copyrightDB.json'), 'utf8')
);

const TYPE_FIELDS = {
  text: { field: 'excerpt', sim: textSimilarity },
  image: { field: 'phash', sim: hashSimilarity },
  audio: { field: 'fingerprint', sim: audioSimilarity },
  video: { field: 'fingerprint', sim: videoSimilarity },
  code: { field: 'snippet', sim: codeSimilarity },
};

router.use(apiKeyAuth({ required: false }));

function runCheck(type, content, { threshold = 0.15, topK = 5 } = {}) {
  const { field, sim } = TYPE_FIELDS[type];
  const matches = DB[type]
    .map((item) => {
      const score = sim(content, item[field]);
      return {
        id: item.id,
        title: item.title,
        author: item.author,
        year: item.year,
        license: item.license,
        reference: item[field],
        score: Number(score.toFixed(4)),
        risk: riskLevel(score, item.license),
      };
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const top = matches[0];
  const overallRisk = top ? top.risk : 'SAFE';

  return {
    type,
    checkedAt: new Date().toISOString(),
    overallRisk,
    matchCount: matches.length,
    matches,
    suggestion: buildSuggestion(overallRisk, top),
    attribution: buildAttribution(top),
  };
}

function buildSuggestion(risk, top) {
  if (!top || risk === 'SAFE') {
    return '유사한 등록 저작물이 발견되지 않았습니다. 그대로 사용하실 수 있어 보이지만 최종 책임은 사용자에게 있습니다.';
  }
  if (risk === 'LOW') {
    return `유사도가 낮지만 "${top.title}" (${top.author})와 일부 겹칩니다. 참고로 표기하거나 일부 표현을 수정하세요.`;
  }
  if (risk === 'MEDIUM') {
    return `"${top.title}" (${top.author}, ${top.license})와 중간 정도 유사합니다. 인용 표기를 추가하고 재구성을 권장합니다.`;
  }
  return `"${top.title}" (${top.author}, ${top.license})와 매우 유사합니다. 그대로 사용 시 저작권 침해 위험이 큽니다. 라이선스를 확인하거나 다른 표현으로 재작성하세요.`;
}

function preview(type, content) {
  const s = String(content || '');
  if (type === 'text' || type === 'code') {
    return s.length > 120 ? `${s.slice(0, 120)}…` : s;
  }
  return s;
}

router.get('/db/:type', (req, res) => {
  const { type } = req.params;
  if (!DB[type]) return res.status(404).json({ error: 'Unknown type' });
  res.json({ type, count: DB[type].length, items: DB[type] });
});

router.post('/check', (req, res) => {
  const { type, content, threshold, topK, source = 'manual' } = req.body || {};
  if (!type || !TYPE_FIELDS[type]) {
    return res.status(400).json({ error: 'type must be one of text/image/audio/video/code' });
  }
  if (content === undefined || content === null || content === '') {
    return res.status(400).json({ error: 'content is required' });
  }

  const result = runCheck(type, content, { threshold, topK });
  const record = appendHistory({
    type,
    source,
    apiKey: req.apiKey ? req.apiKey.name : null,
    contentPreview: preview(type, content),
    overallRisk: result.overallRisk,
    matchCount: result.matchCount,
    topMatch: result.matches[0] || null,
    checkedAt: result.checkedAt,
  });
  res.json({ ...result, historyId: record.id });
});

router.post('/check-batch', (req, res) => {
  const { items, threshold, topK, source = 'batch' } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array of { type, content }' });
  }
  if (items.length > 50) {
    return res.status(400).json({ error: 'batch size limited to 50 items' });
  }

  const results = items.map((item, index) => {
    const { type, content, label } = item || {};
    if (!type || !TYPE_FIELDS[type]) {
      return { index, label, error: 'invalid type' };
    }
    if (content === undefined || content === null || content === '') {
      return { index, label, error: 'content is required' };
    }
    const result = runCheck(type, content, { threshold, topK });
    appendHistory({
      type,
      source,
      contentPreview: preview(type, content),
      overallRisk: result.overallRisk,
      matchCount: result.matchCount,
      topMatch: result.matches[0] || null,
      checkedAt: result.checkedAt,
    });
    return { index, label, ...result };
  });

  const counts = { SAFE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, ERROR: 0 };
  for (const r of results) {
    if (r.error) counts.ERROR++;
    else if (counts[r.overallRisk] !== undefined) counts[r.overallRisk]++;
  }

  res.json({ total: results.length, counts, results });
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { type } = req.body || {};
    if (!type || !TYPE_FIELDS[type]) {
      return res.status(400).json({ error: 'type must be one of text/image/audio/video/code' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'file is required (multipart/form-data, field name "file")' });
    }

    let content;
    if (type === 'image') {
      content = await computePHash(req.file.buffer);
    } else if (type === 'audio') {
      content = computeAudioFingerprint(req.file.buffer);
    } else if (type === 'video') {
      content = computeVideoFingerprint(req.file.buffer);
    } else {
      content = req.file.buffer.toString('utf8');
    }

    const result = runCheck(type, content);
    const record = appendHistory({
      type,
      source: `upload:${req.file.originalname}`,
      contentPreview: preview(type, content),
      overallRisk: result.overallRisk,
      matchCount: result.matchCount,
      topMatch: result.matches[0] || null,
      checkedAt: result.checkedAt,
    });
    res.json({
      ...result,
      derivedContent: content,
      file: { name: req.file.originalname, size: req.file.size, mime: req.file.mimetype },
      historyId: record.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'upload processing failed' });
  }
});

router.get('/history', (_req, res) => {
  res.json({ items: readHistory() });
});

router.delete('/history', (_req, res) => {
  clearHistory();
  res.json({ ok: true });
});

router.get('/stats', (_req, res) => {
  const list = readHistory();
  const byType = {};
  const byRisk = { SAFE: 0, LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const h of list) {
    byType[h.type] = (byType[h.type] || 0) + 1;
    if (byRisk[h.overallRisk] !== undefined) byRisk[h.overallRisk]++;
  }
  res.json({ total: list.length, byType, byRisk });
});

module.exports = router;
