const EVENT_NAMES = Object.freeze({
  LEDGER_CREATED: 'v1.ledger.created',
  LEDGER_UPDATED: 'v1.ledger.updated',
  LEDGER_DELETED: 'v1.ledger.deleted',
  SHORT_ITEM_CREATED: 'v1.short-item.created',
  SHORT_ITEM_UPDATED: 'v1.short-item.updated',
  SHORT_ITEM_DELETED: 'v1.short-item.deleted',
  CLOSING_CREATED: 'v1.closing.created',
  CLOSING_UPDATED: 'v1.closing.updated',
  CLOSING_VOIDED: 'v1.closing.voided',
  DASHBOARD_UPDATED: 'v1.dashboard.updated',
  SYNC_STATUS: 'v1.system.sync-status',
});

module.exports = EVENT_NAMES;
