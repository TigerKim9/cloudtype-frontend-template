const test = require('node:test');
const assert = require('node:assert');
const {
  textSimilarity,
  hammingSimilarity,
  audioSimilarity,
  codeSimilarity,
  videoSimilarity,
  riskLevel,
} = require('../utils/similarity');
const { buildAttribution } = require('../utils/attribution');
const { computeAudioFingerprint } = require('../utils/audioHash');
const { computeVideoFingerprint, computeVideoFingerprintSync } = require('../utils/videoHash');

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

test('videoSimilarity: identical fingerprints score 1', () => {
  const fp = 'ab12cd34ef56ab12cd34ef56ab12cd34';
  assert.strictEqual(videoSimilarity(fp, fp), 1);
});

test('videoSimilarity: different fingerprints score low', () => {
  const a = 'ab12cd34ef56ab12cd34ef56ab12cd34';
  const b = 'ffffffffaaaaaaaa1111111122222222';
  assert.ok(videoSimilarity(a, b) < 0.2);
});

test('computeVideoFingerprintSync: deterministic 32-hex', () => {
  const buf = Buffer.alloc(1024, 0xab);
  const fp1 = computeVideoFingerprintSync(buf);
  const fp2 = computeVideoFingerprintSync(buf);
  assert.strictEqual(fp1, fp2);
  assert.strictEqual(fp1.length, 32);
  assert.match(fp1, /^[0-9a-f]+$/);
});

test('computeVideoFingerprint: async returns 32-hex (falls back when no ffmpeg)', async () => {
  const buf = Buffer.alloc(1024, 0xcd);
  const fp = await computeVideoFingerprint(buf);
  assert.strictEqual(typeof fp, 'string');
  assert.strictEqual(fp.length, 32);
  assert.match(fp, /^[0-9a-f]+$/);
});
