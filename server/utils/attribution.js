const LICENSE_TEMPLATES = {
  'public domain': ({ title, author, year }) =>
    `"${title}" (${author}, ${year}) — Public Domain. 출처 표기는 권장되지만 의무는 아닙니다.`,
  cc0: ({ title, author, year }) =>
    `"${title}" (${author}, ${year}) — CC0 1.0. 자유 이용 가능, 출처 표기 권장.`,
  'cc-by': ({ title, author, year }) =>
    `"${title}" by ${author} (${year}) is licensed under CC BY 4.0. 출처 표기 필수.`,
  mit: ({ title, author, year }) =>
    `Based on "${title}" by ${author} (${year}), licensed under the MIT License. 라이선스 전문 포함 필수.`,
  'gpl-2.0': ({ title, author, year }) =>
    `Derived from "${title}" by ${author} (${year}), licensed under GPL-2.0. 파생물도 GPL-2.0으로 공개해야 합니다.`,
  'all rights reserved': ({ title, author }) =>
    `"${title}" © ${author}. All Rights Reserved. 사용 전 권리자 허락 필요.`,
};

function normalizeKey(license) {
  const s = String(license || '').toLowerCase().trim();
  if (s.includes('public domain')) return 'public domain';
  if (s.includes('cc0')) return 'cc0';
  if (s.includes('cc-by') || s.includes('cc by')) return 'cc-by';
  if (s === 'mit') return 'mit';
  if (s.includes('gpl-2')) return 'gpl-2.0';
  if (s.includes('all rights')) return 'all rights reserved';
  return null;
}

function buildAttribution(match) {
  if (!match) return null;
  const key = normalizeKey(match.license);
  const tmpl = key && LICENSE_TEMPLATES[key];
  if (!tmpl) {
    return `"${match.title}" (${match.author}, ${match.year}) — 라이선스: ${match.license}. 사용 전 약관을 확인하세요.`;
  }
  return tmpl(match);
}

module.exports = { buildAttribution };
