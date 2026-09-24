// ================================================================
// CLASS PAYMENT — allocation engine for monthly gym fees
// ================================================================
const moment  = require('moment');
const Payment = require('../db_schema/payment');
const Client  = require('../db_schema/client');

class PaymentService {

  // ----------------------------------------------------------
  // Build list of YYYY-MM strings from start -> end (inclusive)
  // ----------------------------------------------------------
  monthsBetween(startDate, endMonth) {
    const out = [];
    if (!startDate) return [endMonth];
    let m = moment(startDate, 'YYYY-MM-DD').startOf('month');
    const end = moment(endMonth, 'YYYY-MM').startOf('month');
    while (m.isSameOrBefore(end)) {
      out.push(m.format('YYYY-MM'));
      m.add(1, 'month');
    }
    return out;
  }

  // ----------------------------------------------------------
  // How much has been allocated to a specific month?
  // ----------------------------------------------------------
  async paidForMonth(clientId, month) {
    const r = await Payment.aggregate([
      { $match: { clientId } },
      { $unwind: '$allocations' },
      { $match: { 'allocations.month': month } },
      { $group: { _id: null, total: { $sum: '$allocations.amount' } } }
    ]);
    return r[0]?.total || 0;
  }

  // ----------------------------------------------------------
  // Recompute the client's summary block from the ledger
  // ----------------------------------------------------------
  async recomputeSummary(client) {
    const rate    = client.membership?.rate || 500;
    const curMon  = client.payment.currentMonth;
    const paid    = await this.paidForMonth(client._id, curMon);
    const due     = Math.max(0, rate - paid);

    client.payment.paidThisMonth = paid;
    client.payment.dueThisMonth  = due;
    client.payment.status =
      paid >= rate ? 'Paid' :
      paid > 0     ? 'Partial' :
                     'Unpaid';

    // Balance = sum of allocations to months AFTER currentMonth
    const future = await Payment.aggregate([
      { $match: { clientId: client._id } },
      { $unwind: '$allocations' },
      { $match: { 'allocations.month': { $gt: curMon } } },
      { $group: { _id: null, total: { $sum: '$allocations.amount' } } }
    ]);
    client.payment.balance = future[0]?.total || 0;

    return client;
  }

  // ----------------------------------------------------------
  // Lazy month rollover. Call on every list/get.
  // ----------------------------------------------------------
  async rollMonth(client) {
    const currentMonth = moment().format('YYYY-MM');
    if (client.payment.currentMonth === currentMonth) return client;

    client.payment.currentMonth  = currentMonth;
    client.payment.paidThisMonth = 0;
    client.payment.dueThisMonth  = client.membership?.rate || 500;

    // If they have credit from a previous prepayment,
    // we DON'T auto-create allocation records here — the payment
    // records already contain forward allocations for future months.
    // Just recompute the summary for the new month.
    await this.recomputeSummary(client);
    client.LastUpdate = moment().format('YYYY-MM-DD HH:mm:ss');
    await client.save();
    return client;
  }

  // ----------------------------------------------------------
  // Record a payment and auto-allocate to oldest unpaid months first
  // ----------------------------------------------------------
  async recordPayment(client, amount, meta) {
    const rate = client.membership?.rate || 500;
    const now  = moment();
    const time = now.format('YYYY-MM-DD HH:mm:ss');
    const year = now.format('YYYY');

    let remaining = Number(amount);
    const allocations = [];

    // 1) Oldest unpaid month first (from membership start)
    const months = this.monthsBetween(client.membership.startDate, client.payment.currentMonth);

    for (const m of months) {
      if (remaining <= 0) break;
      const already = await this.paidForMonth(client._id, m);
      const owed    = Math.max(0, rate - already);
      if (owed <= 0) continue;
      const apply = Math.min(owed, remaining);
      allocations.push({ month: m, amount: apply });
      remaining -= apply;
    }

    // 2) Any leftover → prepay future months
    let cursor = moment(client.payment.currentMonth, 'YYYY-MM');
    while (remaining > 0) {
      cursor.add(1, 'month');
      const fm    = cursor.format('YYYY-MM');
      const apply = Math.min(rate, remaining);
      allocations.push({ month: fm, amount: apply });
      remaining -= apply;
    }

    // 3) Save the payment record
    const payment = await Payment.create({
      clientId : client._id,
      UserID   : client.UserID,
      FirstName: client.FirstName,
      LastName : client.LastName,
      amount   : Number(amount),
      method   : meta.method || 'Cash',
      paidAt   : time,
      paidBy   : meta.paidBy || 'admin',
      note     : meta.note || '',
      allocations,
      year,
      balanceAfter: 0
    });

    // 4) Update client summary
    client.payment.lastPaidAt = time;
    await this.recomputeSummary(client);
    client.LastUpdate     = time;
    client.LastUpdateUser = meta.paidBy || 'admin';
    await client.save();

    // 5) Write back real balance to the payment record
    payment.balanceAfter = client.payment.balance;
    await payment.save();

    return { payment, client };
  }

  // ----------------------------------------------------------
  // Reverse (mark unpaid) — deletes current month allocations
  // ----------------------------------------------------------
  async clearMonth(client, month) {
    const payments = await Payment.find({ clientId: client._id });
    for (const p of payments) {
      const before = p.allocations.length;
      p.allocations = p.allocations.filter(a => a.month !== month);
      if (p.allocations.length !== before) {
        p.amount = p.allocations.reduce((s, a) => s + a.amount, 0);
        await p.save();
      }
    }
    await this.recomputeSummary(client);
    client.LastUpdate = moment().format('YYYY-MM-DD HH:mm:ss');
    await client.save();
    return client;
  }

  // ----------------------------------------------------------
  // Full year ledger for a client
  // ----------------------------------------------------------
  async getYearLedger(client, year) {
    const rate = client.membership?.rate || 500;
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(`${year}-${String(i).padStart(2, '0')}`);
    }

    const paid = await Payment.aggregate([
      { $match: { clientId: client._id } },
      { $unwind: '$allocations' },
      { $match: { 'allocations.month': { $in: months } } },
      { $group: { _id: '$allocations.month', total: { $sum: '$allocations.amount' } } }
    ]);
    const map = Object.fromEntries(paid.map(p => [p._id, p.total]));

    return months.map(m => {
      const p = map[m] || 0;
      return {
        month : m,
        rate,
        paid  : p,
        due   : Math.max(0, rate - p),
        status: p >= rate ? 'Paid' : (p > 0 ? 'Partial' : 'Unpaid')
      };
    });
  }

  async listPayments(clientId) {
    return Payment.find({ clientId }).sort({ paidAt: -1 });
  }
}

module.exports = PaymentService;