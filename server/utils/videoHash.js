const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { Jimp } = require('jimp');

let ffmpegAvailable = null;
function detectFfmpeg() {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  try {
    const res = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    ffmpegAvailable = res.status === 0;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

function computeHashFingerprint(buffer) {
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

async function computeFrameFingerprint(buffer) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aicw-video-'));
  const inputPath = path.join(tmpDir, 'in');
  const outPattern = path.join(tmpDir, 'frame-%02d.png');
  fs.writeFileSync(inputPath, buffer);
  try {
    const res = spawnSync(
      'ffmpeg',
      ['-y', '-i', inputPath, '-vf', 'fps=1/2,scale=64:64', '-frames:v', '4', outPattern],
      { stdio: 'ignore' }
    );
    if (res.status !== 0) throw new Error('ffmpeg failed');
    const frames = fs
      .readdirSync(tmpDir)
      .filter((f) => f.startsWith('frame-') && f.endsWith('.png'))
      .sort()
      .slice(0, 4);
    if (frames.length === 0) throw new Error('no frames extracted');
    const parts = [];
    for (const f of frames) {
      const img = await Jimp.read(path.join(tmpDir, f));
      const hash = img.pHash();
      let hex = '';
      for (let i = 0; i < hash.length; i += 4) {
        hex += parseInt(hash.slice(i, i + 4).padEnd(4, '0'), 2).toString(16);
      }
      parts.push(hex.slice(0, 8).padEnd(8, '0'));
    }
    while (parts.length < 4) parts.push('00000000');
    return parts.join('');
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

async function computeVideoFingerprint(buffer) {
  if (detectFfmpeg()) {
    try {
      return await computeFrameFingerprint(buffer);
    } catch {
      return computeHashFingerprint(buffer);
    }
  }
  return computeHashFingerprint(buffer);
}

function computeVideoFingerprintSync(buffer) {
  return computeHashFingerprint(buffer);
}

module.exports = {
  computeVideoFingerprint,
  computeVideoFingerprintSync,
  isFfmpegAvailable: detectFfmpeg,
};
