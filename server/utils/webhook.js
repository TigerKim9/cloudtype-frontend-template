const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'webhooks.json');
const LOG_PATH = path.join(__dirname, '..', 'data', 'webhook-log.json');
const MAX_LOG = 100;

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return [];
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeConfig(items) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(items, null, 2));
}

function readLog() {
  try {
    if (!fs.existsSync(LOG_PATH)) return [];
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function appendLog(entry) {
  const list = readLog();
  list.unshift(entry);
  if (list.length > MAX_LOG) list.length = MAX_LOG;
  fs.writeFileSync(LOG_PATH, JSON.stringify(list, null, 2));
}

function shouldFire(hook, payload) {
  if (!hook.active) return false;
  const evt = payload.event;
  if (!hook.events || !hook.events.includes(evt)) return false;
  if (hook.apiKeyFilter && payload.apiKey !== hook.apiKeyFilter) return false;
  if (evt === 'check.completed') {
    const minRisk = hook.minRisk;
    if (minRisk) {
      const order = { SAFE: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };
      if ((order[payload.result.overallRisk] || 0) < (order[minRisk] || 0)) return false;
    }
  }
  return true;
}

function sign(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function postJson(targetUrl, body, headers, timeoutMs) {
  return new Promise((resolve) => {
    let url;
    try {
      url = new URL(targetUrl);
    } catch {
      return resolve({ ok: false, error: 'invalid url' });
    }
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        headers: Object.assign(
          { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
          headers || {}
        ),
        timeout: timeoutMs || 5000,
      },
      (res) => {
        let chunks = '';
        res.on('data', (d) => (chunks += d.toString().slice(0, 2048)));
        res.on('end', () => resolve({ ok: res.statusCode < 400, status: res.statusCode, body: chunks.slice(0, 200) }));
      }
    );
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.write(body);
    req.end();
  });
}

async function dispatch(payload) {
  const hooks = readConfig().filter((h) => shouldFire(h, payload));
  const ts = new Date().toISOString();
  const fires = await Promise.all(
    hooks.map(async (h) => {
      const body = JSON.stringify({ ...payload, deliveredAt: ts });
      const headers = { 'X-Aicw-Event': payload.event };
      if (h.secret) headers['X-Aicw-Signature'] = sign(h.secret, body);
      const result = await postJson(h.url, body, headers, h.timeoutMs);
      const log = {
        id: 'WH-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
        hookId: h.id,
        url: h.url,
        event: payload.event,
        risk: payload.result ? payload.result.overallRisk : null,
        status: result.status || null,
        ok: result.ok,
        error: result.error || null,
        deliveredAt: ts,
      };
      appendLog(log);
      return log;
    })
  );
  return fires;
}

function addHook(input) {
  const hooks = readConfig();
  const id = 'WH-' + Date.now().toString(36);
  const hook = {
    id,
    url: input.url,
    name: input.name || 'unnamed',
    events: Array.isArray(input.events) && input.events.length ? input.events : ['check.completed'],
    minRisk: input.minRisk || 'HIGH',
    apiKeyFilter: input.apiKeyFilter || null,
    secret: input.secret || null,
    active: input.active !== false,
    timeoutMs: input.timeoutMs || 5000,
    createdAt: new Date().toISOString(),
  };
  hooks.push(hook);
  writeConfig(hooks);
  return hook;
}

function removeHook(id) {
  const hooks = readConfig();
  const next = hooks.filter((h) => h.id !== id);
  writeConfig(next);
  return next.length !== hooks.length;
}

module.exports = { readConfig, addHook, removeHook, dispatch, readLog };
