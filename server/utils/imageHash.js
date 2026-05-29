const { Jimp } = require('jimp');

async function computePHash(buffer) {
  const img = await Jimp.read(buffer);
  return img.pHash();
}

function hashSimilarity(a, b) {
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

module.exports = { computePHash, hashSimilarity };
