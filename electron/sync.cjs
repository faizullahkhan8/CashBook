const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let options = null;
let queue = [];
let flushing = false;
let retryTimer = null;
let bootstrapTimer = null;
let pendingBootstrap = null;

function logSync(msg) {
  try {
    const debugPath = path.join(__dirname, '../debug_electron.log');
    fs.appendFileSync(debugPath, `[${new Date().toISOString()}] [SYNC] ${msg}\n`);
  } catch (_) {}
}

function configure({ baseUrl, dataDir, pharmacyId = 'zada-pharmacy', branchId = 'main' }) {
  options = { baseUrl: String(baseUrl || '').replace(/\/$/, ''), dataDir, pharmacyId, branchId };
  if (!options.baseUrl) {
    logSync('Sync configured with NO baseUrl - sync disabled');
    return { enabled: false };
  }
  logSync(`Sync enabled for baseUrl=${options.baseUrl}, pharmacyId=${pharmacyId}, branchId=${branchId}`);
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
  if (!options?.baseUrl) {
    logSync(`Cannot enqueue ${eventType}: baseUrl is missing`);
    return { queued: false, disabled: true };
  }
  queue.push({ eventId: crypto.randomUUID(), eventType, eventVersion: 1, pharmacyId: options.pharmacyId, branchId: options.branchId, occurredAt: new Date().toISOString(), payload });
  logSync(`Enqueued ${eventType} (queue length: ${queue.length})`);
  persist();
  flush().catch(() => {});
  return { queued: true };
}

async function post(route, body) {
  const response = await fetch(`${options.baseUrl}${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`CEO sync failed (${response.status})`);
  return response.json();
}

async function flush() {
  if (!options?.baseUrl || flushing) return;
  flushing = true;
  try {
    while (queue.length) {
      const item = queue[0];
      await post('/api/v1/sync/events', item);
      logSync(`Synced ${item.eventType} (${item.eventId}) successfully`);
      queue.shift();
      persist();
    }
  } catch (err) {
    logSync(`Flush error: ${err.message}`);
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
