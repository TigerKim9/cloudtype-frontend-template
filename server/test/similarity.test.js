const test = require('node:test');
const assert = require('node:assert');
const {
  textSimilarity,
  hammingSimilarity,
  audioSimilarity,
  codeSimilarity,
  riskLevel,
} = require('../utils/similarity');
const { buildAttribution } = require('../utils/attribution');
const { computeAudioFingerprint } = require('../utils/audioHash');

test('textSimilarity: identical text scores 1', () => {
  const s = '님은 갔습니다. 아아 사랑하는 나의 님은 갔습니다.';
  assert.strictEqual(textSimilarity(s, s), 1);
});

test('textSimilarity: unrelated text scores low', () => {
  const score = textSimilarity('오늘 점심은 김치찌개', 'The quick brown fox');
  assert.ok(score < 0.15, `expected < 0.15, got ${score}`);
});

test('hammingSimilarity: identical hashes score 1', () => {
  const h = '1101001110100110';
  assert.strictEqual(hammingSimilarity(h, h), 1);
});

test('hammingSimilarity: half-different hashes score ~0.5', () => {
  const a = '11110000';
  const b = '11111111';
  assert.strictEqual(hammingSimilarity(a, b), 0.5);
});

test('audioSimilarity: identical melody scores 1', () => {
  const m = 'C-D-E-C-G-A-G';
  assert.strictEqual(audioSimilarity(m, m), 1);
});

test('codeSimilarity: identical snippet scores 1', () => {
  const c = 'const [count, setCount] = useState(0);';
  assert.strictEqual(codeSimilarity(c, c), 1);
});

test('codeSimilarity: whitespace-insensitive', () => {
  const a = 'const x = 1;';
  const b = 'const    x   =   1;';
  assert.ok(codeSimilarity(a, b) > 0.9, 'whitespace should be normalized');
});

test('riskLevel: high similarity proprietary -> HIGH', () => {
  assert.strictEqual(riskLevel(0.9, 'MIT'), 'HIGH');
});

test('riskLevel: high similarity public domain -> LOW', () => {
  assert.strictEqual(riskLevel(0.9, 'Public Domain'), 'LOW');
});

test('riskLevel: low similarity -> SAFE', () => {
  assert.strictEqual(riskLevel(0.05, 'MIT'), 'SAFE');
});

test('buildAttribution: MIT template', () => {
  const text = buildAttribution({
    title: 'X', author: 'Y', year: 2020, license: 'MIT',
  });
  assert.match(text, /MIT License/);
});

test('buildAttribution: All Rights Reserved template', () => {
  const text = buildAttribution({
    title: 'X', author: 'Y', year: 2020, license: 'All Rights Reserved',
  });
  assert.match(text, /All Rights Reserved/);
});

test('buildAttribution: null match -> null', () => {
  assert.strictEqual(buildAttribution(null), null);
});

test('computeAudioFingerprint: deterministic and uses note alphabet', () => {
  const buf = Buffer.from('hello world');
  const fp1 = computeAudioFingerprint(buf);
  const fp2 = computeAudioFingerprint(buf);
  assert.strictEqual(fp1, fp2, 'fingerprint must be deterministic');
  assert.match(fp1, /^[A-G](-[A-G])*$/, 'fingerprint should be note sequence');
});
