const fs = require('fs');
const path = require('path');

const HISTORY_PATH = path.join(__dirname, '..', 'data', 'history.json');
const MAX_ENTRIES = 200;

function readHistory() {
  try {
    if (!fs.existsSync(HISTORY_PATH)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeHistory(entries) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(entries, null, 2));
}

function appendHistory(entry) {
  const list = readHistory();
  const id = `H-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const record = { id, ...entry };
  list.unshift(record);
  if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
  writeHistory(list);
  return record;
}

function clearHistory() {
  writeHistory([]);
}

module.exports = { readHistory, appendHistory, clearHistory };
