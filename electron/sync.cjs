const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let options = null;
let queue = [];
let flushing = false;
let retryTimer = null;
let bootstrapTimer = null;
let pendingBootstrap = null;

function configure({ baseUrl, dataDir, pharmacyId = 'zada-pharmacy', branchId = 'main' }) {
  options = { baseUrl: String(baseUrl || '').replace(/\/$/, ''), dataDir, pharmacyId, branchId };
  if (!options.baseUrl) return { enabled: false };
  loadQueue();
  schedule(1000);
  return { enabled: true, baseUrl: options.baseUrl };
}

function queuePath() { return path.join(options.dataDir, 'ceo-sync-outbox.json'); }
function loadQueue() {
  try { queue = JSON.parse(fs.readFileSync(queuePath(), 'utf8')); }
  catch (_) { queue = []; }
}
function persist() {
  if (!options?.baseUrl) return;
  fs.writeFileSync(queuePath(), JSON.stringify(queue, null, 2));
}
function schedule(delay = 15000) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => flush().catch(() => {}), delay);
}

function enqueue(eventType, payload) {
  if (!options?.baseUrl) return { queued: false, disabled: true };
  queue.push({ eventId: crypto.randomUUID(), eventType, eventVersion: 1, pharmacyId: options.pharmacyId, branchId: options.branchId, occurredAt: new Date().toISOString(), payload });
  persist();
  flush().catch(() => {});
  return { queued: true };
}

async function post(route, body) {
  const response = await fetch(`${options.baseUrl}${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`CEO sync failed (${response.status})`);
  return response.json();
}

async function flush() {
  if (!options?.baseUrl || flushing) return;
  flushing = true;
  try {
    while (queue.length) {
      await post('/api/v1/sync/events', queue[0]);
      queue.shift();
      persist();
    }
  } finally {
    flushing = false;
    if (queue.length) schedule();
  }
}

async function bootstrap(payload) {
  if (!options?.baseUrl) return { skipped: true };
  pendingBootstrap = payload;
  try {
    const result = await post('/api/v1/sync/bootstrap', { pharmacyId: options.pharmacyId, branchId: options.branchId, ...payload });
    pendingBootstrap = null;
    clearTimeout(bootstrapTimer);
    return result;
  } catch (error) {
    clearTimeout(bootstrapTimer);
    bootstrapTimer = setTimeout(() => {
      if (pendingBootstrap) bootstrap(pendingBootstrap).catch(() => {});
    }, 15000);
    throw error;
  }
}

function status() { return { enabled: Boolean(options?.baseUrl), baseUrl: options?.baseUrl || '', pending: queue.length, syncing: flushing }; }
module.exports = { configure, enqueue, bootstrap, flush, status };
