const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  textSimilarity,
  hammingSimilarity,
  audioSimilarity,
  codeSimilarity,
  riskLevel,
} = require('../utils/similarity');

const router = express.Router();
const DB = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'copyrightDB.json'), 'utf8')
);

const TYPE_FIELDS = {
  text: { field: 'excerpt', sim: textSimilarity },
  image: { field: 'phash', sim: hammingSimilarity },
  audio: { field: 'fingerprint', sim: audioSimilarity },
  code: { field: 'snippet', sim: codeSimilarity },
};

router.get('/db/:type', (req, res) => {
  const { type } = req.params;
  if (!DB[type]) return res.status(404).json({ error: 'Unknown type' });
  res.json({ type, count: DB[type].length, items: DB[type] });
});

router.post('/check', (req, res) => {
  const { type, content, threshold = 0.15, topK = 5 } = req.body || {};
  if (!type || !TYPE_FIELDS[type]) {
    return res.status(400).json({ error: 'type must be one of text/image/audio/code' });
  }
  if (content === undefined || content === null || content === '') {
    return res.status(400).json({ error: 'content is required' });
  }

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

  res.json({
    type,
    checkedAt: new Date().toISOString(),
    overallRisk,
    matchCount: matches.length,
    matches,
    suggestion: buildSuggestion(overallRisk, top),
  });
});

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

module.exports = router;
