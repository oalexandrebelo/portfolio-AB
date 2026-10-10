/* Primitivas compartilhadas pela UI e por testes; sem acesso a dados ou credenciais. */
(function (root) {
  'use strict';
  function minorToInput(value) {
    const amount = BigInt(value);
    if (amount < 0n || amount > 9000000000000n) throw new Error('MONEY_RANGE');
    return String(amount / 100n) + ',' + String(amount % 100n).padStart(2, '0');
  }
  function inputToMinor(value) {
    const text = String(value).trim();
    if (!/^\d{1,11}([.,]\d{1,2})?$/.test(text)) throw new Error('MONEY_FORMAT');
    const [whole, cents = ''] = text.replace(',', '.').split('.');
    const amount = BigInt(whole) * 100n + BigInt(cents.padEnd(2, '0'));
    if (amount > 9000000000000n) throw new Error('MONEY_RANGE');
    return Number(amount);
  }
  class CommandIntent {
    constructor() { this.id = null; this.payload = null; this.state = 'draft'; }
    prepare(payload) {
      const encoded = JSON.stringify(payload);
      if ((this.state === 'pending' || this.state === 'unknown') && encoded !== this.payload) throw new Error('RECONCILE_REQUIRED');
      if (encoded !== this.payload) { this.id = root.crypto.randomUUID(); this.payload = encoded; this.state = 'draft'; }
      return this.id;
    }
    sent() {
      if (!this.id || !this.payload || this.state === 'committed') throw new Error('COMMAND_STATE');
      this.state = 'pending';
    }
    failed(uncertain) { this.state = uncertain ? 'unknown' : 'rejected'; }
    committed() { this.state = 'committed'; }
    reconcile(state) {
      if (state === 'committed') this.committed();
      else if (state === 'not_observed') this.state = 'unknown';
      else throw new Error('RECEIPT_STATE');
    }
  }
  const api = Object.freeze({minorToInput, inputToMinor, CommandIntent});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.defineProperty(root, 'ABAllinoneState', {value: api, writable: false});
})(globalThis);
