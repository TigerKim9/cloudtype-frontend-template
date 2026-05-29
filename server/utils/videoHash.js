const crypto = require('crypto');

function computeVideoFingerprint(buffer) {
  const len = buffer.length;
  if (len === 0) return '00000000000000000000000000000000';
  const slices = 4;
  const sliceLen = Math.max(1, Math.floor(len / slices));
  const parts = [];
  for (let i = 0; i < slices; i++) {
    const start = i * sliceLen;
    const end = i === slices - 1 ? len : start + sliceLen;
    const slice = buffer.subarray(start, end);
    const digest = crypto.createHash('md5').update(slice).digest('hex');
    parts.push(digest.slice(0, 8));
  }
  return parts.join('');
}

module.exports = { computeVideoFingerprint };
