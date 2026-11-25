// Run with Node.js from this directory: node timing-study.mjs
// The optional first argument identifies a local copy of the published engine.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const enginePath = process.argv[2] ?? new URL('./engine.js', import.meta.url);
const engine = await readFile(enginePath);
const { scenarios, simulate } = await import('data:text/javascript;base64,' + engine.toString('base64'));

function directBalance(scenario, delay, percent, day) {
  let cash = scenario.openingCash;
  for (const receipt of scenario.receipts) {
    const adjustable = receipt.id === scenario.adjustableReceiptId;
    const deposit = adjustable ? receipt.amount * percent / 100 : 0;
    if (day >= scenario.depositDay) cash += deposit;
    if (day >= receipt.day + (adjustable ? delay : 0)) cash += receipt.amount - deposit;
  }
  for (const outgoing of scenario.outgoings) if (day >= outgoing.day) cash -= outgoing.amount;
  return cash;
}
const rows = [['scenario','delay_days','receipt_day','first_negative_day_at_zero_deposit','minimum_balance_aud_at_zero_deposit','first_day_of_minimum_at_zero_deposit','day_30_balance_aud_at_zero_deposit','unreceived_at_day_30_aud_at_zero_deposit','smallest_whole_percent_deposit_for_nonnegative_day_ends','extra_opening_cash_aud_still_needed_at_50pct']];
let checks = 0;
for (const s of scenarios) {
  const invoice = s.receipts.find(r => r.id === s.adjustableReceiptId);
  for (let delay = 0; delay <= 21; delay++) {
    const runs = [];
    for (let percent = 0; percent <= 50; percent++) {
      const run = simulate(s,{invoiceDelayDays:delay,depositPercent:percent});
      for (const day of run.days) assert.equal(day.cash,directBalance(s,delay,percent,day.day));
      runs.push(run);
      checks++;
    }
    const zero = runs[0].summary;
    const threshold = runs.findIndex(r => r.summary.minimumCash >= 0);
    rows.push([s.id,delay,invoice.day + delay,zero.firstNegativeDay ?? '',zero.minimumCash,runs[0].days.find(d => d.cash === zero.minimumCash).day,zero.closingCash,zero.pendingReceiptsAmount,threshold === -1 ? 'outside_tested_range' : threshold,runs[50].summary.extraBufferNeeded]);
  }
}
assert.equal(checks,3366);
await writeFile(new URL('./timing-thresholds.csv',import.meta.url),rows.map(row=>row.join(',')).join('\n')+'\n');
console.log(checks+' settings reconciled day-by-day, '+(rows.length-1)+' summary rows written.');
