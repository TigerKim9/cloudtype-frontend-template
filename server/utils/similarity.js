function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\s\p{P}]+/gu, ' ')
    .trim();
}

function ngrams(s, n = 3) {
  const text = normalizeText(s).replace(/\s+/g, ' ');
  const grams = new Set();
  if (text.length < n) {
    if (text) grams.add(text);
    return grams;
  }
  for (let i = 0; i <= text.length - n; i++) {
    grams.add(text.slice(i, i + n));
  }
  return grams;
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function textSimilarity(a, b) {
  return jaccard(ngrams(a), ngrams(b));
}

function hammingSimilarity(a, b) {
  const x = String(a || '');
  const y = String(b || '');
  const len = Math.max(x.length, y.length);
  if (len === 0) return 0;
  let diff = Math.abs(x.length - y.length);
  const min = Math.min(x.length, y.length);
  for (let i = 0; i < min; i++) {
    if (x[i] !== y[i]) diff++;
  }
  return 1 - diff / len;
}

function audioSimilarity(a, b) {
  const seqA = normalizeText(a).split(/[-\s]+/).filter(Boolean);
  const seqB = normalizeText(b).split(/[-\s]+/).filter(Boolean);
  if (!seqA.length || !seqB.length) return 0;
  const setA = new Set();
  const setB = new Set();
  for (let i = 0; i < seqA.length - 1; i++) setA.add(seqA[i] + seqA[i + 1]);
  for (let i = 0; i < seqB.length - 1; i++) setB.add(seqB[i] + seqB[i + 1]);
  if (!setA.size || !setB.size) {
    const a1 = new Set(seqA);
    const b1 = new Set(seqB);
    return jaccard(a1, b1);
  }
  return jaccard(setA, setB);
}

function codeSimilarity(a, b) {
  const stripA = String(a || '').replace(/\s+/g, ' ').trim();
  const stripB = String(b || '').replace(/\s+/g, ' ').trim();
  return jaccard(ngrams(stripA, 5), ngrams(stripB, 5));
}

function videoSimilarity(a, b) {
  const x = String(a || '').toLowerCase();
  const y = String(b || '').toLowerCase();
  if (!x || !y) return 0;
  const chunkLen = 8;
  const setA = new Set();
  const setB = new Set();
  for (let i = 0; i + chunkLen <= x.length; i += chunkLen) setA.add(x.slice(i, i + chunkLen));
  for (let i = 0; i + chunkLen <= y.length; i += chunkLen) setB.add(y.slice(i, i + chunkLen));
  if (!setA.size || !setB.size) return 0;
  return jaccard(setA, setB);
}

function riskLevel(score, license) {
  const isPublicDomain = /public domain|cc0/i.test(license || '');
  if (score >= 0.6 && !isPublicDomain) return 'HIGH';
  if (score >= 0.3 && !isPublicDomain) return 'MEDIUM';
  if (score >= 0.6 && isPublicDomain) return 'LOW';
  if (score >= 0.15) return 'LOW';
  return 'SAFE';
}

module.exports = {
  textSimilarity,
  hammingSimilarity,
  audioSimilarity,
  codeSimilarity,
  videoSimilarity,
  riskLevel,
};
