const listeners = new Set();
const buffer = [];
let config = { endpoint: null, send: false };
let authToken = null;

function notifyListeners() {
  for (const cb of listeners) {
    try {
      cb(buffer.slice());
    } catch (_) {}
  }
}

export function initLogging({ endpoint = null, token = null } = {}) {
  config.endpoint = endpoint;
  config.send = !!endpoint;
  if (token) authToken = token;
  log('info', 'logging-initialized', { endpoint: config.endpoint, hasToken: !!authToken });
}

export function setAuthToken(token) {
  authToken = token;
  log('info', 'auth-token-set', { hasToken: !!authToken });
}

function makeEntry(level, message, meta) {
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    meta: meta || {},
  };
}

async function sendToRemote(entry) {
  if (!config.send || !config.endpoint) return;
  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    buffer.push(makeEntry('error', 'log-send-failed', { originalId: entry.id, error: String(err) }));
  }
}

export async function log(level, message, meta) {
  const entry = makeEntry(level, message, meta);
  buffer.push(entry);
  notifyListeners();
  sendToRemote(entry).then(() => notifyListeners());
  return entry;
}

export async function fetchWithLogging(url, options = {}) {
  const reqMeta = {
    url,
    method: (options && options.method) || 'GET',
  };
  const start = Date.now();
  await log('info', 'request-start', { ...reqMeta });
  try {
    const headers = options && options.headers ? { ...options.headers } : {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const fetchOptions = { ...options, headers };
    const res = await fetch(url, fetchOptions);
    const duration = Date.now() - start;
    let bodySample = null;
    try {
      const cloned = res.clone();
      const text = await cloned.text();
      bodySample = text ? text.slice(0, 512) : null;
    } catch (_) {
      bodySample = null;
    }
    await log('info', 'request-success', {
      ...reqMeta,
      status: res.status,
      duration,
      bodySample,
    });
    return res;
  } catch (err) {
    const duration = Date.now() - start;
    await log('error', 'request-failure', { ...reqMeta, duration, error: String(err) });
    throw err;
  }
}

export function getBuffer() {
  return buffer.slice();
}

export function subscribe(cb) {
  listeners.add(cb);
  try {
    cb(buffer.slice());
  } catch (_) {}
  return () => listeners.delete(cb);
}

export default {
  initLogging,
  setAuthToken,
  log,
  fetchWithLogging,
  getBuffer,
  subscribe,
};