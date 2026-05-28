const crypto = require('crypto');

function bucketByte(b) {
  const buckets = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  return buckets[b % buckets.length];
}

function computeAudioFingerprint(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest();
  const notes = [];
  const stride = Math.max(1, Math.floor(hash.length / 12));
  for (let i = 0; i < hash.length; i += stride) {
    notes.push(bucketByte(hash[i]));
  }
  return notes.join('-');
}

module.exports = { computeAudioFingerprint };
